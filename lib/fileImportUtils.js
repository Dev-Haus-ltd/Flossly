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

export const normalizeHeaderKey = (key) =>
  String(key || "").trim().toLowerCase();

export const cleanQuotedValue = (val) => {
  if (typeof val === "string") {
    return val.trim().replace(/^['"]+|['"]+$/g, "");
  }
  return val == null ? "" : val;
};

export const normalizePhoneValue = (val) => {
  if (val == null || val === "") return "";
  if (typeof val === "number" && Number.isFinite(val)) {
    return Math.trunc(val).toString();
  }
  const str = String(cleanQuotedValue(val)).trim();
  if (!str) return "";
  const compact = str.replace(/,/g, "");
  if (/^\d+(\.\d+)?e\+\d+$/i.test(compact)) {
    const num = Number(compact);
    if (Number.isFinite(num)) {
      return Math.trunc(num).toString();
    }
  }
  return str;
};

const normalizeLeadHeaderKey = (key) =>
  String(key || "")
    .toLowerCase()
    .replace(/[\u200B\uFEFF]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Column alias mappings for lead import
 * Maps various column names to standardized field names
 */
export const LEAD_COLUMN_ALIASES = {
  name: [
    "name",
    "full name",
    "fullname",
    "lead name",
    "leadname",
    "contact name",
    "contactname",
    "customer name",
    "customername",
    "patient name",
    "patientname",
  ],
  email: [
    "email",
    "e-mail",
    "email address",
    "emailaddress",
    "email addr",
    "emailaddr",
    "email id",
    "emailid",
    "mail",
    "contact email",
    "contactemail",
  ],
  telephone: [
    "telephone",
    "telephone number",
    "phone",
    "phone number",
    "phone no",
    "phone #",
    "phonenumber",
    "mobile",
    "mobile number",
    "mobilenumber",
    "mobile phone",
    "cell",
    "cell phone",
    "cellphone",
    "contact number",
    "contactnumber",
    "whatsapp",
    "whatsapp number",
    "whatsappnumber",
    "tel",
    "secondary",
    "secondary number",
    "secondarynumber",
    "secondary phone",
    "secondary phone number",
    "secondaryphonenumber",
  ],
  leadsource: [
    "lead source",
    "leadsource",
    "source",
    "lead origin",
    "leadorigin",
    "origin",
    "referral source",
    "referralsource",
    "how did you hear",
    "how did you hear about us",
  ],
  treatment: [
    "treatment",
    "treatment interest",
    "treatmentinterest",
    "service",
    "service interest",
    "serviceinterest",
    "procedure",
    "interested in",
    "interestedin",
  ],
  leadstatus: ["lead status", "leadstatus", "status", "lead state", "leadstate", "state"],
  assigned: [
    "assigned to",
    "assignedto",
    "assigned",
    "user",
    "owner",
    "assignee",
    "assigned user",
    "assigneduser",
    "staff",
    "staff member",
    "staffmember",
  ],
  inquirydate: [
    "inquiry date",
    "inquirydate",
    "inquiry",
    "date of inquiry",
    "dateofinquiry",
    "enquiry date",
    "enquirydate",
    "contact date",
    "contactdate",
    "initial contact",
    "initialcontact",
    "created date",
    "createddate",
  ],
  followupdate: [
    "follow up date",
    "followupdate",
    "follow-up date",
    "followup",
    "follow up",
    "follow-up",
    "next contact",
    "nextcontact",
    "callback date",
    "callbackdate",
  ],
  comments: [
    "comments",
    "comment",
    "notes",
    "note",
    "remarks",
    "remark",
    "description",
    "additional info",
    "additionalinfo",
    "details",
  ],
};

/**
 * Normalize a column header to its standardized field name using aliases
 * @param {string} key - The column header from the file
 * @returns {string} - The standardized field name or the normalized key if no match
 */
export const normalizeLeadColumnHeader = (key) => {
  const normalized = normalizeLeadHeaderKey(key);

  for (const [fieldName, aliases] of Object.entries(LEAD_COLUMN_ALIASES)) {
    const matches = aliases.some(
      (alias) => normalizeLeadHeaderKey(alias) === normalized
    );
    if (matches) return fieldName;
  }

  return normalized;
};

export const normalizeRowBasic = (row, { trimString = true } = {}) => {
  const normalized = {};
  Object.entries(row || {}).forEach(([key, value]) => {
    let nextValue = value ?? "";
    if (trimString && typeof nextValue === "string") {
      nextValue = nextValue.trim();
    }
    normalized[normalizeHeaderKey(key)] = nextValue;
  });
  return normalized;
};
