import path from "path";
import fs from "fs";
import { uploadToS3, deleteFromS3 } from "./s3";

const EXT_TO_MIME = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
  gif: 'image/gif', webp: 'image/webp', mp4: 'video/mp4',
  mp3: 'audio/mpeg', pdf: 'application/pdf',
}

/**
 * Downloads a remote URL to a buffer and uploads it to S3.
 * Caller is responsible for supplying a resolved filename (including extension).
 * Content-type is inferred from the filename extension if not provided.
 * Returns the S3 path on success, null on any failure.
 */
export const downloadUrlToS3 = async ({ url, filename, contentType, baseDir, headers = {} }) => {
  if (!url) return null
  try {
    const buf = await $fetch(url, { method: 'GET', responseType: 'arrayBuffer', headers })
    const ext = String(filename || '').split('.').pop().toLowerCase()
    const resolvedContentType = contentType || EXT_TO_MIME[ext] || 'application/octet-stream'
    return await uploadBufferFile({ data: Buffer.from(buf), filename, contentType: resolvedContentType, baseDir })
  } catch {
    return null
  }
}

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
