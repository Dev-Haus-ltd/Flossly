import { getRequestURL } from "h3";
import { sendS3Object } from "~/server/utils/s3";

const PREFIXES = [
  "/uploads/",
  "/documents/",
  "/systemDocs/",
  "/hr-documents/",
  "/leave-documents/",
  "/chatbot-attachments/",
];

export default defineEventHandler(async (event) => {
  const pathname = getRequestURL(event).pathname || "/";
  const matched = PREFIXES.find((prefix) => pathname.startsWith(prefix));
  if (!matched) return;

  const key = pathname.replace(/^\/+/, "");
  return await sendS3Object(event, key);
});

