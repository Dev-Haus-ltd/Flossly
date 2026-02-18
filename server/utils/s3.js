import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "node:stream";
import { createError, setHeader, sendStream } from "h3";

let cachedClient = null;
let cachedClientKey = null;

const normalizePrefix = (value = "") => value.replace(/^\/+|\/+$/g, "");
const normalizeKey = (value = "") => String(value || "").replace(/^\/+/, "");

const getS3Config = () => {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) {
    throw createError({ statusCode: 500, statusMessage: "S3_BUCKET is not configured" });
  }

  const region = process.env.S3_REGION || process.env.AWS_REGION || "us-east-1";
  const endpoint = process.env.S3_ENDPOINT || undefined;
  const forcePathStyle = ["1", "true", "yes"].includes(
    String(process.env.S3_FORCE_PATH_STYLE || "").toLowerCase()
  );
  const accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey =
    process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
  const sessionToken = process.env.S3_SESSION_TOKEN || process.env.AWS_SESSION_TOKEN;
  const prefix = normalizePrefix(process.env.S3_PREFIX || "");

  const credentials =
    accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey, sessionToken } : undefined;

  return { bucket, region, endpoint, forcePathStyle, prefix, credentials };
};

const getS3Client = () => {
  const { region, endpoint, forcePathStyle, credentials } = getS3Config();
  const key = JSON.stringify({ region, endpoint, forcePathStyle, hasCreds: !!credentials });
  if (cachedClient && cachedClientKey === key) return cachedClient;

  cachedClientKey = key;
  cachedClient = new S3Client({
    region,
    endpoint,
    forcePathStyle,
    credentials,
  });
  return cachedClient;
};

const withPrefix = (key) => {
  const { prefix } = getS3Config();
  const normalized = normalizeKey(key);
  return prefix ? `${prefix}/${normalized}` : normalized;
};

export const uploadToS3 = async ({ key, body, contentType }) => {
  const client = getS3Client();
  const { bucket } = getS3Config();
  const objectKey = withPrefix(key);

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: body,
      ContentType: contentType || undefined,
    })
  );

  return objectKey;
};

export const deleteFromS3 = async (key) => {
  const client = getS3Client();
  const { bucket } = getS3Config();
  const objectKey = withPrefix(key);
  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: objectKey,
    })
  );
};

const toReadable = (body) => {
  if (!body) return null;
  if (body instanceof Readable) return body;
  if (typeof body === "string" || body instanceof Uint8Array || Buffer.isBuffer(body)) {
    return Readable.from([body]);
  }
  if (typeof body === "object" && typeof body.getReader === "function") {
    return Readable.from(body);
  }
  return Readable.from(body);
};

export const getS3Object = async (key) => {
  const client = getS3Client();
  const { bucket } = getS3Config();
  const objectKey = withPrefix(key);

  try {
    const res = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: objectKey,
      })
    );

    return {
      body: toReadable(res.Body),
      contentType: res.ContentType,
      contentLength: res.ContentLength,
      lastModified: res.LastModified,
      etag: res.ETag,
    };
  } catch (err) {
    const statusCode = err?.$metadata?.httpStatusCode;
    if (statusCode === 404 || err?.name === "NoSuchKey") {
      throw createError({ statusCode: 404, statusMessage: "File not found" });
    }
    throw err;
  }
};

export const sendS3Object = async (event, key, options = {}) => {
  const { body, contentType, contentLength, lastModified, etag } = await getS3Object(key);
  if (!body) {
    throw createError({ statusCode: 404, statusMessage: "File not found" });
  }

  const resolvedContentType = options.contentType || contentType || "application/octet-stream";
  setHeader(event, "Content-Type", resolvedContentType);
  setHeader(event, "Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  setHeader(event, "Pragma", "no-cache");
  setHeader(event, "Expires", "0");

  if (contentLength != null) setHeader(event, "Content-Length", String(contentLength));
  if (etag) setHeader(event, "ETag", String(etag));
  if (lastModified) setHeader(event, "Last-Modified", new Date(lastModified).toUTCString());

  return sendStream(event, body);
};
