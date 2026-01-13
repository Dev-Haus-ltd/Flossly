// API route for transcription summarization only
import OpenAI from "openai";

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, "name");

  if (name === "summarize") {
    return await handleSummarize(event);
  }

  return { code: 1, message: "Invalid endpoint" };
});

// Initialize OpenAI client
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

// Summarize transcription using OpenAI
async function handleSummarize(event) {
  try {
    const body = await readBody(event);
    const { text } = body;

    if (!text || !text.trim()) {
      return {
        code: 1,
        message: "No text provided for summarization",
      };
    }

    // Initialize OpenAI client
    const client = initializeOpenAIClient();
    const model = "gpt-4o-mini"; // or "gpt-4o" for higher quality

    // Create a prompt that focuses on removing useless text and keeping only relevant content
    const prompt = `Please summarize the following transcription. Remove any useless text, filler words, repeated phrases, and irrelevant information. Keep only the meaningful and important content. Maintain proper grammar and clarity. If the transcription contains a conversation, preserve the key points and main ideas.

Transcription:
${text}

Summary:`;

    console.log("[Summarize] Generating summary...");

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
      return {
        code: 1,
        message: "Failed to generate summary",
      };
    }

    console.log("[Summarize] Summary generated successfully");

    return {
      code: 0,
      message: "Transcription summarized successfully",
      data: {
        summary: summarizedText,
        originalLength: text.length,
        summaryLength: summarizedText.length,
      },
    };
  } catch (err) {
    console.error("[Summarize] Error:", err);

    if (err.message && err.message.includes("OPENAI_API_KEY")) {
      return {
        code: 1,
        message: "OpenAI API key not configured. Please set OPENAI_API_KEY.",
      };
    }

    if (err.status === 401 || err.statusCode === 401) {
      return {
        code: 1,
        message: "Invalid OpenAI API key. Please check OPENAI_API_KEY.",
      };
    }
    
    if (err.status === 429 || err.statusCode === 429) {
      return {
        code: 1,
        message: "API rate limit exceeded. Please try again later.",
      };
    }

    // Handle OpenAI error response structure
    if (err.error) {
      const errorMessage = err.error.message || err.message || "Failed to summarize transcription.";
      return {
        code: 1,
        message: errorMessage,
      };
    }

    return {
      code: 1,
      message: err.message || "Failed to summarize transcription. Please try again.",
    };
  }
}
