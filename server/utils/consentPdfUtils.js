import puppeteer from "puppeteer";
import { PDFDocument } from "pdf-lib";
import fs from "fs";
import path from "path";
import os from "os";

// Professional CSS template for better PDF appearance
const getProfessionalStyles = () => {
  return `
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #2c3e50;
        background: white;
        padding: 50px;
        max-width: 900px;
        margin: 0 auto;
      }
      
      /* Header Section */
      .consent-header {
        text-align: center;
        margin-bottom: 40px;
        padding-bottom: 20px;
        border-bottom: 3px solid #0061FB;
      }
      
      .practice-name {
        font-size: 24px;
        font-weight: 600;
        color: #0061FB;
        margin-bottom: 8px;
      }
      
      .form-title {
        font-size: 20px;
        font-weight: 600;
        color: #2c3e50;
        margin-top: 10px;
      }
      
      .form-date {
        font-size: 12px;
        color: #6c757d;
        margin-top: 10px;
      }
      
      /* Content Sections */
      .content-section {
        margin-bottom: 30px;
      }
      
      .section-title {
        font-size: 16px;
        font-weight: 600;
        color: #0061FB;
        margin-bottom: 15px;
        padding-bottom: 8px;
        border-bottom: 2px solid #e9ecef;
      }
      
      .consent-text {
        font-size: 13px;
        line-height: 1.7;
        color: #495057;
        text-align: justify;
        white-space: pre-wrap;
        word-wrap: break-word;
      }
      
      .consent-text p {
        margin-bottom: 15px;
      }
      
      .consent-text ul, .consent-text ol {
        margin-left: 25px;
        margin-bottom: 15px;
      }
      
      .consent-text li {
        margin-bottom: 8px;
      }
      
      /* Highlight Box */
      .highlight-box {
        background: #f0f7ff;
        border-left: 4px solid #0061FB;
        padding: 15px 20px;
        margin: 20px 0;
        border-radius: 0 8px 8px 0;
      }
      
      /* Patient Info */
      .patient-info {
        background: #f8f9fa;
        padding: 15px 20px;
        border-radius: 8px;
        margin-bottom: 30px;
      }
      
      .patient-info-title {
        font-size: 12px;
        font-weight: 600;
        color: #0061FB;
        margin-bottom: 10px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      
      .patient-info-grid {
        display: flex;
        gap: 30px;
        flex-wrap: wrap;
      }
      
      .patient-info-item {
        flex: 1;
        min-width: 150px;
      }
      
      .patient-info-item .label {
        font-size: 11px;
        color: #6c757d;
        display: block;
        margin-bottom: 4px;
      }
      
      .patient-info-item .value {
        font-size: 14px;
        font-weight: 500;
        color: #2c3e50;
      }
      
      /* Signature Section */
      .signature-section {
        margin-top: 50px;
        padding-top: 30px;
        border-top: 2px solid #e9ecef;
      }
      
      .signature-title {
        font-size: 16px;
        font-weight: 600;
        color: #2c3e50;
        margin-bottom: 20px;
      }
      
      .signature-grid {
        display: flex;
        gap: 40px;
        flex-wrap: wrap;
        margin-bottom: 20px;
      }
      
      .signature-box {
        flex: 1;
        min-width: 200px;
      }
      
      .signature-box .label {
        font-size: 12px;
        color: #6c757d;
        margin-bottom: 8px;
      }
      
.signature-placeholder {
  border-radius: 8px;
  min-height: 100px;
  width: 100%;
  max-width: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #adb5bd;
  font-size: 12px;
  position: relative;
  overflow: hidden;
}
      
      .signature-line {
        border-bottom: 1px solid #2c3e50;
        margin-top: 35px;
        min-height: 50px;
      }
      
      /* Footer */
      .consent-footer {
        margin-top: 50px;
        padding-top: 20px;
        border-top: 1px solid #e9ecef;
        font-size: 10px;
        color: #6c757d;
        text-align: center;
      }
      
      /* Page Break */
      .page-break {
        page-break-before: always;
      }
      
      /* Print Optimization */
      @media print {
        body {
          padding: 20px;
        }
        

      }
    </style>
  `;
};

