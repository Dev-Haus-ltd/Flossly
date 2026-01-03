import formidable from "formidable";
import fs from "fs";
import { success, error } from "../utils/response";
import { createError, setCookie, getCookie, readBody } from "h3";
import crypto from "crypto";
import OpenAI from "openai";
import {
  setSessionMetadata,
  getSessionMetadata,
  getSessionProcessId,
  deleteSession,
  updateSessionMetadata,
} from "../utils/redis.js";

// Google Cloud Speech-to-Text client
let speechClient = null;
let SpeechClient = null;

const initializeSpeechClient = async () => {
  if (speechClient) return speechClient;
  
  try {
    const config = useRuntimeConfig();
    const credentialsPath = config.GOOGLE_APPLICATION_CREDENTIALS;
    
    if (!credentialsPath) {
      throw new Error("GOOGLE_APPLICATION_CREDENTIALS not configured");
    }

    // Set the credentials path for Google Cloud
    process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;

    // Dynamically import @google-cloud/speech
    if (!SpeechClient) {
      const speechModule = await import("@google-cloud/speech");
      SpeechClient = speechModule.v1?.SpeechClient || speechModule.SpeechClient;
    }
    
    speechClient = new SpeechClient();
    
    return speechClient;
  } catch (err) {
    console.error("Error initializing Google Speech client:", err);
    throw new Error("Failed to initialize Google Speech-to-Text client");
  }
};

export const transcribeAudio = async (event) => {
  try {
    // Parse form data
    const form = formidable({
      multiples: false,
      keepExtensions: true,
    });

    const { files, fields } = await new Promise((resolve, reject) => {
      form.parse(event.node.req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ files, fields });
      });
    });

    const audioFile = files.audio;
    if (!audioFile) {
      return error(400, "No audio file provided");
    }

    // Check if file is an array (formidable can return arrays)
    const file = Array.isArray(audioFile) ? audioFile[0] : audioFile;

    if (!file) {
      return error(400, "Invalid audio file");
    }

    // Read audio file
    const audioBytes = fs.readFileSync(file.filepath);
    
    // Detect audio format from mimetype or filename
    const mimetype = file.mimetype || "";
    const filename = file.originalFilename || "";
    let encoding = "WEBM_OPUS"; // Default
    let sampleRate = 48000; // Default
    
    // Detect encoding based on mimetype or file extension
    if (mimetype.includes("webm") || filename.toLowerCase().endsWith(".webm")) {
      encoding = "WEBM_OPUS";
      sampleRate = 48000;
    } else if (mimetype.includes("wav") || filename.toLowerCase().endsWith(".wav")) {
      encoding = "LINEAR16";
      sampleRate = 16000;
    } else if (mimetype.includes("mp3") || filename.toLowerCase().endsWith(".mp3")) {
      encoding = "MP3";
      sampleRate = 44100;
    } else if (mimetype.includes("flac") || filename.toLowerCase().endsWith(".flac")) {
      encoding = "FLAC";
      sampleRate = 44100;
    }
    
    // Initialize Google Speech client
    const client = await initializeSpeechClient();

    // Configure recognition request
    const request = {
      audio: {
        content: audioBytes.toString("base64"),
      },
      config: {
        encoding: encoding,
        sampleRateHertz: sampleRate,
        languageCode: "en-US", // You can make this configurable
        alternativeLanguageCodes: ["en-GB"], // Optional: support multiple languages
        enableAutomaticPunctuation: true,
        enableWordTimeOffsets: false, // Set to true if you need word-level timestamps
        model: "default", // You can use "phone_call" or "video" for better accuracy
      },
    };

    // Perform transcription
    const [response] = await client.recognize(request);
    
    // Clean up uploaded file
    try {
      fs.unlinkSync(file.filepath);
    } catch (unlinkErr) {
      console.warn("Failed to delete temporary file:", unlinkErr);
    }

    // Extract transcription text
    if (!response.results || response.results.length === 0) {
      return error(400, "No transcription results found. Please ensure the audio contains speech.");
    }

    const transcription = response.results
      .map((result) => result.alternatives[0].transcript)
      .join(" ");

    if (!transcription || transcription.trim().length === 0) {
      return error(400, "Transcription is empty. Please ensure the audio contains clear speech.");
    }

    return success({
      text: transcription.trim(),
      confidence: response.results[0].alternatives[0].confidence || null,
    });
  } catch (err) {
    console.error("Transcription error:", err);
    
    // Handle specific Google Cloud errors
    if (err.message && err.message.includes("GOOGLE_APPLICATION_CREDENTIALS")) {
      return error(500, "Google Cloud credentials not configured. Please check environment variables.");
    }
    
    if (err.message && err.message.includes("Invalid audio")) {
      return error(400, "Invalid audio format. Please ensure the audio file is valid.");
    }

    return error(500, err.message || "Failed to transcribe audio. Please try again.");
  }
};

