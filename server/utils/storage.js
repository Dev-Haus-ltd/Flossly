import path from "path";
import fs from "fs";
import { uploadToS3, deleteFromS3 } from "./s3";

const trimSlashes = (value = "") => String(value || "").replace(/^\/+|\/+$/g, "");

export const buildLink = (baseDir, filename) => {
  const base = trimSlashes(baseDir);
  const name = encodeURIComponent(trimSlashes(filename));
  return `/${base}/${name}`;
};

export const uploadBufferFile = async ({ data, filename, contentType, baseDir }) => {
  const link = buildLink(baseDir, filename);
  await uploadToS3({
    key: link,
    body: data,
    contentType,
  });
  return link;
};

export const uploadTempFile = async ({ filepath, filename, contentType, baseDir, cleanup = true }) => {
  const resolvedName = filename || path.basename(filepath);
  const link = buildLink(baseDir, resolvedName);
  await uploadToS3({
    key: link,
    body: fs.createReadStream(filepath),
    contentType,
  });
  if (cleanup) {
    try {
      fs.unlinkSync(filepath);
    } catch (_) {}
  }
  return link;
};

export const deleteLink = async (link) => {
  if (!link) return;
  try {
    await deleteFromS3(link);
  } catch (_) {}
};
