import fs from "fs/promises";
import path from "path";
import { promisify } from "util";
import libreoffice from "libreoffice-convert";

const convert = promisify(libreoffice.convert);

export const convertDocToDocx = async ({ filepath, originalName }) => {
  const input = await fs.readFile(filepath);
  const output = await convert(input, ".docx", undefined);
  const base = path.basename(originalName || "document", path.extname(originalName || ""));
  const safeBase = base || "document";
  return {
    buffer: output,
    filename: `${safeBase}.docx`,
  };
};