// Store active streaming sessions (local memory for streams only)
// Note: Streams can't be serialized, so we keep them in local memory
// Session metadata is stored in Redis for cross-process coordination
const streamingSessions = new Map(); // Only stores recognizeStream objects

// Start streaming transcription session (GET request for SSE)
export const streamTranscribeAudio = async (event) => {
  let sessionId = null;
  try {
    // Set headers for Server-Sent Events with proper CORS
    setHeader(event, "Content-Type", "text/event-stream");
    setHeader(event, "Cache-Control", "no-cache");
    setHeader(event, "Connection", "keep-alive");
    setHeader(event, "Access-Control-Allow-Origin", "*");
    setHeader(event, "Access-Control-Allow-Methods", "GET, OPTIONS");
    setHeader(event, "Access-Control-Allow-Headers", "Cache-Control");
    setHeader(event, "X-Accel-Buffering", "no"); // Disable nginx buffering

    // Generate session ID
    sessionId = crypto.randomUUID();
    
    // Set a cookie with the sessionId for sticky session routing in nginx
    // This ensures all requests for this session go to the same process
    setCookie(event, 'transcription_session', sessionId, {
      httpOnly: false, // Allow JavaScript to read it if needed
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600, // 1 hour
      path: '/'
    });
    
    // Store session metadata in Redis for cross-process coordination
    const sessionMetadata = {
      recognizeStream: null, // Will be stored locally, not in Redis
      configSent: false,
      ready: false,
      errored: false,
      error: null,
      processId: process.pid,
      createdAt: new Date().toISOString()
    };
    
    // Store metadata in Redis (stream will be added to local memory later)
    try {
      await setSessionMetadata(sessionId, sessionMetadata, 3600);
      console.log(`[${sessionId}] ✅ Session metadata stored in Redis. Process: ${process.pid}`);
    } catch (redisErr) {
      console.warn(`[${sessionId}] ⚠️ Failed to store session in Redis, continuing with local only:`, redisErr.message);
    }
    
    // Create local placeholder for the stream (will be populated later)
    streamingSessions.set(sessionId, null);
    
    console.log(`[${sessionId}] Session created in process ${process.pid}. Total local sessions: ${streamingSessions.size}`);
    
    // Send session ID immediately to client (before any async operations)
    // This ensures the client receives it even if there are delays in initialization
    if (!event.node.res.writableEnded) {
      event.node.res.write(`data: ${JSON.stringify({ sessionId })}\n\n`);
    }
    
    // Initialize Google Speech client
    const client = await initializeSpeechClient();

    // Configure streaming recognition
    // Use string enum value for encoding when passing to streamingRecognize()
    const config = {
      encoding: "WEBM_OPUS", // String enum value
      sampleRateHertz: 48000,
      languageCode: "en-US",
      alternativeLanguageCodes: ["en-GB"],
      enableAutomaticPunctuation: true,
      enableWordTimeOffsets: false,
      model: "default",
    };

    // Start streaming recognition - pass config directly
    const recognizeStream = client.streamingRecognize({
      config: config,
      interimResults: true,
    });

    // Store the stream in local memory (can't serialize to Redis)
    streamingSessions.set(sessionId, recognizeStream);
    
    // Update session metadata in Redis
    try {
      await updateSessionMetadata(sessionId, {
        configSent: true,
        processId: process.pid,
      }, 3600);
      console.log(`[${sessionId}] Session updated with recognizeStream. Total local sessions: ${streamingSessions.size}`);
    } catch (redisErr) {
      console.warn(`[${sessionId}] Failed to update session in Redis:`, redisErr.message);
    }

    // Set up error handler
    recognizeStream.on("error", async (err) => {
      console.error(`[${sessionId}] Streaming recognition error:`, err);
      
      // Update Redis with error state
      try {
        await updateSessionMetadata(sessionId, {
          errored: true,
          error: err.message,
        }, 3600);
      } catch (redisErr) {
        console.warn(`[${sessionId}] Failed to update error in Redis:`, redisErr.message);
      }
      
      const errorData = JSON.stringify({
        error: err.message || "Streaming recognition failed",
      });
      if (!event.node.res.writableEnded) {
        event.node.res.write(`data: ${errorData}\n\n`);
        event.node.res.end();
      }
      // Delete session after a delay
      setTimeout(async () => {
        streamingSessions.delete(sessionId);
        try {
          await deleteSession(sessionId);
        } catch (redisErr) {
          console.warn(`[${sessionId}] Failed to delete session from Redis:`, redisErr.message);
        }
      }, 1000);
    });

    console.log(`[${sessionId}] Streaming recognition started with config`);

    // Wait a moment to ensure config is processed and stream is ready
    await new Promise(resolve => setTimeout(resolve, 200));

    // Verify stream is still writable before marking as ready
    const currentStream = streamingSessions.get(sessionId);
    if (!currentStream) {
      // Session was deleted, send error
      const errorData = JSON.stringify({
        error: "Session initialization failed",
      });
      event.node.res.write(`data: ${errorData}\n\n`);
      event.node.res.end();
      try {
        await deleteSession(sessionId);
      } catch (redisErr) {
        console.warn(`[${sessionId}] Failed to delete session from Redis:`, redisErr.message);
      }
      return;
    }

    // Check if stream is still valid
    if (currentStream.destroyed) {
      const errorData = JSON.stringify({
        error: "Stream initialization failed",
      });
      event.node.res.write(`data: ${errorData}\n\n`);
      event.node.res.end();
      streamingSessions.delete(sessionId);
      try {
        await deleteSession(sessionId);
      } catch (redisErr) {
        console.warn(`[${sessionId}] Failed to delete session from Redis:`, redisErr.message);
      }
      return;
    }

    // Mark as ready to accept chunks in Redis
    try {
      await updateSessionMetadata(sessionId, {
        ready: true,
      }, 3600);
      console.log(`[${sessionId}] Stream is now ready to accept chunks. Total local sessions: ${streamingSessions.size}`);
    } catch (redisErr) {
      console.warn(`[${sessionId}] Failed to update ready state in Redis:`, redisErr.message);
    }

    // Session ID already sent above, no need to send again

    // Track processed results to prevent duplicates
    const processedResults = new Set();
    
    // Handle transcription results
    recognizeStream.on("data", (response) => {
      if (response.results && response.results.length > 0) {
        // Process all results, not just the first one
        for (const result of response.results) {
          if (result.alternatives && result.alternatives.length > 0) {
            const transcript = result.alternatives[0].transcript;
            // Check if result is final (isFinalTranscript or isFinal property)
            const isFinal = result.isFinalTranscript !== undefined 
              ? result.isFinalTranscript 
              : (result.isFinal !== undefined ? result.isFinal : false);

            // Create a unique key for this result to prevent duplicates
            const resultKey = `${isFinal ? 'final' : 'interim'}:${transcript.trim()}`;
            
            // Skip if we've already sent this exact result
            if (processedResults.has(resultKey)) {
              console.log(`[${sessionId}] Skipping duplicate result:`, transcript);
              continue;
            }
            
            // Mark as processed
            processedResults.add(resultKey);

            // Send result via SSE
            const data = JSON.stringify({
              text: transcript,
              isFinal: isFinal,
              confidence: result.alternatives[0].confidence || null,
            });

            event.node.res.write(`data: ${data}\n\n`);
          }
        }
      }
    });

    // Error handler already set up above, before writing config

    recognizeStream.on("end", async () => {
      event.node.res.end();
      streamingSessions.delete(sessionId);
      try {
        await deleteSession(sessionId);
      } catch (redisErr) {
        console.warn(`[${sessionId}] Failed to delete session from Redis:`, redisErr.message);
      }
    });

    // Handle request close
    event.node.req.on("close", async () => {
      recognizeStream.destroy();
      streamingSessions.delete(sessionId);
      try {
        await deleteSession(sessionId);
      } catch (redisErr) {
        console.warn(`[${sessionId}] Failed to delete session from Redis:`, redisErr.message);
      }
      if (!event.node.res.writableEnded) {
        event.node.res.end();
      }
    });
  } catch (err) {
    console.error("Streaming transcription error:", err);
    
    // Clean up session if it was created
    if (sessionId) {
      streamingSessions.delete(sessionId);
      try {
        await deleteSession(sessionId);
      } catch (redisErr) {
        console.warn(`[${sessionId}] Failed to delete session from Redis:`, redisErr.message);
      }
    }
    
    const errorData = JSON.stringify({
      error: err.message || "Failed to start streaming transcription",
    });
    if (!event.node.res.writableEnded) {
      event.node.res.write(`data: ${errorData}\n\n`);
      event.node.res.end();
    }
  }
};

