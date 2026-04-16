import { readBody, getQuery } from "h3";
import { Op } from "sequelize";
import {
  ConsentFormTemplate,
  ConsentFormDocument,
  ConsentFormSignatureAudit,
  DiaryPatient,
  User,
  Organisation,
} from "../models";
import { success, error } from "../utils/response";
import {
  generateSecureToken,
  hashToken,
  isTokenExpired,
  generateExpiryDate,
  getClientIpAddress,
  getUserAgent,
  canManageConsentForms,
  canViewConsentDocument,
  sanitizeHtmlContent,
  validateConsentFormData,
  generateDocumentReference,
} from "../utils/consentSecurityUtils";
import {
  generatePdfFromHtml,
  embedSignatureInPdf,
  validateCoordinates,
} from "../utils/consentPdfUtils";
import {
  uploadConsentDocument,
  downloadFromS3,
  generateS3Key,
  generateSignedUrl,
  deleteFromS3,
  uploadToS3,
} from "../utils/consentS3Utils";
import { sendConsentFormEmail } from "../utils/emailNotifications";
import { normalizeWhatsAppNumber, logWhatsAppMessage, isWhatsAppLimitExceeded } from "../utils/whatsapp";
import { resolveWhapiConfig } from "../utils/whatsappProvider";
import path from "path";
import fs from "fs";
import os from "os";

// =============================================================================
// CONSENT FORM TEMPLATE ROUTES
// =============================================================================

export const listConsentTemplates = async (event) => {
  try {
    const { orgId } = event.context.user;

    const templates = await ConsentFormTemplate.findAll({
      where: {
        organisationId: Number(orgId),
        isActive: true,
      },
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "fullName", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return success(templates);
  } catch (e) {
    const msg =
      (e &&
        (e.message ||
          (e.data && e.data.message) ||
          (e.original && e.original.detail))) ||
      "Internal server error";
    return error(500, msg);
  }
};

export const getConsentTemplate = async (event) => {
  try {
    const { orgId } = event.context.user;
    const query = getQuery(event);
    const templateId = Number(query.id || 0);

    if (!templateId) {
      return error(400, "Template ID is required");
    }

    const template = await ConsentFormTemplate.findOne({
      where: {
        id: templateId,
        organisationId: Number(orgId),
      },
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "fullName", "email"],
        },
      ],
    });

    if (!template) {
      return error(404, "Template not found");
    }

    return success(template);
  } catch (e) {
    const msg =
      (e &&
        (e.message ||
          (e.data && e.data.message) ||
          (e.original && e.original.detail))) ||
      "Internal server error";
    return error(500, msg);
  }
};

export const createConsentTemplate = async (event) => {
  try {
    const { orgId, userId } = event.context.user;
    const body = await readBody(event);

    if (!body.name || typeof body.name !== "string") {
      return error(400, "Template name is required");
    }

    if (!body.htmlContent || typeof body.htmlContent !== "string") {
      return error(400, "HTML content is required");
    }

    if (
      !body.signatureCoordinates ||
      typeof body.signatureCoordinates !== "object"
    ) {
      return error(400, "Signature coordinates are required");
    }

    if (!validateCoordinates(body.signatureCoordinates)) {
      return error(400, "Invalid signature coordinates format");
    }

    const sanitizedHtml = sanitizeHtmlContent(body.htmlContent);

    const template = await ConsentFormTemplate.create({
      organisationId: Number(orgId),
      name: body.name,
      description: body.description || null,
      htmlContent: sanitizedHtml,
      signatureCoordinates: body.signatureCoordinates,
      initialCoordinates: body.initialCoordinates || null,
      dateCoordinates: body.dateCoordinates || null,
      category: body.category || null,
      isActive: true,
      createdBy: userId,
    });

    return success(template, 201);
  } catch (e) {
    console.error("Error creating consent template:", e);
    const msg =
      (e &&
        (e.message ||
          (e.data && e.data.message) ||
          (e.original && e.original.detail))) ||
      "Internal server error";
    return error(500, msg);
  }
};