// Wrap HTML content with professional template
const wrapWithProfessionalTemplate = (htmlContent, options = {}) => {
  const {
    practiceName = "Flossly Dental Practice",
    formTitle = "Consent Form",
    patientName = "",
    patientEmail = "",
    showPatientInfo = false,
  } = options;

  const currentDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // Check if content already has styling
  const hasExistingStyle =
    htmlContent.includes("<style") || htmlContent.includes('style="');

  // If content already has good styling, just return as is
  if (hasExistingStyle && htmlContent.includes("signature")) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${formTitle} - ${practiceName}</title>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `;
  }

  // Otherwise wrap with professional template
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${formTitle} - ${practiceName}</title>
      ${getProfessionalStyles()}
    </head>
    <body>
      <!-- Header -->
      <div class="consent-header">
        <div class="practice-name">${practiceName}</div>
        <div class="form-title">${formTitle}</div>
        <div class="form-date">Date: ${currentDate}</div>
      </div>
      
      ${
        showPatientInfo
          ? `
      <!-- Patient Information -->
      <div class="patient-info">
        <div class="patient-info-title">Patient Information</div>
        <div class="patient-info-grid">
          <div class="patient-info-item">
            <span class="label">Patient Name</span>
            <span class="value">${patientName || "_________________________"}</span>
          </div>
          <div class="patient-info-item">
            <span class="label">Email</span>
            <span class="value">${patientEmail || "_________________________"}</span>
          </div>
        </div>
      </div>
      `
          : ""
      }
      
      <!-- Main Content -->
      <div class="content-section">
        <div class="consent-text">
          ${htmlContent}
        </div>
      </div>
      
      <!-- Signature Section -->
      <div class="signature-section">
        <div class="signature-title"></div>
        <div class="signature-grid">
          <div class="signature-box">
            <div
  id="signature-placeholder"
  class="signature-placeholder"
  data-signature="true"
>
  Sign here
</div>
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="consent-footer">
        This is a legally binding document. By signing above, you confirm your consent to the proposed treatment.
        <br>
        © ${new Date().getFullYear()} ${practiceName}. All rights reserved.
      </div>
    </body>
    </html>
  `;
};

