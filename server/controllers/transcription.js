import formidable from "formidable";
import fs from "fs";
import path from "path";
import { success, error } from "../utils/response";
import { createError } from "h3";

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

