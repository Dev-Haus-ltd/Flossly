export const allowedImportExtensions = ["xlsx", "xls", "csv"];

export const getFileIcon = (filename = "") => {
  const ext = extractExtension(filename);
  switch (ext) {
    case "csv":
      return "mdi-file-delimited";
    case "xlsx":
    case "xls":
      return "mdi-file-excel";
    default:
      return "mdi-file-document";
  }
};

export const formatFileSize = (bytes = 0) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

export const extractExtension = (filename = "") =>
  filename.split(".").pop().toLowerCase();

export const validateFileBasics = (
  file,
  maxFileSize,
  allowedExts = allowedImportExtensions
) => {
  if (!file) return "No file provided.";

  if (maxFileSize && file.size > maxFileSize) {
    return `File size exceeds ${maxFileSize / (1024 * 1024)}MB limit`;
  }

  const ext = extractExtension(file.name);
  if (!allowedExts.includes(ext)) {
    return "Invalid file format. Only .xlsx, .xls, and .csv are supported.";
  }

  return null;
};

export const parseCSV = (text = "") => {
  const lines = text.split("\n").filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""));
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    rows.push(row);
  }

  return rows;
};