// Generate PDF from HTML using Puppeteer
// Replace your generatePdfFromHtml function with this version
export const generatePdfFromHtml = async (
  htmlContent,
  filename,
  options = {},
) => {
  let browser = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // Important: fixed viewport matching A4 HTML rendering
    await page.setViewport({
      width: 794,
      height: 1123,
      deviceScaleFactor: 1,
    });

    const styledHtml = wrapWithProfessionalTemplate(htmlContent, options);

    await page.setContent(styledHtml, {
      waitUntil: "networkidle0",
    });

    await page.emulateMediaType("screen");

    await page.evaluate(async () => {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }
    });

    // ═══════════════════════════════════════════════════════════════════════
    // DYNAMIC SIGNATURE PLACEHOLDER DETECTION
    // Accurately detects the actual position in rendered HTML
    // ═══════════════════════════════════════════════════════════════════════
    const signaturePosition = await page.evaluate(() => {
      const placeholder =
        document.querySelector("#signature-placeholder") ||
        document.querySelector(".signature-placeholder") ||
        document.querySelector("[data-signature='true']");

      if (!placeholder) {
        console.warn("⚠ Signature placeholder not found in rendered HTML");
        return null;
      }

      // Get precise position from browser rendering engine
      const rect = placeholder.getBoundingClientRect();

      // Calculate with precision, rounded to 2 decimal places
      const position = {
        x: Math.round(rect.left * 100) / 100,
        y: Math.round(rect.top * 100) / 100,
        width: Math.round(rect.width * 100) / 100,
        height: Math.round(rect.height * 100) / 100,
        page: 1,
      };

      return position;
    });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "20px",
        bottom: "20px",
        left: "20px",
        right: "20px",
      },
    });

    const tempPath = path.join(os.tmpdir(), `${filename}_${Date.now()}.pdf`);
    fs.writeFileSync(tempPath, pdfBuffer);

    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPages().length;

    await browser.close();

    // ═══════════════════════════════════════════════════════════════════════
    // CONVERT AND VALIDATE DETECTED COORDINATES
    // ═══════════════════════════════════════════════════════════════════════
    let convertedCoordinates = null;
    if (signaturePosition) {
      convertedCoordinates = convertHtmlToPdfCoordinates(signaturePosition, 0);
    }

    console.log("\n📄 PDF Generation Complete:", {
      filename,
      pageCount,
      signatureDetected: !!signaturePosition,
      coordinatesConverted: !!convertedCoordinates,
    });

    return {
      filePath: tempPath,
      pageCount,
      signaturePosition, // Raw HTML coordinates from Puppeteer
      pdfCoordinates: convertedCoordinates, // Converted to PDF space
    };
  } catch (error) {
    if (browser) await browser.close();
    console.error("Error generating PDF:", error);
    throw error;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// COORDINATE CONVERSION AND VALIDATION UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Convert HTML viewport coordinates to PDF coordinates
 * HTML uses top-left origin, PDF uses bottom-left origin
 * A4 @ 96 DPI: HTML viewport = 794x1123 px, PDF = 595.28x841.89 pt
 */
const convertHtmlToPdfCoordinates = (htmlCoords, pageIndex = 0) => {
  // Standard A4 dimensions
  const HTML_WIDTH = 794; // pixels at 96 DPI
  const HTML_HEIGHT = 1123; // pixels at 96 DPI
  const PDF_WIDTH = 595.28; // points
  const PDF_HEIGHT = 841.89; // points

  const scaleX = PDF_WIDTH / HTML_WIDTH;
  const scaleY = PDF_HEIGHT / HTML_HEIGHT;

  if (!htmlCoords || htmlCoords.x === undefined || htmlCoords.y === undefined) {
    console.warn("Invalid HTML coordinates provided:", htmlCoords);
    return null;
  }

  // Get raw values with defaults
  const rawX = Number(htmlCoords.x) || 0;
  const rawY = Number(htmlCoords.y) || 0;
  const rawWidth = Number(htmlCoords.width) || 180;
  const rawHeight = Number(htmlCoords.height) || 80;

  // Scale from HTML viewport to PDF space
  const pdfX = rawX * scaleX;
  const pdfY = rawY * scaleY;
  const pdfWidth = rawWidth * scaleX;
  const pdfHeight = rawHeight * scaleY;

  // Convert from top-left to bottom-left origin for PDF
  // PDF Y coordinate increases from bottom, HTML Y increases from top
  const pdfYBottom = PDF_HEIGHT - pdfY - pdfHeight;

  // Validate and clamp to PDF page boundaries
  const validated = {
    x: Math.max(10, Math.min(pdfX, PDF_WIDTH - pdfWidth - 10)),
    y: Math.max(10, Math.min(pdfYBottom, PDF_HEIGHT - pdfHeight - 10)),
    width: Math.max(50, Math.min(pdfWidth, PDF_WIDTH - 20)),
    height: Math.max(30, Math.min(pdfHeight, PDF_HEIGHT - 20)),
    page: Math.max(0, pageIndex),
  };

  return validated;
};

/**
 * Embed signature into PDF using pdf-lib with precise coordinate handling
 * Handles both converted PDF coordinates and raw HTML coordinates
 */
export const embedSignatureInPdf = async (
  pdfPath,
  signatureImagePath,
  coordinates,
) => {
  try {
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBuffer);

    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    // Determine target page (prefer stored page, fall back to last page)
    let pageIndex = (coordinates?.page || totalPages) - 1;
    pageIndex = Math.max(0, Math.min(pageIndex, totalPages - 1));
    const page = pages[pageIndex];
    const { width: pageWidth, height: pageHeight } = page.getSize();

    console.log(
      `\n📌 Embedding Signature on Page ${pageIndex + 1}/${totalPages}`,
    );

    // Load and embed signature image
    const signatureBuffer = fs.readFileSync(signatureImagePath);
    let signatureImage;
    if (signatureImagePath.toLowerCase().endsWith(".png")) {
      signatureImage = await pdfDoc.embedPng(signatureBuffer);
    } else {
      signatureImage = await pdfDoc.embedJpg(signatureBuffer);
    }

    // Use provided coordinates (which should be in PDF space already)
    let finalX = coordinates?.x ?? 50;
    let finalY = coordinates?.y ?? 100;
    let finalWidth = coordinates?.width ?? 120;
    let finalHeight = coordinates?.height ?? 100;

    // If coordinates look like they're in HTML space (large values > 300),
    // convert them to PDF space
    if (finalX > 300 || finalY > 400) {
      const converted = convertHtmlToPdfCoordinates(coordinates, pageIndex);
      if (converted) {
        finalX = converted.x;
        finalY = converted.y;
        finalWidth = converted.width;
        finalHeight = converted.height;
        console.log("ℹ Converted HTML coordinates to PDF space");
      }
    }

    // Ensure coordinates are within page bounds
    finalX = Math.max(0, Math.min(finalX, pageWidth - finalWidth));
    finalY = Math.max(0, Math.min(finalY, pageHeight - finalHeight));
    finalWidth = Math.min(finalWidth, pageWidth - finalX);
    finalHeight = Math.min(finalHeight, pageHeight - finalY);

    console.log("✓ Final Signature Position:", {
      page: pageIndex + 1,
      x: finalX.toFixed(2),
      y: finalY.toFixed(2),
      width: finalWidth.toFixed(2),
      height: finalHeight.toFixed(2),
      pageDim: { width: pageWidth.toFixed(2), height: pageHeight.toFixed(2) },
    });

    // Draw signature image at calculated position
    page.drawImage(signatureImage, {
      x: finalX +10,
      y: finalY +10,
      width: finalWidth -15,
      height: finalHeight -15,
    });

    const modifiedPdfBytes = await pdfDoc.save();
    console.log("✅ Signature embedded successfully\n");
    return Buffer.from(modifiedPdfBytes);
  } catch (error) {
    console.error("❌ Error embedding signature:", error);
    throw error;
  }
};

