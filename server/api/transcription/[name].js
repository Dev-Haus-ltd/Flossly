import { summarize } from "~/server/utils/aiWrapper";

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, "name");

  if (name === "summarize") {
    return await handleSummarize(event);
  }

  return { code: 1, message: "Invalid endpoint" };
});

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

    console.log("[Summarize] Generating summary...");

    const result = await summarize({ text });

    if (!result.summary) {
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
        summary: result.summary,
        originalLength: result.originalLength,
        summaryLength: result.summaryLength,
      },
    };
  } catch (err) {
    console.error("[Summarize] Error:", err);

    if (err.message && err.message.includes("ANTHROPIC_API_KEY")) {
      return {
        code: 1,
        message: "AI API key not configured. Please set ANTHROPIC_API_KEY.",
      };
    }

    if (err.status === 401 || err.statusCode === 401) {
      return {
        code: 1,
        message: "Invalid AI API key. Please check your API key.",
      };
    }

    if (err.status === 429 || err.statusCode === 429) {
      return {
        code: 1,
        message: "API rate limit exceeded. Please try again later.",
      };
    }

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