import { transcribeAudio } from "~/server/controllers/transcription";

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, "name");
  switch (path) {
    case "transcribe":
      return await transcribeAudio(event);
    default:
      return { code: 1, message: "Not found" };
  }
});