/**
 * Enhanced signature embedding using Puppeteer for real-time position detection
 * Detects signature placeholder position from the actual rendered HTML
 * and embeds it accurately in the PDF
 */
export const embedSignatureWithPuppeteer = async (
  pdfPath,
  signatureImagePath,
  coordinates,
  htmlContent,
  options = {},
) => {
  let browser = null;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // Fixed A4 viewport: 794x1123 px (matches PDF page aspect ratio)
    await page.setViewport({
      width: 794,
      height: 1123,
      deviceScaleFactor: 1,
    });

    // Render with professional template
    const styledHtml = wrapWithProfessionalTemplate(htmlContent, options);
    await page.setContent(styledHtml, {
      waitUntil: "networkidle0",
    });

    // Re-detect signature position from rendered page
    const detectedPosition = await page.evaluate(() => {
      const placeholder =
        document.querySelector("#signature-placeholder") ||
        document.querySelector(".signature-placeholder") ||
        document.querySelector("[data-signature='true']");

      if (!placeholder) return null;

      const rect = placeholder.getBoundingClientRect();
      return {
        x: Math.round(rect.left * 100) / 100,
        y: Math.round(rect.top * 100) / 100,
        width: Math.round(rect.width * 100) / 100,
        height: Math.round(rect.height * 100) / 100,
        page: 1,
      };
    });

    await browser.close();

    // Use detected position, or fall back to provided coordinates
    const finalCoordinates = detectedPosition || coordinates;

    if (!finalCoordinates) {
      throw new Error("Unable to detect or provide signature coordinates");
    }

    console.log("\n🎯 Using coordinates for signature embedding:", {
      source: detectedPosition ? "detected" : "provided",
      coordinates: finalCoordinates,
    });

    return await embedSignatureInPdf(
      pdfPath,
      signatureImagePath,
      finalCoordinates,
    );
  } catch (error) {
    if (browser) await browser.close();
    console.error("❌ Error embedding signature with Puppeteer:", error);
    throw error;
  }
};

