import crypto from "crypto";
import { gcClient } from "~/server/services/gocardless.service";
import { GCMandate, GCPayment, GCWebhookLog } from "../models";
import { GoCardlessAccountingSync } from "../services/goCardlessAccountingSync";
import { sendEmailWithLogging } from "../utils/emailNotifications";
import { resolveWhapiConfig } from "../utils/whatsappProvider.js";
import { normalizeWhatsAppNumber } from "../utils/whatsapp.js";
import { ServerCommunicationLogger } from "../utils/serverCommunicationLogger.js";
import { uploadToS3 } from "../utils/s3.js";

/**
 * CREATE CUSTOMER
 */
export const createCustomer = async (event) => {
  const body = await readBody(event);

  // console.log("[CREATE CUSTOMER] Request received:", {
  //   email: body.email,
  //   firstName: body.firstName,
  //   lastName: body.lastName,
  // });

  try {
    const customerData = {
      email: body.email, //  keep original email
      given_name: body.firstName || "Test",
      family_name: body.lastName || "User",
      address_line1: body.addressLine1 || "27 Acer Road",
      city: body.city || "London",
      postal_code: body.postalCode || "E8 3GX",
      country_code: body.countryCode || "GB",
    };

    // console.log("[CREATE CUSTOMER] Creating customer with data:", customerData);

    const customer = await gcClient.customers.create(customerData);

    return {
      success: true,
      customer: {
        id: customer.id,
        email: customer.email,
        given_name: customer.given_name,
        family_name: customer.family_name,
      },
    };
  } catch (error) {
    console.error("[CREATE CUSTOMER] Error:", error);

    if (error.response?.body) {
      return {
        success: false,
        error: error.response.body.message,
        validation_errors: error.response.body.errors,
        type: error.response.body.type,
      };
    }

    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * CREATE BILLING REQUEST
 */
export const createBillingRequest = async (event) => {
  const body = await readBody(event);
  const { orgId, userId } = event.context.user;

  // console.log("[CREATE BILLING REQUEST] Request received:", {
  //   orgId,
  //   userId,
  //   amount: body.amount,
  //   patientId: body.patientId,
  //   invoiceId: body.invoiceId,
  //   customerId: body.customerId,
  // });

  try {
    const billingRequestMetadata = {
      organisation_id: orgId,
      patient_id: body.patientId,
      invoice_id: body.invoiceId,
      customer_id: body.customerId,
      customer_email: body.customerEmail,
      customer_name: body.customerName,
    };

    // console.log(
    //   "[CREATE BILLING REQUEST] Creating billing request with metadata:",
    //   billingRequestMetadata,
    // );

    // CORRECTED: Use links to reference existing customer, not a customer object
    const billingRequest = await gcClient.billingRequests.create({
      payment_request: {
        amount: Number(body.amount),
        currency: "GBP",
        description: body.description || "Payment",
      },
      mandate_request: {
        scheme: "bacs",
      },
      // Link to existing customer instead of creating a new one
      links: {
        customer: body.customerId, // This is the key change!
      },
      metadata: {
        organisation_id: String(orgId),
        patient_id: String(body.patientId),
        invoice_id: String(body.invoiceId || ""),
      },
    });

    // console.log("[CREATE BILLING REQUEST] Billing request created:", {
    //   id: billingRequest.id,
    //   status: billingRequest.status,
    // });

    const billingRequestFlow = await gcClient.billingRequestFlows.create({
      links: {
        billing_request: billingRequest.id,
      },
      redirect_uri:
        body.redirect_uri || "http://localhost:3000/payment-success",
      exit_uri: body.exit_uri || "http://localhost:3000/payment-canceled",
      language: "en",
    });

    // console.log("[CREATE BILLING REQUEST] Billing request flow created:", {
    //   flowId: billingRequestFlow.id,
    //   redirectUrl: billingRequestFlow.authorisation_url,
    // });

    const mandateMetadata = {
      billingRequestId: billingRequest.id,
      customerId: body.customerId,
      organisationId: orgId,
      patientId: body.patientId,
      invoiceId: body.invoiceId,
      amount: Number(body.amount),
      customerEmail: body.customerEmail,
      customerName: body.customerName,
      createdByUserId: userId,
      createdAt: new Date().toISOString(),
    };

    // Persist expected mandate record so webhook events can attach correctly
    const mandateRecord = await GCMandate.create({
      organisationId: orgId,
      patientId: Number(body.patientId),
      mandateId: null,
      customerId: body.customerId,
      billingRequestId: billingRequest.id,
      status: "pending_submission",
      scheme: "bacs",
      customerEmail: body.customerEmail,
      customerName: body.customerName,
      metadata: mandateMetadata,
    });

    // console.log("[CREATE BILLING REQUEST] Mandate record created:", {
    //   id: mandateRecord.id,
    //   billingRequestId: billingRequest.id,
    //   status: "pending_submission",
    // });

    return {
      success: true,
      billing_request_id: billingRequest.id,
      redirect_url: billingRequestFlow.authorisation_url,
      flow_id: billingRequestFlow.id,
      status: billingRequest.status,
      metadata: mandateMetadata,
    };
  } catch (error) {
    console.error("[CREATE BILLING REQUEST] Error:", error);
    // console.log(
    //   "[CREATE BILLING REQUEST] Error response:",
    //   JSON.stringify(error.response?.body, null, 2),
    // );

    if (error.response?.body) {
      return {
        success: false,
        error: error.response.body.message,
        details: error.response.body.errors,
      };
    }

    return {
      success: false,
      error: error.message,
    };
  }
};
/**
 * SEND GOCARDLESS PAYMENT REQUEST
 */
export const sendGoCardlessPaymentRequest = async (event) => {
  const body = await readBody(event);
  const { orgId, userId } = event.context.user;

  // console.log("[SEND PAYMENT REQUEST] Request received:", {
  //   orgId,
  //   userId,
  //   patientId: body.patientId,
  //   patientEmail: body.patientEmail,
  //   patientPhone: body.patientPhone,
  //   invoiceNumber: body.invoiceNumber,
  //   invoiceAmount: body.invoiceAmount,
  //   sendVia: body.sendVia,
  // });

  try {
    const patientId = Number(body.patientId || 0) || null;
    const patientEmail = String(body.patientEmail || "").trim();
    const patientPhone = String(body.patientPhone || "").trim();
    const patientName = String(body.patientName || "Patient").trim();
    const invoiceNumber = String(body.invoiceNumber || "").trim();
    const invoiceAmount = Number(body.invoiceAmount || 0).toFixed(2);
    const paymentLink = String(body.paymentLink || "").trim();
    const billingRequestId = String(body.billingRequestId || "").trim();
    const sendVia = String(body.sendVia || "email")
      .trim()
      .toLowerCase();
    const sendEmail = sendVia === "email" || sendVia === "both";
    const sendWhatsApp = sendVia === "whatsapp" || sendVia === "both";

    const invoicePdf = body.invoicePdf || null;
    let invoicePdfBuffer = null;
    let invoicePdfUrl = null;
    let invoicePdfMetadata = [];
    const config = useRuntimeConfig();

    if (invoicePdf && invoicePdf.data) {
      try {
        const pdfBuffer = Buffer.from(String(invoicePdf.data), "base64");
        const safeFileName = String(
          invoicePdf.name || `Invoice-${invoiceNumber}.pdf`,
        )
          .replace(/[^a-zA-Z0-9_.-]/g, "_")
          .replace(/_+/g, "_");
        const s3Key = `documents/${safeFileName}`;
        await uploadToS3({
          key: s3Key,
          body: pdfBuffer,
          contentType: invoicePdf.mimeType || "application/pdf",
        });
        invoicePdfUrl = `${String(config.public.BASE_URL || "").replace(/\/+$/, "")}/documents/${encodeURIComponent(safeFileName)}`;
        invoicePdfBuffer = pdfBuffer;
        invoicePdfMetadata.push({
          name: safeFileName,
          mimeType: invoicePdf.mimeType || "application/pdf",
          url: invoicePdfUrl,
        });
      } catch (err) {
        console.warn("[SEND PAYMENT REQUEST] Invoice PDF upload failed:", err);
      }
    }

    if (!patientId || !invoiceNumber || !paymentLink) {
      console.error("[SEND PAYMENT REQUEST] Missing required fields:", {
        hasPatientId: !!patientId,
        hasInvoiceNumber: !!invoiceNumber,
        hasPaymentLink: !!paymentLink,
      });
      return {
        success: false,
        error: "Missing required invoice information.",
      };
    }

    if (sendEmail && !patientEmail) {
      return {
        success: false,
        error: "Patient email is required for email delivery.",
      };
    }

    if (sendWhatsApp && !patientPhone) {
      return {
        success: false,
        error: "Patient phone number is required for WhatsApp delivery.",
      };
    }

    const sendResults = {
      delivered: [],
      failed: [],
    };

    if (sendEmail) {
      const subject = `Payment request for invoice ${invoiceNumber}`;
      const content = `
        <p>Dear ${patientName || "patient"},</p>
        <p>Your invoice <strong>${invoiceNumber}</strong> for <strong>£${invoiceAmount}</strong> is ready.</p>
        <p>Please open given link to any browser to pay securely with GoCardless:</p>
        <p><a href="${paymentLink}">${paymentLink}</a></p>
        <p>If you have any questions, please contact your practice.</p>
      `;
      const html = `<div style="font-family:Helvetica,Arial,sans-serif;color:#1f2937;line-height:1.6;">
        <h2 style="color:#111827;">Payment request</h2>
        ${content}
        <p style="margin-top:24px;">Thank you,<br/>Your practice</p>
      </div>`;
      const mailOptions = {
        to: [patientEmail],
        subject,
        html,
      };

      if (invoicePdfBuffer) {
        mailOptions.attachments = [
          {
            filename:
              invoicePdfMetadata[0]?.name || `Invoice-${invoiceNumber}.pdf`,
            content: invoicePdfBuffer,
            contentType: invoicePdfMetadata[0]?.mimeType || "application/pdf",
          },
        ];
      }

      // console.log("[SEND PAYMENT REQUEST] Sending email to:", patientEmail);
      await sendEmailWithLogging({
        orgId: Number(orgId),
        mailOptions,
        patientId,
        practitionerId: userId,
        logMetadata: {
          billingRequestId,
          invoiceNumber,
          invoiceAmount,
          paymentLink,
          templateName: "GoCardlessPaymentRequest",
          sendVia: sendVia === "both" ? "both" : "email",
          attachments: invoicePdfMetadata.length
            ? invoicePdfMetadata
            : undefined,
        },
      });
      sendResults.delivered.push("email");
    }

    if (sendWhatsApp) {
      const whapiConfig = await resolveWhapiConfig(orgId);
      if (!whapiConfig?.token) {
        const errorMsg = "WhatsApp is not configured for this organisation.";
        if (!sendEmail) {
          return { success: false, error: errorMsg };
        }
        sendResults.failed.push("whatsapp");
      } else {
        const normalizedPhone = normalizeWhatsAppNumber(patientPhone);
        if (!normalizedPhone) {
          const errorMsg = "Invalid phone number for WhatsApp delivery.";
          if (!sendEmail) {
            return { success: false, error: errorMsg };
          }
          sendResults.failed.push("whatsapp");
        } else {
          const whatsappMessage = `Hello ${patientName || "there"},\n\nYour invoice ${invoiceNumber} for £${invoiceAmount} is ready. Please pay securely using the link below:\n\n${paymentLink}\n\nIf you have any questions, please contact your practice.`;
          const whapiBase = String(whapiConfig.baseUrl || "").replace(
            /\/+$/,
            "",
          );
          const headers = {
            Authorization: `Bearer ${whapiConfig.token}`,
            "Content-Type": "application/json",
          };

          let whatsappSent = false;
          const whatsappMetadata = {
            billingRequestId,
            invoiceNumber,
            invoiceAmount,
            paymentLink,
            sendVia: sendVia === "both" ? "both" : "whatsapp",
            attachments: invoicePdfMetadata.length
              ? invoicePdfMetadata
              : undefined,
          };
          const attachmentFailures = [];

          try {
            const resp = await $fetch(`${whapiBase}/messages/text`, {
              method: "POST",
              headers,
              body: {
                to: normalizedPhone,
                body: whatsappMessage,
              },
            });
            whatsappSent = true;
            const externalId = resp?.message?.id || resp?.id || null;

            if (invoicePdfUrl) {
              try {
                await $fetch(`${whapiBase}/messages/document`, {
                  method: "POST",
                  headers,
                  body: {
                    to: normalizedPhone,
                    media: invoicePdfUrl,
                    filename:
                      invoicePdfMetadata[0]?.name ||
                      `Invoice-${invoiceNumber}.pdf`,
                  },
                });
              } catch (attachmentError) {
                console.error(
                  "[SEND PAYMENT REQUEST] WhatsApp attachment send error:",
                  attachmentError,
                );
                attachmentFailures.push(
                  attachmentError?.message || String(attachmentError),
                );
              }
            }

            await ServerCommunicationLogger.logWhatsApp(
              orgId,
              patientId,
              whatsappMessage,
              "Sent",
              userId,
              externalId,
              {
                ...whatsappMetadata,
                attachmentFailures: attachmentFailures.length
                  ? attachmentFailures
                  : undefined,
              },
            );
            sendResults.delivered.push("whatsapp");
            if (attachmentFailures.length) {
              sendResults.attachmentFailures =
                sendResults.attachmentFailures || [];
              sendResults.attachmentFailures.push({
                channel: "whatsapp",
                errors: attachmentFailures,
              });
            }
          } catch (error) {
            console.error("[SEND PAYMENT REQUEST] WhatsApp send error:", error);
            await ServerCommunicationLogger.logFailed(
              orgId,
              patientId,
              "WhatsApp",
              `GoCardless payment request ${invoiceNumber}`,
              whatsappMessage,
              error?.message || String(error),
              userId,
              whatsappMetadata,
            );
            sendResults.failed.push("whatsapp");
          }
        }
      }
    }

    const success =
      sendResults.failed.length === 0 && sendResults.delivered.length > 0;
    if (!success) {
      const errorMessage = sendResults.delivered.length
        ? `Payment link sent via ${sendResults.delivered.join(", ")}. Failed for ${sendResults.failed.join(", ")}.`
        : sendResults.failed.includes("email")
          ? "Failed to send payment link via email."
          : "Failed to send payment link via WhatsApp.";
      return {
        success: false,
        error: errorMessage,
        sentVia: sendResults.delivered,
        failedVia: sendResults.failed,
        attachmentFailures: sendResults.attachmentFailures,
        invoicePdfUrl,
        invoicePdfAttached: invoicePdfBuffer != null,
      };
    }

    return {
      success: true,
      sentVia: sendResults.delivered,
      invoicePdfUrl,
      invoicePdfAttached:
        invoicePdfBuffer != null && invoicePdfMetadata.length > 0,
      attachmentFailures: sendResults.attachmentFailures,
    };
  } catch (error) {
    console.error("[SEND PAYMENT REQUEST] Error:", error);
    return {
      success: false,
      error: error?.message || "Unable to send payment request.",
    };
  }
};

/**
 * CREATE PAYMENT
 */
export const createPayment = async (event) => {
  const body = await readBody(event);
  const { orgId, userId } = event.context.user;

  // console.log("[CREATE PAYMENT] Request received:", {
  //   orgId,
  //   userId,
  //   mandateId: body.mandateId,
  //   amount: body.amount,
  //   patientId: body.patientId,
  // });

  if (!body.mandateId) {
    console.error("[CREATE PAYMENT] Missing mandateId");
    return {
      success: false,
      error: "mandateId is required",
    };
  }

  if (!body.amount) {
    console.error("[CREATE PAYMENT] Missing amount");
    return {
      success: false,
      error: "amount is required",
    };
  }

  try {
    // Find mandate record from local DB
    const mandate = await GCMandate.findOne({
      where: {
        organisationId: Number(orgId),
        mandateId: body.mandateId,
      },
    });

    // console.log("[CREATE PAYMENT] Found mandate:", {
    //   found: !!mandate,
    //   mandateId: mandate?.mandateId,
    //   status: mandate?.status,
    // });

    if (!mandate) {
      return {
        success: false,
        error: "Mandate not found in database",
      };
    }

    const amountInPence = Math.round(Number(body.amount) * 100);
    // console.log("[CREATE PAYMENT] Creating payment:", {
    //   amount: body.amount,
    //   amountInPence,
    //   mandateId: body.mandateId,
    // });

    // Create payment in GoCardless
    const payment = await gcClient.payments.create({
      amount: amountInPence,
      currency: body.currency || "GBP",
      links: {
        mandate: body.mandateId,
      },
      description: body.description || "Payment",
      charge_date: body.charge_date || null,
      metadata: {
        source: "flossly",
        invoice_id: body.invoiceId || null,
        organisation_id: orgId,
        patient_id: body.patientId,
        created_by: userId,
      },
    });

    // console.log("[CREATE PAYMENT] GoCardless payment created:", {
    //   paymentId: payment.id,
    //   status: payment.status,
    //   amount: payment.amount,
    // });

    // Store payment in local DB
    const gcPayment = await GCPayment.create({
      organisationId: Number(orgId),
      patientId: Number(body.patientId),
      invoiceId: body.invoiceId || null,
      paymentId: payment.id,
      gcMandateDbId: mandate.id,
      mandateId: body.mandateId,
      status: payment.status,
      amount: Number(payment.amount) / 100,
      currency: payment.currency,
      description: payment.description,
      reference: payment.reference,
      chargeDate: payment.charge_date,
      metadata: {
        source: "flossly",
        invoice_id: body.invoiceId || null,
        organisation_id: orgId,
        patient_id: body.patientId,
        created_by: userId,
      },
    });

    // console.log("[CREATE PAYMENT] Local payment record created:", {
    //   id: gcPayment.id,
    //   paymentId: gcPayment.paymentId,
    //   status: gcPayment.status,
    // });

    return {
      success: true,
      payment_id: payment.id,
      gc_payment_id: gcPayment.id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      charge_date: payment.charge_date,
      description: payment.description,
      created_at: payment.created_at,
    };
  } catch (error) {
    console.error("[CREATE PAYMENT] Error:", error);

    if (error.response?.body) {
      console.error("[CREATE PAYMENT] API Error:", error.response.body);
      return {
        success: false,
        error: error.response.body.message,
        details: error.response.body.errors,
      };
    }

    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * BILLING REQUEST DETAILS
 */
export const getBillingRequestDetails = async (event) => {
  const query = getQuery(event);
  const billingRequestId = query.id;

  // console.log(
  //   "[GET BILLING REQUEST DETAILS] Request for ID:",
  //   billingRequestId,
  // );

  if (!billingRequestId) {
    console.error("[GET BILLING REQUEST DETAILS] Missing billing_request_id");
    return {
      success: false,
      error: "billing_request_id is required",
    };
  }

  try {
    const billingRequest =
      await gcClient.billingRequests.find(billingRequestId);

    // console.log("[GET BILLING REQUEST DETAILS] Found:", {
    //   id: billingRequest.id,
    //   status: billingRequest.status,
    //   mandateId: billingRequest.links?.mandate,
    // });

    return {
      success: true,
      billing_request_id: billingRequest.id,
      status: billingRequest.status,
      mandate_id: billingRequest.links?.mandate,
      payment_id: billingRequest.links?.payment,
      amount: billingRequest.payment_request?.amount,
      currency: billingRequest.payment_request?.currency,
      description: billingRequest.payment_request?.description,
      charge_date: billingRequest.payment_request?.charge_date,
      created_at: billingRequest.created_at,
      updated_at: billingRequest.updated_at,
    };
  } catch (error) {
    console.error("[GET BILLING REQUEST DETAILS] Error:", error);

    if (error.response?.body) {
      console.error(
        "[GET BILLING REQUEST DETAILS] API Error:",
        error.response.body,
      );
      return {
        success: false,
        error: error.response.body.message,
        details: error.response.body.errors,
      };
    }

    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * CHECK BILLING REQUEST
 */
export const checkBillingRequest = async (event) => {
  const query = getQuery(event);
  const billingRequestId = query.id;

  // console.log("[CHECK BILLING REQUEST] Request for ID:", billingRequestId);

  if (!billingRequestId) {
    console.error("[CHECK BILLING REQUEST] Missing billing_request_id");
    return {
      success: false,
      error: "billing_request_id is required",
    };
  }

  try {
    const billingRequest =
      await gcClient.billingRequests.find(billingRequestId);

    // console.log("[CHECK BILLING REQUEST] Status:", {
    //   id: billingRequest.id,
    //   status: billingRequest.status,
    //   mandateId: billingRequest.links?.mandate,
    // });

    return {
      success: true,
      status: billingRequest.status,
      mandate_id: billingRequest.links?.mandate,
      payment_id: billingRequest.links?.payment,
      charge_date: billingRequest.payment_request?.charge_date,
      amount: billingRequest.payment_request?.amount,
      currency: billingRequest.payment_request?.currency,
      description: billingRequest.payment_request?.description,
      created_at: billingRequest.created_at,
    };
  } catch (error) {
    console.error("[CHECK BILLING REQUEST] Error:", error);

    if (error.response?.body) {
      console.error("[CHECK BILLING REQUEST] API Error:", error.response.body);
      return {
        success: false,
        error: error.response.body.message,
        details: error.response.body.errors,
      };
    }

    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * WEBHOOK
 */
export const webhookHandler = async (event) => {
  // console.log("[WEBHOOK] ========== WEBHOOK RECEIVED ==========");

  const rawBody = await readRawBody(event);
  const signature =
    getHeader(event, "Webhook-Signature") ||
    getHeader(event, "webhook-signature");
  const webhookId = getHeader(event, "webhook-id");

  // console.log("[WEBHOOK] Headers:", {
  //   webhookId,
  //   hasSignature: !!signature,
  //   bodyLength: rawBody?.length,
  // });

  const webhookSecret = process.env.GOCARDLESS_WEBHOOK_SECRET;

  // Verify signature if secret is configured
  if (webhookSecret && signature) {
    const hash = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    // console.log("[WEBHOOK] Signature verification:", {
    //   valid: hash === signature,
    //   hashProvided: signature?.substring(0, 10),
    //   hashComputed: hash?.substring(0, 10),
    // });

    if (hash !== signature) {
      console.error("[WEBHOOK] Invalid signature!");
      throw createError({
        statusCode: 401,
        message: "Invalid signature",
      });
    }
  }

  const payload = JSON.parse(rawBody);
  const events = payload.events || [];
  const eventIds = events.map((item) => item.id).filter(Boolean);

  // console.log("[WEBHOOK] Payload received:", {
  //   eventCount: events.length,
  //   eventIds: eventIds,
  //   webhookId,
  // });

  const idempotencyKey = webhookId
    ? `${webhookId}:${eventIds.join(",")}`
    : eventIds.length
      ? eventIds.join(",")
      : crypto.randomUUID();

  // Prevent duplicate webhook processing
  const existingLog = await GCWebhookLog.findOne({ where: { idempotencyKey } });

  if (existingLog) {
    // console.log("[WEBHOOK] Duplicate webhook detected, skipping:", {
    //   idempotencyKey,
    // });
    return {
      success: true,
      received: events.length,
      processed: existingLog.processed ? existingLog.eventsProcessed : 0,
      duplicate: true,
    };
  }

  // console.log(
  //   "[WEBHOOK] Processing new webhook, idempotency key:",
  //   idempotencyKey,
  // );

  // Log webhook for audit and idempotency
  const webhookLog = await GCWebhookLog.create({
    webhookId,
    signature,
    payload,
    eventCount: events.length,
    idempotencyKey,
  });

  // console.log("[WEBHOOK] Webhook log created:", { logId: webhookLog.id });

  let eventsProcessed = 0;
  let processingErrors = [];

  // Process each event
  for (const eventItem of events) {
    // console.log("[WEBHOOK] Processing event:", {
    //   id: eventItem.id,
    //   action: eventItem.action,
    //   resource_type: eventItem.resource_type,
    // });

    try {
      await processWebhookEvent(eventItem);
      eventsProcessed++;
      // console.log("[WEBHOOK] Event processed successfully:", eventItem.id);
    } catch (error) {
      console.error(`[WEBHOOK] Error processing event ${eventItem.id}:`, error);
      processingErrors.push({
        eventId: eventItem.id,
        error: error.message,
      });
    }
  }

  // Update webhook log
  await webhookLog.update({
    processed: eventsProcessed === events.length,
    processedAt: new Date(),
    eventsProcessed,
    processingError:
      processingErrors.length > 0 ? JSON.stringify(processingErrors) : null,
  });

  // console.log("[WEBHOOK] Webhook processing complete:", {
  //   totalEvents: events.length,
  //   processed: eventsProcessed,
  //   errors: processingErrors.length,
  // });

  return {
    success: true,
    received: events.length,
    processed: eventsProcessed,
    errors: processingErrors.length,
  };
};

/**
 * PROCESS WEBHOOK EVENT
 */
const processWebhookEvent = async (event) => {
  const { action, links, resource_type, id } = event;
  // In the webhookHandler, add this temporary logging for payment events
  if (resource_type === "payments") {
    // console.log(
    //   "[WEBHOOK] Full payment webhook payload:",
    //   JSON.stringify(event, null, 2),
    // );
  }
  // console.log(
  //   `[WEBHOOK:PROCESS] Processing ${action} for ${resource_type}: ${id}`,
  // );

  switch (resource_type) {
    case "billing_requests":
      // console.log("[WEBHOOK:PROCESS] Handling billing request event");
      await handleBillingRequestEvent(action, links, event);
      break;
    case "mandates":
      // console.log("[WEBHOOK:PROCESS] Handling mandate event");
      await handleMandateEvent(action, links, event);
      break;
    case "payments":
      // console.log("[WEBHOOK:PROCESS] Handling payment event");
      await handlePaymentEvent(action, links, event);
      break;
    case "payouts":
      // console.log("[WEBHOOK:PROCESS] Handling payout event");
      await handlePayoutEvent(action, links, event);
      break;
    default:
      console.log(
        `[WEBHOOK:PROCESS] Unhandled resource type: ${resource_type}`,
      );
  }
};

/**
 * HANDLE MANDATE EVENT
 */
const handleMandateEvent = async (action, links, event) => {
  const mandateId = links?.mandate || links?.mandate_request_mandate || null;
  const billingRequestId = links?.billing_request;

  // console.log("[WEBHOOK:MANDATE] Processing mandate event:", {
  //   action,
  //   mandateId,
  //   billingRequestId
  // });

  if (!mandateId) {
    // console.log("[WEBHOOK:MANDATE] No mandate ID found, skipping");
    return;
  }

  let mandate = null;

  if (mandateId) {
    mandate = await GCMandate.findOne({ where: { mandateId } });
    // console.log("[WEBHOOK:MANDATE] Found mandate by ID:", !!mandate);
  }

  if (!mandate && billingRequestId) {
    mandate = await GCMandate.findOne({ where: { billingRequestId } });
    // console.log("[WEBHOOK:MANDATE] Found mandate by billing request ID:", !!mandate);

    // CRITICAL FIX: Update the mandate with the actual mandate ID
    if (mandate && mandateId && !mandate.mandateId) {
      // console.log("[WEBHOOK:MANDATE] Updating mandate with ID:", mandateId);
      await mandate.update({ mandateId });
      await mandate.reload();
    }
  }

  if (!mandate) {
    // console.log(`[WEBHOOK:MANDATE] Mandate not found for ID: ${mandateId}`);
    return;
  }

  const statusMap = {
    created: "pending_submission",
    customer_approval_granted: "pending_submission",
    customer_approval_skipped: "pending_submission",
    submitted: "submitted",
    active: "active",
    reinstated: "active",
    failed: "failed",
    cancelled: "cancelled",
    replaced: "cancelled",
    transferred: "cancelled",
    expired: "expired",
    consumed: "consumed",
    blocked: "blocked",
    resubmission_requested: "pending_submission",
  };

  const newStatus = statusMap[action] || mandate.status;

  // console.log("[WEBHOOK:MANDATE] Updating mandate status:", {
  //   oldStatus: mandate.status,
  //   newStatus,
  //   action,
  //   mandateId: mandate.mandateId
  // });

  await mandate.update({ status: newStatus });

  // console.log(`[WEBHOOK:MANDATE] Mandate ${mandateId} status updated to ${newStatus}`);
};

/**
 * HANDLE PAYMENT EVENT
 */
const handlePaymentEvent = async (action, links, event) => {
  const paymentId = links?.payment || event.links?.payment || null;
  const metadata = event.details?.metadata || {};
  let mandateId =
    links?.mandate || metadata.mandate_id || metadata.mandateId || null;
  const billingRequestId =
    links?.billing_request ||
    metadata.billing_request_id ||
    metadata.billingRequestId ||
    null;

  // console.log("[WEBHOOK:PAYMENT] Processing payment event:", {
  //   action,
  //   paymentId,
  //   mandateId,
  //   billingRequestId,
  //   hasMetadata: !!metadata,
  // });

  try {
    let payment = null;
    let mandate = null;
    let practitionerId = null;
    let practitionerName = null;

    // First, try to find existing payment
    if (paymentId) {
      payment = await GCPayment.findOne({ where: { paymentId } });
      // console.log("[WEBHOOK:PAYMENT] Found payment by ID:", !!payment);
    }

    // Try to find mandate by billingRequestId first (since we have that)
    if (billingRequestId) {
      mandate = await GCMandate.findOne({ where: { billingRequestId } });
      // console.log("[WEBHOOK:PAYMENT] Found mandate by billing request ID:", !!mandate);
    }

    // If we don't have mandateId, fetch payment details from GoCardless API
    if (!mandateId && paymentId) {
      try {
        // console.log("[WEBHOOK:PAYMENT] Fetching payment from API to get mandate ID");
        const gcPayment = await gcClient.payments.find(paymentId);
        mandateId = gcPayment.links?.mandate;
        // console.log("[WEBHOOK:PAYMENT] Retrieved mandate ID from API:", mandateId);

        // CRITICAL FIX: Update the mandate record with the actual mandate ID
        if (mandateId && mandate && !mandate.mandateId) {
          // console.log("[WEBHOOK:PAYMENT] Updating mandate record with ID:", mandateId);
          await mandate.update({ mandateId });
          await mandate.reload();
          // console.log("[WEBHOOK:PAYMENT] Mandate updated:", {
          //   id: mandate.id,
          //   mandateId: mandate.mandateId,
          //   status: mandate.status
          // });
        }
      } catch (apiError) {
        console.error(
          "[WEBHOOK:PAYMENT] Failed to fetch payment from API:",
          apiError,
        );
      }
    }

    // Try to find mandate by mandateId if we have it and not found yet
    if (!mandate && mandateId) {
      mandate = await GCMandate.findOne({ where: { mandateId } });
      // console.log("[WEBHOOK:PAYMENT] Found mandate by ID:", !!mandate);
    }

    // Get organisation and patient info from mandate or metadata
    const organisationId =
      Number(metadata.organisation_id || metadata.organisationId) ||
      mandate?.organisationId ||
      null;
    const patientId =
      Number(metadata.patient_id || metadata.patientId) ||
      mandate?.patientId ||
      null;
    const invoiceId =
      metadata.invoice_id ||
      metadata.invoiceId ||
      mandate?.metadata?.invoiceId ||
      null;

    // NEW: Get practitioner info from the invoice if invoiceId exists
    if (invoiceId) {
      try {
        const { PatientInvoice } = await import("../models");
        const invoice = await PatientInvoice.findOne({
          where: { id: Number(invoiceId), organisationId: organisationId },
          attributes: ["practitionerId", "practitionerName"],
        });
        if (invoice) {
          practitionerId = invoice.practitionerId;
          practitionerName = invoice.practitionerName;
          // console.log("[WEBHOOK:PAYMENT] Retrieved practitioner from invoice:", {
          //   practitionerId,
          //   practitionerName,
          //   invoiceId
          // });
        }
      } catch (invoiceError) {
        console.error(
          "[WEBHOOK:PAYMENT] Error fetching invoice:",
          invoiceError,
        );
      }
    }

    // Extract amount - fetch from API if needed
    let amount = null;

    if (event.details?.amount) {
      amount = event.details.amount;
    } else if (paymentId) {
      try {
        const gcPayment = await gcClient.payments.find(paymentId);
        amount = gcPayment.amount;
        if (!mandateId && gcPayment.links?.mandate) {
          mandateId = gcPayment.links.mandate;
          // Update mandate if needed
          if (mandateId && mandate && !mandate.mandateId) {
            await mandate.update({ mandateId });
            await mandate.reload();
          }
        }
        // console.log("[WEBHOOK:PAYMENT] Fetched amount from API:", amount);
      } catch (apiError) {
        // console.error("[WEBHOOK:PAYMENT] Failed to fetch amount from API:", apiError);
      }
    } else if (metadata.amount) {
      amount = metadata.amount;
    }

    const currency = event.details?.currency || metadata.currency || "GBP";

    // console.log("[WEBHOOK:PAYMENT] Extracted data:", {
    //   organisationId,
    //   patientId,
    //   invoiceId,
    //   amount,
    //   currency,
    //   mandateId,
    //   hasMandate: !!mandate,
    //   mandateRecordId: mandate?.id,
    //   mandateRecordMandateId: mandate?.mandateId,
    //   practitionerId,
    //   practitionerName
    // });

    // Check if we have all required data to create/update payment
    if (!paymentId || !organisationId || !patientId) {
      // console.log(`[WEBHOOK:PAYMENT] Payment ${paymentId || '(unknown)'} missing required mapping data; skipping webhook event`, {
      //   hasPaymentId: !!paymentId,
      //   hasOrganisationId: !!organisationId,
      //   hasPatientId: !!patientId
      // });
      return;
    }

    // For creating a new payment, we need mandate information
    if (!payment) {
      // Use mandateId from either direct or from mandate object
      const finalMandateId = mandateId || mandate?.mandateId;

      if (!finalMandateId) {
        // console.log(`[WEBHOOK:PAYMENT] Cannot create payment - no mandate ID available for payment ${paymentId}`);
        return;
      }

      if (!amount) {
        console.warn(
          `[WEBHOOK:PAYMENT] No amount found for payment ${paymentId}, using 0`,
        );
        amount = 0;
      }

      // console.log("[WEBHOOK:PAYMENT] Creating new payment record with:", {
      //   paymentId,
      //   finalMandateId,
      //   amount,
      //   organisationId,
      //   patientId,
      //   practitionerId,
      //   practitionerName
      // });

      payment = await GCPayment.create({
        organisationId,
        patientId,
        invoiceId: invoiceId ? Number(invoiceId) : null,
        paymentId,
        mandateId: finalMandateId,
        gcMandateDbId: mandate?.id,
        status: action || "created",
        amount: Number(amount) / 100,
        currency,
        description:
          event.details?.description ||
          metadata.description ||
          "GoCardless payment",
        reference:
          event.details?.reference || metadata.reference || `GC-${paymentId}`,
        chargeDate: event.details?.charge_date,
        // NEW: Add practitioner info to metadata
        metadata: {
          ...metadata,
          source: "webhook",
          webhook_action: action,
          billing_request_id: billingRequestId,
          practitioner_id: practitionerId,
          practitioner_name: practitionerName,
        },
      });

      // console.log("[WEBHOOK:PAYMENT] Payment record created:", {
      //   id: payment.id,
      //   paymentId: payment.paymentId,
      //   amount: payment.amount,
      //   mandateId: payment.mandateId,
      //   practitionerId,
      //   practitionerName
      // });
    }

    if (!payment) {
      // console.log(`[WEBHOOK:PAYMENT] No payment record available for ${paymentId}`);
      return;
    }

    // Update payment mandateId if missing
    if (!payment.mandateId && (mandateId || mandate?.mandateId)) {
      const finalMandateId = mandateId || mandate?.mandateId;
      // console.log("[WEBHOOK:PAYMENT] Updating payment with mandateId:", finalMandateId);
      await payment.update({ mandateId: finalMandateId });
    }

    // Update payment status
    const statusMap = {
      created: "created",
      submitted: "submitted",
      confirmed: "confirmed",
      paid_out: "paid_out",
      failed: "failed",
      cancelled: "cancelled",
      charged_back: "charged_back",
    };

    const newStatus = statusMap[action] || payment.status;

    // console.log("[WEBHOOK:PAYMENT] Updating payment status:", {
    //   oldStatus: payment.status,
    //   newStatus,
    //   action,
    //   currentAmount: payment.amount
    // });

    await payment.update({
      status: newStatus,
      processedAt:
        newStatus === "confirmed" || newStatus === "paid_out"
          ? new Date()
          : payment.processedAt,
      lastWebhookAt: new Date(),
    });

    await payment.reload();

    // console.log(`[WEBHOOK:PAYMENT] Payment ${paymentId} status updated to ${newStatus}`);

    // Call the accounting sync - this will now work because mandate.mandateId is set
    await GoCardlessAccountingSync.handlePaymentStatusChange(
      payment,
      newStatus,
      event,
    );
  } catch (error) {
    console.error(
      `[WEBHOOK:PAYMENT] Error handling payment event ${action} for ${paymentId}:`,
      error,
    );
    throw error;
  }
};
/**
 * HANDLE PAYOUT EVENT
 */
const handlePayoutEvent = async (action, links, event) => {
  const payoutId = links.payout;

  // console.log(`[WEBHOOK:PAYOUT] Payout event:`, {
  //   payoutId,
  //   action,
  // });

  // For now, just log payout events
  // Future enhancement: track payout confirmations for reconciliation
  switch (action) {
    case "paid":
      // console.log(`[WEBHOOK:PAYOUT] Payout ${payoutId} has been paid`);
      break;
    default:
    // console.log(`[WEBHOOK:PAYOUT] Unhandled payout action: ${action}`);
  }
};

/**
 * HANDLE BILLING REQUEST EVENT
 */
const handleBillingRequestEvent = async (action, links, event) => {
  // console.log("[WEBHOOK:BILLING_REQUEST] Processing:", { action });

  if (action !== "fulfilled") {
    // console.log("[WEBHOOK:BILLING_REQUEST] Action not fulfilled, skipping");
    return;
  }

  const billingRequestId = links?.billing_request;

  if (!billingRequestId) {
    // console.log("[WEBHOOK:BILLING_REQUEST] No billing request ID found");
    return;
  }

  // console.log(
  //   "[WEBHOOK:BILLING_REQUEST] Fetching billing request:",
  //   billingRequestId,
  // );

  const gcBillingRequest =
    await gcClient.billingRequests.find(billingRequestId);
  const mandateId = gcBillingRequest.links?.mandate;

  if (!mandateId) {
    // console.log("[WEBHOOK:BILLING_REQUEST] No mandate ID in billing request");
    return;
  }

  const mandate = await GCMandate.findOne({
    where: { billingRequestId },
  });

  if (!mandate) {
    // console.log(
    //   `[WEBHOOK:BILLING_REQUEST] No local mandate found for billing request ${billingRequestId}`,
    // );
    return;
  }

  // // console.log("[WEBHOOK:BILLING_REQUEST] Updating mandate:", {
  //   mandateId,
  //   oldStatus: mandate.status,
  //   newStatus: "submitted",
  // });

  await mandate.update({
    mandateId,
    status: "submitted",
  });

  // console.log(
  //   `[WEBHOOK:BILLING_REQUEST] Mandate linked successfully ${mandateId}`,
  // );
};

/**
 * HELPER FUNCTIONS
 */
const findMandateByEvent = async (eventItem) => {
  const metadata = eventItem.details?.metadata || {};
  const mandateId = eventItem.links?.mandate || null;
  const billingRequestId =
    eventItem.links?.billing_request ||
    metadata.billing_request_id ||
    metadata.billingRequestId ||
    null;

  if (mandateId) {
    const mandate = await GCMandate.findOne({ where: { mandateId } });
    if (mandate) return mandate;
  }

  if (billingRequestId) {
    const mandate = await GCMandate.findOne({ where: { billingRequestId } });
    if (mandate) return mandate;
  }

  return null;
};

const resolvePatientIdForWebhookEvent = async (eventItem) => {
  const metadata = eventItem.details?.metadata || {};
  const explicitPatientId = metadata.patient_id || metadata.patientId;

  if (explicitPatientId) {
    return Number(explicitPatientId);
  }

  const mandate = await findMandateByEvent(eventItem);
  if (mandate) {
    return mandate.patientId;
  }

  if (eventItem.links?.payment) {
    const payment = await GCPayment.findOne({
      where: { paymentId: eventItem.links.payment },
    });
    if (payment) {
      return payment.patientId;
    }
  }

  return null;
};

/**
 * GET PATIENT MANDATES
 */
export const getPatientMandates = async (event) => {
  const { orgId } = event.context.user;
  const query = getQuery(event);
  const patientId = query.patientId;

  // console.log("[GET PATIENT MANDATES] Request:", { orgId, patientId });

  if (!patientId) {
    console.error("[GET PATIENT MANDATES] Missing patientId");
    return {
      success: false,
      error: "patientId is required",
    };
  }

  try {
    const mandates = await GCMandate.findAll({
      where: {
        organisationId: Number(orgId),
        patientId: Number(patientId),
      },
      order: [["createdAt", "DESC"]],
    });

    // console.log(
    //   `[GET PATIENT MANDATES] Found ${mandates.length} mandates:`,
    //   mandates.map((m) => ({
    //     id: m.id,
    //     mandateId: m.mandateId,
    //     status: m.status,
    //   })),
    // );

    return {
      success: true,
      mandates: mandates.map((mandate) => ({
        id: mandate.id,
        mandateId: mandate.mandateId,
        customerId: mandate.customerId,
        status: mandate.status,
        scheme: mandate.scheme,
        reference: mandate.reference,
        billingRequestId: mandate.billingRequestId,
        customerEmail: mandate.customerEmail,
        customerName: mandate.customerName,
        metadata: mandate.metadata,
        createdAt: mandate.createdAt,
      })),
    };
  } catch (error) {
    console.error("[GET PATIENT MANDATES] Error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * GET PATIENT PAYMENTS
 */
export const getPatientPayments = async (event) => {
  const { orgId } = event.context.user;
  const query = getQuery(event);
  const patientId = query.patientId;

  // console.log("[GET PATIENT PAYMENTS] Request:", { orgId, patientId });

  if (!patientId) {
    console.error("[GET PATIENT PAYMENTS] Missing patientId");
    return {
      success: false,
      error: "patientId is required",
    };
  }

  try {
    const payments = await GCPayment.findAll({
      where: {
        organisationId: Number(orgId),
        patientId: Number(patientId),
      },
      order: [["createdAt", "DESC"]],
    });

    // console.log(`[GET PATIENT PAYMENTS] Found ${payments.length} payments`);

    return {
      success: true,
      payments: payments.map((payment) => ({
        id: payment.id,
        paymentId: payment.paymentId,
        mandateId: payment.mandateId,
        invoiceId: payment.invoiceId,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        description: payment.description,
        reference: payment.reference,
        chargeDate: payment.chargeDate,
        processedAt: payment.processedAt,
        accountingSynced: payment.accountingSynced,
        retryCount: payment.retryCount,
        lastRetryAt: payment.lastRetryAt,
        failureReason: payment.failureReason,
        failureCode: payment.failureCode,
        webhookEvents: payment.webhookEvents,
        lastWebhookAt: payment.lastWebhookAt,
        metadata: payment.metadata,
        createdAt: payment.createdAt,
      })),
    };
  } catch (error) {
    console.error("[GET PATIENT PAYMENTS] Error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * GET PATIENT CUSTOMERS
 */
export const getPatientCustomers = async (event) => {
  const { orgId } = event.context.user;
  const query = getQuery(event);
  const patientId = query.patientId;

  // console.log("[GET PATIENT CUSTOMERS] Request:", { orgId, patientId });

  if (!patientId) {
    console.error("[GET PATIENT CUSTOMERS] Missing patientId");
    return {
      success: false,
      error: "patientId is required",
    };
  }

  try {
    const mandates = await GCMandate.findAll({
      where: {
        organisationId: Number(orgId),
        patientId: Number(patientId),
      },
      order: [["createdAt", "DESC"]],
    });

    // console.log(`[GET PATIENT CUSTOMERS] Found ${mandates.length} mandates`);

    const customers = {};
    mandates.forEach((mandate) => {
      if (!mandate.customerId) return;
      if (!customers[mandate.customerId]) {
        customers[mandate.customerId] = {
          customerId: mandate.customerId,
          customerName: mandate.customerName,
          customerEmail: mandate.customerEmail,
          mandateCount: 0,
          lastStatus: mandate.status,
          lastBillingRequestId: mandate.billingRequestId,
          lastCreatedAt: mandate.createdAt,
        };
      }

      customers[mandate.customerId].mandateCount += 1;
      if (
        new Date(mandate.createdAt) >
        new Date(customers[mandate.customerId].lastCreatedAt)
      ) {
        customers[mandate.customerId].lastStatus = mandate.status;
        customers[mandate.customerId].lastBillingRequestId =
          mandate.billingRequestId;
        customers[mandate.customerId].lastCreatedAt = mandate.createdAt;
      }
    });

    // console.log(
    //   `[GET PATIENT CUSTOMERS] Grouped into ${Object.keys(customers).length} customers`,
    // );

    return {
      success: true,
      customers: Object.values(customers),
    };
  } catch (error) {
    console.error("[GET PATIENT CUSTOMERS] Error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * GET WEBHOOK LOGS
 */
export const getWebhookLogs = async (event) => {
  const query = getQuery(event);
  const patientId = query.patientId ? Number(query.patientId) : null;

  // console.log("[GET WEBHOOK LOGS] Request:", { patientId });

  try {
    const logs = await GCWebhookLog.findAll({
      order: [["createdAt", "DESC"]],
    });

    // console.log(`[GET WEBHOOK LOGS] Found ${logs.length} total logs`);

    const filteredLogs = [];
    const patientIdNumber = patientId;

    for (const log of logs) {
      if (!patientIdNumber) {
        filteredLogs.push(log);
        continue;
      }

      const events = Array.isArray(log.payload?.events)
        ? log.payload.events
        : [];
      let matchesPatient = false;

      for (const eventItem of events) {
        const eventPatientId = await resolvePatientIdForWebhookEvent(eventItem);
        if (eventPatientId === patientIdNumber) {
          matchesPatient = true;
          break;
        }
      }

      if (matchesPatient) {
        filteredLogs.push(log);
      }
    }

    // console.log(
    //   `[GET WEBHOOK LOGS] Filtered to ${filteredLogs.length} logs for patient ${patientId}`,
    // );

    return {
      success: true,
      webhookLogs: filteredLogs.map((log) => ({
        id: log.id,
        webhookId: log.webhookId,
        payload: log.payload,
        processed: log.processed,
        processedAt: log.processedAt,
        processingError: log.processingError,
        eventCount: log.eventCount,
        eventsProcessed: log.eventsProcessed,
        idempotencyKey: log.idempotencyKey,
        createdAt: log.createdAt,
      })),
    };
  } catch (error) {
    console.error("[GET WEBHOOK LOGS] Error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * REFRESH PAYMENT STATUS
 */
export const refreshPaymentStatus = async (event) => {
  const body = await readBody(event);
  const { orgId } = event.context.user;
  const paymentId = String(body.paymentId || "").trim();

  // console.log("[REFRESH PAYMENT] Request:", { orgId, paymentId });

  if (!paymentId) {
    console.error("[REFRESH PAYMENT] Missing paymentId");
    return {
      success: false,
      error: "paymentId is required",
    };
  }

  try {
    const payment = await GCPayment.findOne({
      where: {
        organisationId: Number(orgId),
        paymentId,
      },
    });

    if (!payment) {
      console.error("[REFRESH PAYMENT] Payment not found:", paymentId);
      return {
        success: false,
        error: "Payment not found",
      };
    }

    // console.log("[REFRESH PAYMENT] Fetching from GoCardless:", paymentId);

    const gcPayment = await gcClient.payments.find(paymentId);
    const newStatus = gcPayment.status || payment.status;

    // console.log("[REFRESH PAYMENT] Status update:", {
    //   oldStatus: payment.status,
    //   newStatus,
    // });

    await GoCardlessAccountingSync.handlePaymentStatusChange(
      payment,
      newStatus,
      {
        id: gcPayment.id,
        resource_type: "payments",
        action: gcPayment.status,
        details: {
          description: gcPayment.description,
          reference: gcPayment.reference,
          amount: gcPayment.amount,
          currency: gcPayment.currency,
          code: gcPayment.details?.code,
          reason: gcPayment.details?.reason,
        },
      },
    );

    return {
      success: true,
      paymentId,
      status: newStatus,
    };
  } catch (error) {
    console.error("[REFRESH PAYMENT] Error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * REFRESH MANDATE STATUS
 */
export const refreshMandateStatus = async (event) => {
  const body = await readBody(event);
  const { orgId } = event.context.user;
  const mandateId = String(body.mandateId || "").trim();

  // console.log("[REFRESH MANDATE] Request:", { orgId, mandateId });

  if (!mandateId) {
    console.error("[REFRESH MANDATE] Missing mandateId");
    return {
      success: false,
      error: "mandateId is required",
    };
  }

  try {
    const mandate = await GCMandate.findOne({
      where: {
        organisationId: Number(orgId),
        mandateId,
      },
    });

    if (!mandate) {
      console.error("[REFRESH MANDATE] Mandate not found:", mandateId);
      return {
        success: false,
        error: "Mandate not found",
      };
    }

    // console.log("[REFRESH MANDATE] Fetching from GoCardless:", mandateId);

    const gcMandate = await gcClient.mandates.find(mandateId);
    const newStatus = gcMandate.status || mandate.status;

    // console.log("[REFRESH MANDATE] Status update:", {
    //   oldStatus: mandate.status,
    //   newStatus,
    // });

    await GoCardlessAccountingSync.handleMandateStatusChange(
      mandate,
      newStatus,
      {
        id: gcMandate.id,
        resource_type: "mandates",
        action: gcMandate.status,
        details: {
          code: gcMandate.details?.code,
          reason: gcMandate.details?.reason,
        },
      },
    );

    return {
      success: true,
      mandateId,
      status: newStatus,
    };
  } catch (error) {
    console.error("[REFRESH MANDATE] Error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * CANCEL MANDATE
 */
export const cancelMandate = async (event) => {
  const body = await readBody(event);
  const { orgId } = event.context.user;
  const mandateId = String(body.mandateId || "").trim();

  // console.log("[CANCEL MANDATE] Request:", { orgId, mandateId });

  if (!mandateId) {
    console.error("[CANCEL MANDATE] Missing mandateId");
    return {
      success: false,
      error: "mandateId is required",
    };
  }

  try {
    const mandate = await GCMandate.findOne({
      where: {
        organisationId: Number(orgId),
        mandateId,
      },
    });

    if (!mandate) {
      console.error("[CANCEL MANDATE] Mandate not found:", mandateId);
      return {
        success: false,
        error: "Mandate not found",
      };
    }

    // console.log("[CANCEL MANDATE] Cancelling mandate in GoCardless");

    try {
      if (gcClient.mandates && typeof gcClient.mandates.cancel === "function") {
        await gcClient.mandates.cancel(mandateId);
        // console.log(
        //   "[CANCEL MANDATE] GoCardless mandate cancelled successfully",
        // );
      } else {
        console.warn("[CANCEL MANDATE] GoCardless cancel method not available");
      }
    } catch (innerError) {
      console.warn(
        "[CANCEL MANDATE] GoCardless mandate cancel fallback:",
        innerError,
      );
    }

    // console.log("[CANCEL MANDATE] Updating local mandate status to cancelled");
    await mandate.update({ status: "cancelled" });

    return {
      success: true,
      mandateId,
      status: "cancelled",
    };
  } catch (error) {
    console.error("[CANCEL MANDATE] Error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
