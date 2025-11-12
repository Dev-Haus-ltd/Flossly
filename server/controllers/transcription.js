import formidable from "formidable";
import fs from "fs";
import path from "path";
import { success, error } from "../utils/response";
import { createError, setCookie } from "h3";
import crypto from "crypto";
import OpenAI from "openai";

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

// Store active streaming sessions
const streamingSessions = new Map();

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
    
    // Create a placeholder session entry immediately to prevent race conditions
    // This ensures chunks can be queued even if they arrive before full initialization
    streamingSessions.set(sessionId, {
      recognizeStream: null,
      configSent: false,
      ready: false,
      errored: false,
      error: null,
      processId: process.pid,
      createdAt: new Date().toISOString()
    });
    
    console.log(`[${sessionId}] Session created in process ${process.pid}. Total sessions: ${streamingSessions.size}`);
    
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

    // Update the existing session entry with the recognize stream
    const session = streamingSessions.get(sessionId);
    if (session) {
      session.recognizeStream = recognizeStream;
      session.configSent = true; // Config is sent via streamingRecognize()
      console.log(`[${sessionId}] Session updated with recognizeStream. Total active sessions: ${streamingSessions.size}`);
    } else {
      // Fallback: create new session if it was somehow deleted
      console.warn(`[${sessionId}] Session was deleted before stream initialization, creating new one`);
      streamingSessions.set(sessionId, { 
        recognizeStream,
        configSent: true,
        ready: false,
        errored: false,
        error: null
      });
    }

    // Set up error handler
    recognizeStream.on("error", (err) => {
      console.error(`[${sessionId}] Streaming recognition error:`, err);
      const session = streamingSessions.get(sessionId);
      if (session) {
        session.errored = true;
        session.error = err.message;
      }
      const errorData = JSON.stringify({
        error: err.message || "Streaming recognition failed",
      });
      if (!event.node.res.writableEnded) {
        event.node.res.write(`data: ${errorData}\n\n`);
        event.node.res.end();
      }
      // Delete session after a delay
      setTimeout(() => {
        streamingSessions.delete(sessionId);
      }, 1000);
    });

    console.log(`[${sessionId}] Streaming recognition started with config`);

    // Wait a moment to ensure config is processed and stream is ready
    await new Promise(resolve => setTimeout(resolve, 200));

    // Verify stream is still writable before marking as ready
    // Reuse the session variable from above
    const currentSession = streamingSessions.get(sessionId);
    if (!currentSession) {
      // Session was deleted, send error
      const errorData = JSON.stringify({
        error: "Session initialization failed",
      });
      event.node.res.write(`data: ${errorData}\n\n`);
      event.node.res.end();
      return;
    }

    // Check if stream is still valid
    if (!currentSession.recognizeStream || currentSession.recognizeStream.destroyed) {
      const errorData = JSON.stringify({
        error: "Stream initialization failed",
      });
      event.node.res.write(`data: ${errorData}\n\n`);
      event.node.res.end();
      streamingSessions.delete(sessionId);
      return;
    }

    // Mark as ready to accept chunks
    currentSession.ready = true;
    console.log(`[${sessionId}] Stream is now ready to accept chunks. Total active sessions: ${streamingSessions.size}`);

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

    recognizeStream.on("end", () => {
      event.node.res.end();
      streamingSessions.delete(sessionId);
    });

    // Handle request close
    event.node.req.on("close", () => {
      recognizeStream.destroy();
      streamingSessions.delete(sessionId);
      if (!event.node.res.writableEnded) {
        event.node.res.end();
      }
    });
  } catch (err) {
    console.error("Streaming transcription error:", err);
    
    // Clean up session if it was created
    if (sessionId) {
      streamingSessions.delete(sessionId);
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

    sessionId = body.sessionId;
    const chunk = body.chunk;

    if (!sessionId) {
      console.error("Missing sessionId in request body");
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

    const session = streamingSessions.get(sessionId);
    if (!session) {
      console.error(`[${sessionId}] Session not found in process ${process.pid}. Active sessions in this process:`, Array.from(streamingSessions.keys()));
      console.error(`[${sessionId}] This means the chunk request hit a different process than where the session was created.`);
      console.error(`[${sessionId}] Check if nginx sticky sessions (ip_hash) are configured correctly.`);
      throw createError({
        statusCode: 404,
        data: {
          code: 1,
          success: false,
          message: "Session not found. Please restart the transcription.",
        },
      });
    }
    
    // Log process ID mismatch for debugging
    if (session.processId !== process.pid) {
      console.warn(`[${sessionId}] WARNING: Session created in process ${session.processId}, but chunk received in process ${process.pid}. Sticky sessions may not be working!`);
    } else {
      console.log(`[${sessionId}] Chunk received in correct process ${process.pid} (session owner: ${session.processId})`);
    }

    if (!session.recognizeStream) {
      console.error(`[${sessionId}] Session exists but recognizeStream is null`);
      throw createError({
        statusCode: 404,
        data: {
          code: 1,
          success: false,
          message: "Stream not initialized for this session",
        },
      });
    }

    // Check if session has errored
    if (session.errored) {
      console.error(`[${sessionId}] Session has errored:`, session.error);
      throw createError({
        statusCode: 500,
        data: {
          code: 1,
          success: false,
          message: "Session error: " + (session.error || "Streaming failed"),
        },
      });
    }

    // Ensure config has been sent and stream is ready before sending audio
    if (!session.configSent) {
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

    if (!session.ready) {
      // Wait a bit for stream to be ready
      let attempts = 0;
      while (!session.ready && !session.errored && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 50));
        attempts++;
      }
      if (session.errored) {
        console.error(`[${sessionId}] Session errored while waiting for ready state`);
        throw createError({
          statusCode: 500,
          data: {
            code: 1,
            success: false,
            message: "Session error: " + (session.error || "Streaming failed"),
          },
        });
      }
      if (!session.ready) {
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
    if (!session.recognizeStream) {
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

    const stream = session.recognizeStream;
    const isWritable = stream.writable !== false;
    const isDestroyed = stream.destroyed === true;

    if (!isWritable || isDestroyed || session.errored) {
      console.error(`[${sessionId}] Stream state - writable: ${isWritable}, destroyed: ${isDestroyed}, errored: ${session.errored}`);
      if (session.errored) {
        throw createError({
          statusCode: 500,
          data: {
            code: 1,
            success: false,
            message: "Session error: " + (session.error || "Streaming failed"),
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
      console.log(`[${sessionId}] Sending audio chunk (${audioBuffer.length} bytes)`);
      // Write raw buffer directly
      const writeResult = stream.write(audioBuffer);
      
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
      // Mark session as errored but don't delete immediately
      session.errored = true;
      session.error = writeErr.message || String(writeErr);
      // Delete session after a delay
      setTimeout(() => {
        streamingSessions.delete(sessionId);
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

// Initialize GitHub AI Inference client using OpenAI SDK
let githubClient = null;

const initializeGitHubClient = () => {
  if (githubClient) return githubClient;
  
  try {
    const config = useRuntimeConfig();
    const token = config.GITHUB_TOKEN;
    
    if (!token) {
      throw new Error("GITHUB_TOKEN not configured");
    }

    const endpoint = "https://models.github.ai/inference";
    githubClient = new OpenAI({
      baseURL: endpoint,
      apiKey: token
    });
    
    return githubClient;
  } catch (err) {
    console.error("Error initializing GitHub AI client:", err);
    throw new Error("Failed to initialize GitHub AI client");
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

    // Initialize GitHub AI client
    const client = initializeGitHubClient();
    const model = "openai/gpt-4o";

    // Create a prompt that focuses on removing useless text and keeping only relevant content
    const prompt = `Please summarize the following transcription. Remove any useless text, filler words, repeated phrases, and irrelevant information. Keep only the meaningful and important content. Maintain proper grammar and clarity. If the transcription contains a conversation, preserve the key points and main ideas.

Transcription:
${text}

Summary:`;

    // Call GitHub AI Inference API using OpenAI SDK
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
    
    // Handle specific GitHub token errors
    if (err.message && err.message.includes("GITHUB_TOKEN")) {
      return error(500, "GitHub token not configured. Please check environment variables.");
    }
    
    // Handle OpenAI API errors
    if (err.status === 401 || err.statusCode === 401) {
      return error(401, "Invalid GitHub token. Please check your configuration.");
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