export const updateConsentTemplate = async (event) => {
  try {
    const { orgId, userId } = event.context.user;
    const body = await readBody(event);
    const templateId = Number(body.id || 0);

    if (!templateId) {
      return error(400, "Template ID is required");
    }

    const template = await ConsentFormTemplate.findOne({
      where: {
        id: templateId,
        organisationId: Number(orgId),
      },
    });

    if (!template) {
      return error(404, "Template not found");
    }

    if (body.name) template.name = body.name;
    if (body.description !== undefined) template.description = body.description;
    if (body.htmlContent) {
      template.htmlContent = sanitizeHtmlContent(body.htmlContent);
    }
    if (
      body.signatureCoordinates &&
      validateCoordinates(body.signatureCoordinates)
    ) {
      template.signatureCoordinates = body.signatureCoordinates;
    }
    if (body.initialCoordinates)
      template.initialCoordinates = body.initialCoordinates;
    if (body.dateCoordinates) template.dateCoordinates = body.dateCoordinates;
    if (body.category !== undefined) template.category = body.category;
    if (body.isActive !== undefined) template.isActive = body.isActive;

    template.updatedBy = userId;
    await template.save();

    return success(template);
  } catch (e) {
    console.error("Error updating consent template:", e);
    const msg =
      (e &&
        (e.message ||
          (e.data && e.data.message) ||
          (e.original && e.original.detail))) ||
      "Internal server error";
    return error(500, msg);
  }
};

export const deleteConsentTemplate = async (event) => {
  try {
    const { orgId } = event.context.user;
    const body = await readBody(event);
    const templateId = Number(body.id || 0);

    if (!templateId) {
      return error(400, "Template ID is required");
    }

    const template = await ConsentFormTemplate.findOne({
      where: {
        id: templateId,
        organisationId: Number(orgId),
      },
      include: [
        {
          model: ConsentFormDocument,
          as: "documents",
        },
      ],
    });

    if (!template) {
      return error(404, "Template not found");
    }

    // ✅ Option 1: Soft delete - just mark inactive
    template.isActive = false;
    await template.save();
    
    // ✅ Option 2: Also void all associated documents
    if (template.documents && template.documents.length > 0) {
      await ConsentFormDocument.update(
        { status: 'voided', voidReason: 'Template deleted' },
        { where: { templateId: template.id } }
      );
    }

    return success({ message: "Template deleted successfully" });
  } catch (e) {
    console.error("Error deleting consent template:", e);
    return error(500, e.message);
  }
};

// =============================================================================
// CONSENT FORM DOCUMENT ROUTES
// =============================================================================

