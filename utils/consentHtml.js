export const sanitizeConsentHtml = (html = "") => {
  if (!html || typeof html !== "string") return "";

  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/on\w+\s*=\s*'[^']*'/gi, "");
};

const stripPaperHeaderBlock = (html) =>
  html.replace(
    /<div style="background:#f8f9fa;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:13px;">[\s\S]*?<\/div>/i,
    "",
  );

const stripPaperSignatureBlock = (html) =>
  html.replace(
    /<div style="margin-top:28px;padding-top:18px;border-top:1px solid #ddd;font-size:13px;">[\s\S]*?<\/div>\s*<\/div>\s*$/i,
    "</div>",
  );

const stripFallbackPaperLines = (html) =>
  html
    .replace(/<p[^>]*>\s*Patient Name:\s*_+\s*<\/p>/gi, "")
    .replace(/<p[^>]*>\s*Date of Birth:\s*_+\s*<\/p>/gi, "")
    .replace(/<p[^>]*>\s*Treating Clinician:\s*_+\s*<\/p>/gi, "")
    .replace(/<p[^>]*>\s*Patient\s*\/?\s*Guardian Signature:\s*_+\s*<\/p>/gi, "")
    .replace(/<p[^>]*>\s*Clinician Signature:\s*_+\s*<\/p>/gi, "")
    .replace(/<p[^>]*>\s*Date:\s*_+\s*<\/p>/gi, "");

export const normalizeConsentHtmlForDigitalFlow = (html = "") => {
  const sanitized = sanitizeConsentHtml(html);

  return stripFallbackPaperLines(
    stripPaperSignatureBlock(stripPaperHeaderBlock(sanitized)),
  ).trim();
};
