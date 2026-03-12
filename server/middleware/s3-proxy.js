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

  // Decode the URL-encoded pathname to handle filenames with spaces and special characters
  const decodedPathname = decodeURIComponent(pathname);
  const pathParts = decodedPathname.replace(/^\/+/, "").split("/");
  const baseDir = pathParts[0];
  const filename = pathParts.slice(1).join("/");
  const encodedFilename = encodeURIComponent(filename);
  const key = `${baseDir}/${encodedFilename}`;
  return await sendS3Object(event, key);
});