// Send audio chunk to streaming session (POST request)
export const streamTranscribeChunk = async (event) => {
  let sessionId = null;
  try {
    // Log which process is handling this request
    const clientIP = event.node.req.headers['x-real-ip'] || event.node.req.socket.remoteAddress;
    console.log(`[CHUNK] Request received in process ${process.pid} from IP: ${clientIP}`);
    // Parse request body
    let body;
    try {
      body = await readBody(event);
    } catch (bodyErr) {
      console.error("Error parsing request body:", bodyErr);
      throw createError({
        statusCode: 400,
        data: {
          code: 1,
          success: false,
          message: "Failed to parse request body: " + (bodyErr.message || String(bodyErr)),
        },
      });
    }

    if (!body || typeof body !== 'object') {
      console.error("Invalid body type:", typeof body);
      throw createError({
        statusCode: 400,
        data: {
          code: 1,
          success: false,
          message: "Invalid request body",
        },
      });
    }

    // Try to get sessionId from request body first, then fallback to cookie
    sessionId = body.sessionId || getCookie(event, 'transcription_session');
    const chunk = body.chunk;

    if (!sessionId) {
      console.error("Missing sessionId in request body and cookie");
      throw createError({
        statusCode: 400,
        data: {
          code: 1,
          success: false,
          message: "Missing sessionId",
        },
      });
    }

    if (!chunk) {
      console.error(`[${sessionId}] Missing chunk in request body`);
      throw createError({
        statusCode: 400,
        data: {
          code: 1,
          success: false,
          message: "Missing chunk",
        },
      });
    }

    // Validate chunk is a string
    if (typeof chunk !== 'string') {
      console.error(`[${sessionId}] Invalid chunk type:`, typeof chunk);
      throw createError({
        statusCode: 400,
        data: {
          code: 1,
          success: false,
          message: "Chunk must be a string",
        },
      });
    }

    // Check Redis first to see if session exists and which process owns it
    let sessionMetadata = null;
    let sessionProcessId = null;
    
    try {
      sessionMetadata = await getSessionMetadata(sessionId);
      sessionProcessId = await getSessionProcessId(sessionId);
      if (sessionMetadata) {
        console.log(`[${sessionId}] ✅ Session found in Redis. Owner process: ${sessionProcessId}, Current process: ${process.pid}`);
      } else {
        console.log(`[${sessionId}] ⚠️ Session NOT found in Redis, checking local memory only`);
      }
    } catch (redisErr) {
      console.warn(`[${sessionId}] ⚠️ Failed to check Redis, falling back to local only:`, redisErr.message);
    }
    
    // Check if session exists in Redis
    if (!sessionMetadata) {
      // Check local memory as fallback
      const localStream = streamingSessions.get(sessionId);
      if (!localStream) {
        console.error(`[${sessionId}] Session not found in Redis or local memory. Process ${process.pid}`);
        throw createError({
          statusCode: 404,
          data: {
            code: 1,
            success: false,
            message: "Session not found. Please restart the transcription.",
          },
        });
      }
    }
    
    // Check if session is in a different process
    if (sessionProcessId && sessionProcessId !== process.pid) {
      console.warn(`[${sessionId}] Session owned by process ${sessionProcessId}, but chunk received in process ${process.pid}. Sticky sessions may not be working correctly.`);
      // With sticky sessions, this shouldn't happen, but we'll still try local memory
    }
    
    // Get the stream from local memory (streams can't be in Redis)
    const recognizeStream = streamingSessions.get(sessionId);
    if (!recognizeStream) {
      console.error(`[${sessionId}] Session exists in Redis but stream not found in local memory. Process ${process.pid}`);
      throw createError({
        statusCode: 404,
        data: {
          code: 1,
          success: false,
          message: "Stream not found in this process. Please ensure sticky sessions are configured correctly.",
        },
      });
    }

    // Check if session has errored (from Redis metadata)
    if (sessionMetadata?.errored) {
      console.error(`[${sessionId}] Session has errored:`, sessionMetadata.error);
      throw createError({
        statusCode: 500,
        data: {
          code: 1,
          success: false,
          message: "Session error: " + (sessionMetadata.error || "Streaming failed"),
        },
      });
    }

    // Ensure config has been sent and stream is ready before sending audio
    if (sessionMetadata && !sessionMetadata.configSent) {
      console.error(`[${sessionId}] Config not sent yet`);
      throw createError({
        statusCode: 400,
        data: {
          code: 1,
          success: false,
          message: "Config not sent yet",
        },
      });
    }

    if (sessionMetadata && !sessionMetadata.ready) {
      // Wait a bit for stream to be ready
      let attempts = 0;
      while (attempts < 20) {
        // Re-check Redis for ready state
        try {
          const updatedMetadata = await getSessionMetadata(sessionId);
          if (updatedMetadata?.ready || updatedMetadata?.errored) {
            if (updatedMetadata.errored) {
              throw createError({
                statusCode: 500,
                data: {
                  code: 1,
                  success: false,
                  message: "Session error: " + (updatedMetadata.error || "Streaming failed"),
                },
              });
            }
            if (updatedMetadata.ready) {
              break;
            }
          }
        } catch (redisErr) {
          console.warn(`[${sessionId}] Failed to check Redis ready state:`, redisErr.message);
        }
        
        await new Promise(resolve => setTimeout(resolve, 50));
        attempts++;
      }
      
      // Final check
      const finalMetadata = await getSessionMetadata(sessionId).catch(() => null);
      if (finalMetadata && !finalMetadata.ready) {
        console.error(`[${sessionId}] Stream not ready after waiting`);
        throw createError({
          statusCode: 400,
          data: {
            code: 1,
            success: false,
            message: "Stream not ready yet",
          },
        });
      }
    }

    // Convert base64 chunk to buffer
    let audioBuffer;
    try {
      audioBuffer = Buffer.from(chunk, 'base64');
      if (audioBuffer.length === 0) {
        console.error(`[${sessionId}] Decoded buffer is empty`);
        throw createError({
          statusCode: 400,
          data: {
            code: 1,
            success: false,
            message: "Invalid chunk: decoded buffer is empty",
          },
        });
      }
    } catch (bufferErr) {
      console.error(`[${sessionId}] Error decoding base64 chunk:`, bufferErr);
      throw createError({
        statusCode: 400,
        data: {
          code: 1,
          success: false,
          message: "Invalid chunk format: " + (bufferErr.message || String(bufferErr)),
        },
      });
    }

    // Check stream state before writing
    if (!recognizeStream) {
      console.error(`[${sessionId}] recognizeStream is null before write`);
      throw createError({
        statusCode: 500,
        data: {
          code: 1,
          success: false,
          message: "Stream is not available",
        },
      });
    }

    const isWritable = recognizeStream.writable !== false;
    const isDestroyed = recognizeStream.destroyed === true;
    const isErrored = sessionMetadata?.errored || false;

    if (!isWritable || isDestroyed || isErrored) {
      console.error(`[${sessionId}] Stream state - writable: ${isWritable}, destroyed: ${isDestroyed}, errored: ${isErrored}`);
      if (isErrored) {
        throw createError({
          statusCode: 500,
          data: {
            code: 1,
            success: false,
            message: "Session error: " + (sessionMetadata?.error || "Streaming failed"),
          },
        });
      }
      throw createError({
        statusCode: 400,
        data: {
          code: 1,
          success: false,
          message: "Stream is not writable or destroyed",
        },
      });
    }

    // Send raw audio buffer directly to Google Cloud
    try {
      console.log(`[${sessionId}] Sending audio chunk (${audioBuffer.length} bytes) to process ${process.pid}`);
      // Write raw buffer directly
      const writeResult = recognizeStream.write(audioBuffer);
      
      if (!writeResult) {
        // Stream is backpressured, wait a bit
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      console.log(`[${sessionId}] Audio chunk written successfully`);
      return success({ received: true });
    } catch (writeErr) {
      console.error(`[${sessionId}] Error writing to stream:`, writeErr);
      console.error(`[${sessionId}] Stream error details:`, {
        message: writeErr.message || String(writeErr),
        stack: writeErr.stack,
        code: writeErr.code,
        name: writeErr.name
      });
      
      // Mark session as errored in Redis
      try {
        await updateSessionMetadata(sessionId, {
          errored: true,
          error: writeErr.message || String(writeErr),
        }, 3600);
      } catch (redisErr) {
        console.warn(`[${sessionId}] Failed to update error in Redis:`, redisErr.message);
      }
      
      // Delete session after a delay
      setTimeout(async () => {
        streamingSessions.delete(sessionId);
        try {
          await deleteSession(sessionId);
        } catch (redisErr) {
          console.warn(`[${sessionId}] Failed to delete session from Redis:`, redisErr.message);
        }
      }, 1000);
      
      const errorMessage = writeErr.message || String(writeErr) || "Failed to write audio chunk";
      throw createError({
        statusCode: 500,
        data: {
          code: 1,
          success: false,
          message: "Failed to write audio chunk: " + errorMessage,
        },
      });
    }
  } catch (err) {
    // Check if this is already a createError (from our error() function)
    if (err.statusCode && err.data) {
      // Re-throw createError as-is
      throw err;
    }
    
    console.error(`[${sessionId || 'unknown'}] Error sending chunk:`, err);
    console.error(`[${sessionId || 'unknown'}] Error details:`, {
      message: err.message || String(err),
      stack: err.stack,
      name: err.name,
      code: err.code
    });
    
    const errorMessage = err.message || String(err) || "Failed to send chunk";
    throw createError({
      statusCode: 500,
      data: {
        code: 1,
        success: false,
        message: errorMessage,
      },
    });
  }
};

// Initialize OpenAI client using official OpenAI platform
let openaiClient = null;

const initializeOpenAIClient = () => {
  if (openaiClient) return openaiClient;
  try {
    const config = useRuntimeConfig();
    const apiKey = config.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    openaiClient = new OpenAI({ apiKey });
    return openaiClient;
  } catch (err) {
    console.error("Error initializing OpenAI client:", err);
    throw new Error("Failed to initialize OpenAI client");
  }
};

// Summarize transcription text
export const summarizeTranscription = async (event) => {
  try {
    const body = await readBody(event);
    const { text } = body;

    if (!text || !text.trim()) {
      return error(400, "No text provided for summarization");
    }

    // Initialize OpenAI client
    const client = initializeOpenAIClient();
    const model = "gpt-4o-mini"; // or "gpt-4o" for higher quality

    // Create a prompt that focuses on removing useless text and keeping only relevant content
    const prompt = `Please summarize the following transcription. Remove any useless text, filler words, repeated phrases, and irrelevant information. Keep only the meaningful and important content. Maintain proper grammar and clarity. If the transcription contains a conversation, preserve the key points and main ideas.

Transcription:
${text}

Summary:`;

    // Call OpenAI Chat Completions API
    const response = await client.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that summarizes transcriptions by removing filler words, repetitions, and irrelevant content while preserving all meaningful information."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: model,
      temperature: 0.3, // Lower temperature for more focused, consistent summaries
      max_tokens: 2000, // Adjust based on your needs
    });

    const summarizedText = response.choices[0]?.message?.content?.trim();

    if (!summarizedText) {
      return error(500, "Failed to generate summary");
    }

    return success({
      summary: summarizedText,
      originalLength: text.length,
      summaryLength: summarizedText.length,
    });
  } catch (err) {
    console.error("Summarization error:", err);

    if (err.message && err.message.includes("OPENAI_API_KEY")) {
      return error(500, "OpenAI API key not configured. Please set OPENAI_API_KEY.");
    }

    if (err.status === 401 || err.statusCode === 401) {
      return error(401, "Invalid OpenAI API key. Please check OPENAI_API_KEY.");
    }
    
    if (err.status === 429 || err.statusCode === 429) {
      return error(429, "API rate limit exceeded. Please try again later.");
    }

    // Handle OpenAI error response structure
    if (err.error) {
      const errorMessage = err.error.message || err.message || "Failed to summarize transcription.";
      return error(err.status || err.statusCode || 500, errorMessage);
    }

    return error(500, err.message || "Failed to summarize transcription. Please try again.");
  }
};