/**
 * Validate signature coordinates with comprehensive checks
 * Returns validated coordinates or false if invalid
 */
export const validateCoordinates = (coordinates, totalPages = 1) => {
  if (!coordinates) {
    console.warn("⚠ No coordinates provided");
    return false;
  }

  const x = Number(coordinates.x);
  const y = Number(coordinates.y);
  const width = Number(coordinates.width);
  const height = Number(coordinates.height);
  const page = Math.max(1, Number(coordinates.page) || totalPages);

  // Check if values are valid numbers
  if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height)) {
    console.warn("⚠ Invalid coordinate values (NaN):", coordinates);
    return false;
  }

  // Apply reasonable bounds
  const validCoords = {
    x: Math.max(0, Math.min(x, 800)),
    y: Math.max(0, Math.min(y, 1100)),
    width: Math.max(30, Math.min(width, 400)),
    height: Math.max(20, Math.min(height, 250)),
    page: Math.min(page, totalPages),
  };

  // Validate minimum position requirements
  const isValid =
    validCoords.width > 0 &&
    validCoords.height > 0 &&
    validCoords.page >= 1 &&
    validCoords.page <= totalPages;

  if (!isValid) {
    console.warn("⚠ Coordinates validation failed:", {
      validCoords,
      totalPages,
    });
  }

  return isValid ? validCoords : false;
};

// Get preview HTML with exact positioning for testing
export const getPreviewHtml = (htmlContent, coordinates, options = {}) => {
  const previewHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Signature Position Preview</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          position: relative;
          background: #f0f0f0;
          padding: 20px;
        }
        
        .preview-container {
          position: relative;
          display: inline-block;
          background: white;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .signature-marker {
          position: absolute;
          border: 3px solid #ff0000;
          background: rgba(255, 0, 0, 0.1);
          pointer-events: none;
          z-index: 9999;
        }
        
        .signature-marker::after {
          content: "Signature will appear here";
          position: absolute;
          top: -25px;
          left: 0;
          background: #ff0000;
          color: white;
          font-size: 12px;
          padding: 2px 8px;
          border-radius: 4px;
          white-space: nowrap;
        }
        
        .info-panel {
          position: fixed;
          top: 20px;
          right: 20px;
          background: white;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
          font-size: 12px;
          z-index: 10000;
        }
        
        .info-panel h4 {
          margin-bottom: 10px;
          color: #0061FB;
        }
        
        .info-panel p {
          margin: 5px 0;
        }
        
        .coord-value {
          font-weight: bold;
          color: #ff0000;
        }
      </style>
    </head>
    <body>
      <div class="info-panel">
        <h4>Signature Position Preview</h4>
        <p>X: <span class="coord-value">${coordinates.x}px</span></p>
        <p>Y: <span class="coord-value">${coordinates.y}px</span></p>
        <p>Width: <span class="coord-value">${coordinates.width}px</span></p>
        <p>Height: <span class="coord-value">${coordinates.height}px</span></p>
        <p>Page: <span class="coord-value">${coordinates.page}</span></p>
      </div>
      
      <div class="preview-container">
        ${wrapWithProfessionalTemplate(htmlContent, options)}
        <div 
          class="signature-marker"
          style="
            left: ${coordinates.x}px;
            top: ${coordinates.y}px;
            width: ${coordinates.width}px;
            height: ${coordinates.height}px;
          "
        ></div>
      </div>
    </body>
    </html>
  `;

  return previewHtml;
};