export const listConsentDocuments = async (event) => {
  try {
    const { orgId } = event.context.user;
    const query = getQuery(event);
    const patientId = Number(query.patientId || 0);

    if (!patientId) {
      return error(400, "Patient ID is required");
    }

    const patient = await DiaryPatient.findOne({
      where: {
        id: patientId,
        organisationId: Number(orgId),
      },
    });

    if (!patient) {
      return error(404, "Patient not found");
    }

    const documents = await ConsentFormDocument.findAll({
      where: {
        patientId,
        organisationId: Number(orgId),
      },
      include: [
        {
          model: ConsentFormTemplate,
          as: "template",
          attributes: ["id", "name", "category"],
        },
        {
          model: User,
          as: "sentByUser",
          attributes: ["id", "fullName", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return success(documents);
  } catch (e) {
    const msg =
      (e &&
        (e.message ||
          (e.data && e.data.message) ||
          (e.original && e.original.detail))) ||
      "Internal server error";
    return error(500, msg);
  }
};

export const sendConsentDocument = async (event) => {
  let tempPdfPath = null;

  try {
    const { orgId, userId } = event.context.user;
    const body = await readBody(event);

    const validation = validateConsentFormData(body);
    if (!validation.isValid) {
      return error(400, validation.errors.join(", "));
    }

    const patientId = Number(body.patientId);
    const templateId = Number(body.templateId);
    const sendVia = String(body.sendVia || "email")
      .toLowerCase()
      .trim();

    const [patient, template, organisation] = await Promise.all([
      DiaryPatient.findOne({
        where: {
          id: patientId,
          organisationId: Number(orgId),
        },
      }),
      ConsentFormTemplate.findOne({
        where: {
          id: templateId,
          organisationId: Number(orgId),
        },
      }),
      Organisation.findOne({
        where: {
          id: Number(orgId),
        },
      }),
    ]);

    if (!patient) return error(404, "Patient not found");
    if (!template) return error(404, "Template not found");

    // Generate PDF from HTML using Puppeteer
const { filePath, pageCount, signaturePosition, pdfCoordinates } =
  await generatePdfFromHtml(
    template.htmlContent,
    template.name,
    {
      practiceName: organisation?.name || "Flossly",
      formTitle: body.title || template.name,
      patientName: `${patient.firstName || ""} ${patient.lastName || ""}`.trim(),
      patientEmail: body.patientEmail || patient.email,
      showPatientInfo: true,
    }
  );
    tempPdfPath = filePath;
    const pdfContent = fs.readFileSync(filePath);

    // Upload to S3
    const unsignedS3Key = await uploadConsentDocument(
      pdfContent,
      Number(orgId),
      patientId,
      "pdf",
      "unsigned"
    );

    // Generate token
    const plainToken = generateSecureToken();
    const hashedToken = hashToken(plainToken);
    const documentReference = generateDocumentReference();

    // Get signature coordinates - prefer dynamically detected/converted ones from PDF generation
    // Fallback to template coordinates, then use sensible defaults
    let signatureCoords = pdfCoordinates || signaturePosition;
    
    if (!signatureCoords) {
      // Use template coordinates if available
      signatureCoords = template.signatureCoordinates;
    }

    if (!signatureCoords) {
      // Last resort: use defaults pointing to lower right area
      signatureCoords = {
        x: 100,
        y: 650,
        width: 180,
        height: 80,
        page: pageCount,
      };
    }

    // Ensure page number is valid for this document
    signatureCoords.page = Math.min(
      signatureCoords.page || pageCount,
      pageCount
    );

    // Create document initially as draft
    const document = await ConsentFormDocument.create({
      patientId,
      templateId,
      organisationId: Number(orgId),
      title: body.title || template.name,
      documentReference,
      accessTokenHash: hashedToken,
      pdfS3Key: unsignedS3Key,
      status: "draft",
      templateVersion: template.version || 1,
      patientEmail: body.patientEmail || patient.email,
      patientPhone: body.patientPhone || patient.mobile,
      sentBy: userId,
      sentAt: new Date(),
      tokenExpiresAt: generateExpiryDate(body.expiryDays || 30),
      customNotes: body.notes || null,
      customTitle: body.title || template.name,
metadata: {
  totalPages: pageCount,
  signatureCoordinates: signatureCoords,
  originalCoordinates: template.signatureCoordinates,
  detectedSignaturePosition: signaturePosition,
  // Store both to ensure we have the best available coordinates
  pdfConvertedCoordinates: pdfCoordinates,
  coordinateSource: pdfCoordinates ? 'detected_and_converted' : (signaturePosition ? 'detected_raw' : (template.signatureCoordinates ? 'template' : 'default')),
  sentVia: sendVia,
},
      isFinalized: false,
    });

    // Initial audit log
    await ConsentFormSignatureAudit.create({
      documentId: document.id,
      patientId,
      organisationId: Number(orgId),
      action: "created",
      ipAddress: getClientIpAddress(event),
      userAgent: getUserAgent(event),
      metadata: {
        createdBy: userId,
        templateId,
        totalPages: pageCount,
        signaturePageUsed: signatureCoords.page,
        deliveryMethod: sendVia,
      },
      performedBy: userId,
    });

    const deliveryErrors = [];
    const successfulDeliveries = [];

    const practiceInfo = {
      name: organisation?.name || "Flossly",
      organisationName: organisation?.name || "Flossly",
    };

    // EMAIL DELIVERY
    if (sendVia === "email" || sendVia === "both") {
      try {
        const patientEmail = body.patientEmail || patient.email;

        if (!patientEmail) {
          deliveryErrors.push("Email: Patient has no email address");
        } else {
          await sendConsentFormEmail({
            orgId: Number(orgId),
            patientEmail,
            patientName: `${patient.firstName || ""} ${
              patient.lastName || ""
            }`.trim(),
            formName: template.name,
            practiceInfo,
            customMessage: body.notes || "",
            expiryDays: body.expiryDays || 30,
            expiresAt: document.tokenExpiresAt,
            token: plainToken,
          });

          successfulDeliveries.push("email");

          await ConsentFormSignatureAudit.create({
            documentId: document.id,
            patientId,
            organisationId: Number(orgId),
            action: "email_sent",
            ipAddress: getClientIpAddress(event),
            userAgent: getUserAgent(event),
            metadata: {
              recipientEmail: patientEmail,
              sentBy: userId,
            },
            performedBy: userId,
          });
        }
      } catch (emailErr) {
        console.error("Error sending consent form via email:", emailErr);
        deliveryErrors.push(
          `Email: ${emailErr?.message || "Failed to send email"}`
        );
      }
    }

    // WHATSAPP DELIVERY
    if (sendVia === "whatsapp" || sendVia === "both") {
      try {
        const phoneNumber =
          body.patientPhone || patient.mobile || patient.telephone;

        if (!phoneNumber) {
          deliveryErrors.push("WhatsApp: Patient has no phone number");
        } else {
          const whapiConfig = await resolveWhapiConfig(orgId);

          if (!whapiConfig?.token) {
            deliveryErrors.push(
              "WhatsApp: Not configured for this organization"
            );
          } else {
            const limitStatus = await isWhatsAppLimitExceeded(orgId, userId);

            if (limitStatus.exceeded) {
              deliveryErrors.push(
                `WhatsApp: Monthly limit reached (${limitStatus.count}/${limitStatus.limit})`
              );
            } else {
              const normalizedPhone =
                normalizeWhatsAppNumber(phoneNumber);

              if (!normalizedPhone) {
                deliveryErrors.push(
                  "WhatsApp: Invalid phone number format"
                );
              } else {
                try {
                  const whapiBase = String(
                    whapiConfig.baseUrl || ""
                  ).replace(/\/+$/, "");

                  const headers = {
                    Authorization: `Bearer ${whapiConfig.token}`,
                    "Content-Type": "application/json",
                  };

                  const whatsappMessage = `Hello ${
                    patient.firstName || "there"
                  },

Please review and sign the following document: *${
                    template.name
                  }*

A secure link has been sent to your registered email. If you need another copy, please contact us.

Link expires: ${new Date(
                    document.tokenExpiresAt
                  ).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}

Thank you! 📋`;

                  await $fetch(`${whapiBase}/messages/text`, {
                    method: "POST",
                    headers,
                    body: {
                      to: normalizedPhone,
                      body: whatsappMessage,
                    },
                  });

                  successfulDeliveries.push("whatsapp");

                  await logWhatsAppMessage({
                    organisationId: orgId,
                    to: normalizedPhone,
                    direction: "outbound",
                    type: "text",
                    status: "sent",
                    content: whatsappMessage,
                  });

                  await ConsentFormSignatureAudit.create({
                    documentId: document.id,
                    patientId,
                    organisationId: Number(orgId),
                    action: "whatsapp_sent",
                    ipAddress: getClientIpAddress(event),
                    userAgent: getUserAgent(event),
                    metadata: {
                      recipientPhone: normalizedPhone,
                      sentBy: userId,
                    },
                    performedBy: userId,
                  });
                } catch (whapiErr) {
                  console.error(
                    "Error sending WhatsApp via Whapi:",
                    whapiErr
                  );

                  deliveryErrors.push(
                    `WhatsApp: ${
                      whapiErr?.message || "Failed to send WhatsApp message"
                    }`
                  );
                }
              }
            }
          }
        }
      } catch (whatsappErr) {
        console.error("Error with WhatsApp delivery:", whatsappErr);

        deliveryErrors.push(
          `WhatsApp: ${
            whatsappErr?.message || "Failed to process WhatsApp delivery"
          }`
        );
      }
    }

    // If no delivery succeeded, delete document or keep as draft
    if (successfulDeliveries.length === 0) {
      await document.update({
        status: "draft",
      });

      await ConsentFormSignatureAudit.create({
        documentId: document.id,
        patientId,
        organisationId: Number(orgId),
        action: "delivery_failed",
        ipAddress: getClientIpAddress(event),
        userAgent: getUserAgent(event),
        metadata: {
          errors: deliveryErrors,
          attemptedVia: sendVia,
        },
        performedBy: userId,
      });

      return error(
        400,
        deliveryErrors.length > 0
          ? deliveryErrors.join(", ")
          : "Failed to send consent document"
      );
    }

    // If at least one delivery succeeded
    await document.update({
      status: "sent",
      sentAt: new Date(),
    });

    await ConsentFormSignatureAudit.create({
      documentId: document.id,
      patientId,
      organisationId: Number(orgId),
      action: "sent",
      ipAddress: getClientIpAddress(event),
      userAgent: getUserAgent(event),
      metadata: {
        successfulDeliveries,
        deliveryErrors,
        attemptedVia: sendVia,
      },
      performedBy: userId,
    });

    const isPartialSuccess =
      successfulDeliveries.length > 0 && deliveryErrors.length > 0;

    return success(
      {
        id: document.id,
        accessToken: plainToken,
        deliveredVia: successfulDeliveries,
        deliveryErrors: deliveryErrors.length > 0 ? deliveryErrors : null,
        partiallyDelivered: isPartialSuccess,
      },
      isPartialSuccess ? 207 : 201
    );
  } catch (e) {
    console.error("Error sending consent document:", e);

    const msg = e?.message || "Internal server error";
    return error(500, msg);
  } finally {
    if (tempPdfPath && fs.existsSync(tempPdfPath)) {
      fs.unlinkSync(tempPdfPath);
    }
  }
};
export const getConsentDocumentForSigning = async (event) => {
  try {
    const query = getQuery(event);
    const token = query.token;

    if (!token) {
      return error(400, "Access token is required");
    }

    const hashedToken = hashToken(token);

    // Find document using accessTokenHash - MATCHING MIGRATION
    const document = await ConsentFormDocument.findOne({
      where: {
        accessTokenHash: hashedToken, // ✅ Migration uses accessTokenHash
      },
      include: [
        {
          model: DiaryPatient,
          as: "patient",
          attributes: ["id", "firstName", "lastName", "email", "mobile"],
        },
        {
          model: ConsentFormTemplate,
          as: "template",
          attributes: [
            "id",
            "name",
            "signatureCoordinates",
            "initialCoordinates",
            "dateCoordinates",
            "htmlContent",
          ],
        },
      ],
    });

    if (!document) {
      return error(404, "Document not found or invalid token");
    }

    // Check expiration - using tokenExpiresAt to match migration
    if (isTokenExpired(document.tokenExpiresAt)) {
      return error(401, "This document link has expired");
    }

    if (document.status === "signed") {
      return error(400, "Document has already been signed");
    }

    if (document.status !== "viewed" && document.status !== "signed") {
      document.status = "viewed";
      document.viewedAt = new Date();
      await document.save();

      await ConsentFormSignatureAudit.create({
        documentId: document.id,
        patientId: document.patientId,
        organisationId: document.organisationId,
        action: "viewed",
        ipAddress: getClientIpAddress(event),
        userAgent: getUserAgent(event),
      });
    }

    let pdfSignedUrl = null;
    if (document.pdfS3Key) {
      pdfSignedUrl = await generateSignedUrl(document.pdfS3Key);
    }

    return success({
      id: document.id,
      name: document.template?.name,
      customTitle: document.customTitle || document.title,
      patient: document.patient,
      htmlContent: document.template?.htmlContent,
      pdfUrl: pdfSignedUrl,
      tokenExpiresAt: document.tokenExpiresAt, // ✅ Return tokenExpiresAt
      expiresAt: document.tokenExpiresAt,
      signatureCoordinates: document.template?.signatureCoordinates,
      initialCoordinates: document.template?.initialCoordinates,
      dateCoordinates: document.template?.dateCoordinates,
      patientSignatureName: document.patientSignatureName,
      status: document.status,
    });
  } catch (e) {
    console.error("Error getting document for signing:", e);
    const msg =
      (e &&
        (e.message ||
          (e.data && e.data.message) ||
          (e.original && e.original.detail))) ||
      "Internal server error";
    return error(500, msg);
  }
};

export const submitSignedConsent = async (event) => {
  let tempSignaturePath = null;
  let tempUnsignedPdfPath = null;

  try {
    const query = getQuery(event);
    let token = query.token;

    if (!token) {
      const body = await readBody(event);
      token = body.token;
    }

    if (!token) {
      return error(400, "Access token is required");
    }

    const bodyData = await readBody(event);
    let form = bodyData;

    const hashedToken = hashToken(token);

    const document = await ConsentFormDocument.findOne({
      where: {
        accessTokenHash: hashedToken,
      },
      include: [
        {
          model: ConsentFormTemplate,
          as: "template",
        },
      ],
    });

    if (!document) {
      return error(404, "Document not found or invalid token");
    }

    if (isTokenExpired(document.tokenExpiresAt)) {
      return error(401, "This document link has expired");
    }

    if (document.status === "signed") {
      return error(400, "Document has already been signed");
    }

    // Extract signature from request
    let signatureBuffer = null;
    let signatureData = form.signature || form.signatureData;

    if (signatureData) {
      if (signatureData instanceof Buffer) {
        signatureBuffer = signatureData;
      } else if (typeof signatureData === "string" && signatureData.startsWith("data:")) {
        const base64Data = signatureData.replace(/^data:image\/\w+;base64,/, "");
        signatureBuffer = Buffer.from(base64Data, "base64");
      } else if (typeof signatureData === "string") {
        signatureBuffer = Buffer.from(signatureData, "base64");
      }
    }

    if (!signatureBuffer || signatureBuffer.length === 0) {
      return error(400, "Valid signature image is required");
    }

    if (form.patientName && form.patientName.trim()) {
      document.patientSignatureName = form.patientName.trim();
    }

    // Save signature image temporarily
    tempSignaturePath = path.join(os.tmpdir(), `sig_${Date.now()}.png`);
    fs.writeFileSync(tempSignaturePath, signatureBuffer);

    // Download unsigned PDF from S3
    const pdfBuffer = await downloadFromS3(document.pdfS3Key);
    tempUnsignedPdfPath = path.join(os.tmpdir(), `unsigned_${Date.now()}.pdf`);
    fs.writeFileSync(tempUnsignedPdfPath, pdfBuffer);

    // Get signature coordinates - use best available option
    // Priority: 1) Converted PDF coordinates, 2) Raw detected, 3) Stored, 4) Template, 5) Default
    let signatureCoords = 
      document.metadata?.pdfConvertedCoordinates ||
      document.metadata?.signatureCoordinates ||
      document.template?.signatureCoordinates ||
      { x: 100, y: 650, width: 180, height: 80 };
    
    if (!signatureCoords || (!signatureCoords.x && !signatureCoords.y)) {
      console.error("⚠ Missing signature coordinates:", signatureCoords);
      return error(400, "Signature coordinates not configured for this template");
    }

    // Get total pages from stored metadata
    const totalPages = document.metadata?.totalPages || 1;
    
    // Always use last page for signature placement
    const originalPage = signatureCoords.page || 1;
    signatureCoords.page = totalPages;
    
    console.log(`\n📄 Embedding signature from stored coordinates:`, {
      source: document.metadata?.coordinateSource || 'unknown',
      originalPage,
      targetPage: totalPages,
      coords: signatureCoords,
    });

    // Embed signature using pdf-lib
    const signedPdfBuffer = await embedSignatureWithPuppeteer(
  tempUnsignedPdfPath,
  tempSignaturePath,
  signatureCoords,
  document.template.htmlContent,
  {
    practiceName: "Flossly Dental Practice",
    formTitle: document.customTitle || document.template.name,
    patientName: document.patientSignatureName || "",
    patientEmail: document.patientEmail || "",
    showPatientInfo: true,
  }
);

    // Upload signed PDF to S3
    const signedS3Key = await uploadConsentDocument(
      signedPdfBuffer,
      document.organisationId,
      document.patientId,
      "pdf",
      "signed"
    );

    // Update document
    document.status = "signed";
    document.patientSignatureDate = new Date();
    document.signedAt = new Date();
    document.signedPdfS3Key = signedS3Key;
    document.isFinalized = true;
    document.metadata = {
      ...document.metadata,
      signaturePlacedOnPage: totalPages,
      originalRequestedPage: originalPage,
      signedAt: new Date().toISOString()
    };
    
    await document.save();

    // Audit log
    await ConsentFormSignatureAudit.create({
      documentId: document.id,
      patientId: document.patientId,
      organisationId: document.organisationId,
      action: "signed",
      ipAddress: getClientIpAddress(event),
      userAgent: getUserAgent(event),
      metadata: {
        signatureDate: new Date().toISOString(),
        patientName: document.patientSignatureName,
        coordinates: signatureCoords,
        pageUsed: totalPages
      },
    });

    return success({
      id: document.id,
      status: "signed",
      signedAt: document.signedAt,
      message: "Document signed successfully",
    });
    
  } catch (e) {
    console.error("Error submitting signed consent:", e);
    return error(500, e.message);
  } finally {
    if (tempSignaturePath && fs.existsSync(tempSignaturePath)) {
      fs.unlinkSync(tempSignaturePath);
    }
    if (tempUnsignedPdfPath && fs.existsSync(tempUnsignedPdfPath)) {
      fs.unlinkSync(tempUnsignedPdfPath);
    }
  }
};
export const getSignedConsentDocument = async (event) => {
  try {
    const { orgId } = event.context.user;
    const query = getQuery(event);
    const documentId = Number(query.id || 0);

    if (!documentId) {
      return error(400, "Document ID is required");
    }

    const document = await ConsentFormDocument.findOne({
      where: {
        id: documentId,
        organisationId: Number(orgId),
      },
      include: [
        {
          model: DiaryPatient,
          as: "patient",
          attributes: ["id", "firstName", "lastName", "email"],
        },
      ],
    });

    if (!document) {
      return error(404, "Document not found");
    }

    if (document.status !== "signed") {
      return error(400, "Document has not been signed yet");
    }

    if (!document.signedPdfS3Key) {
      return error(404, "Signed PDF not found");
    }

    const signedUrl = await generateSignedUrl(document.signedPdfS3Key);

    return success({
      id: document.id,
      title: document.title,
      patient: document.patient,
      status: document.status,
      signedAt: document.signedAt,
      pdfUrl: signedUrl,
    });
  } catch (e) {
    const msg =
      (e &&
        (e.message ||
          (e.data && e.data.message) ||
          (e.original && e.original.detail))) ||
      "Internal server error";
    return error(500, msg);
  }
};

export const getConsentAuditTrail = async (event) => {
  try {
    const { orgId } = event.context.user;
    const query = getQuery(event);
    const documentId = Number(query.documentId || 0);

    if (!documentId) {
      return error(400, "Document ID is required");
    }

    const auditTrail = await ConsentFormSignatureAudit.findAll({
      where: {
        documentId,
        organisationId: Number(orgId),
      },
      include: [
        {
          model: User,
          as: "performedByUser",
          attributes: ["id", "fullName", "email"],
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    return success(auditTrail);
  } catch (e) {
    const msg =
      (e &&
        (e.message ||
          (e.data && e.data.message) ||
          (e.original && e.original.detail))) ||
      "Internal server error";
    return error(500, msg);
  }
};

export const voidConsentDocument = async (event) => {
  try {
    const { orgId, userId } = event.context.user;
    const body = await readBody(event);
    const documentId = Number(body.id || 0);

    if (!documentId) {
      return error(400, "Document ID is required");
    }

    const document = await ConsentFormDocument.findOne({
      where: {
        id: documentId,
        organisationId: Number(orgId),
      },
    });

    if (!document) {
      return error(404, "Document not found");
    }

    document.status = "voided";
    document.voidedAt = new Date();
    document.voidedBy = userId;
    document.voidReason = body.reason || "No reason provided"; // ✅ Migration uses voidReason
    await document.save();

    await ConsentFormSignatureAudit.create({
      documentId: document.id,
      patientId: document.patientId,
      organisationId: Number(orgId),
      action: "voided",
      ipAddress: getClientIpAddress(event),
      userAgent: getUserAgent(event),
      metadata: {
        reason: body.reason || null,
      },
      performedBy: userId,
    });

    return success({
      id: document.id,
      status: "voided",
      voidedAt: document.voidedAt,
    });
  } catch (e) {
    console.error("Error voiding document:", e);
    const msg =
      (e &&
        (e.message ||
          (e.data && e.data.message) ||
          (e.original && e.original.detail))) ||
      "Internal server error";
    return error(500, msg);
  }
};

// Add to consentForms controller
export const searchPatients = async (event) => {
  try {
    const { orgId } = event.context.user;
    const query = getQuery(event);
    const searchTerm = query.q || "";

    const patients = await DiaryPatient.findAll({
      where: {
        organisationId: Number(orgId),
        [Op.or]: [
          { firstName: { [Op.iLike]: `%${searchTerm}%` } },
          { lastName: { [Op.iLike]: `%${searchTerm}%` } },
          { email: { [Op.iLike]: `%${searchTerm}%` } },
        ],
      },
      limit: 20,
      attributes: ["id", "firstName", "lastName", "email", "phone"],
    });

    return success(patients);
  } catch (e) {
    return error(500, e.message);
  }
};
