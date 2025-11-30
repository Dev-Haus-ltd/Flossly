import { transcribeAudio, streamTranscribeAudio, streamTranscribeChunk, summarizeTranscription } from "~/server/controllers/transcription";

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, "name");
  const method = getMethod(event);
  
  switch (path) {
    case "transcribe":
      return await transcribeAudio(event);
    case "stream":
      if (method === "GET") {
        return await streamTranscribeAudio(event);
      } else if (method === "POST") {
        return await streamTranscribeChunk(event);
      }
      return { code: 1, message: "Method not allowed" };
    case "summarize":
      if (method === "POST") {
        return await summarizeTranscription(event);
      }
      return { code: 1, message: "Method not allowed" };
    default:
      return { code: 1, message: "Not found" };
  }
});

