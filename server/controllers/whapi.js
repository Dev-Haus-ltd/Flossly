import { Op } from "sequelize";
import {
  CrmLead,
  CrmWhatsAppMessageLog,
  WhapiChannelConfig,
  UserOrganisation,
  Organisation,
  OrganisationTreatment,
  DiaryPatientCommunicationLogs,
} from "../models";
import { normalizeWhatsAppNumber, logWhatsAppMessage, isWhatsAppLimitExceeded } from "../utils/whatsapp";
import { success, error } from "../utils/response";
import { requireFeature } from "../utils/requireFeature";
import { addWhapiClient, broadcastWhapiEvent } from "../utils/whapiStream";
import { sendNotificationToMultipleUsers } from "../utils/fcmNotification";
import { encrypt, decrypt } from "../utils/crypto";
import { getWhapiEnvConfig, getWhapiPartnerConfig, resolveWhapiConfig } from "../utils/whatsappProvider";
import { uploadBufferFile, downloadUrlToS3 } from "../utils/storage";
import { chat, generateAutoReply } from "../utils/aiWrapper";
import { createError } from "h3";
import { canUsePaidWhatsApp } from "../utils/commercialPolicy.js";

const extractTimestamp = (value) => {
  if (!value) return Date.now();
  const raw = Number(value);
  if (Number.isNaN(raw)) return Date.now();
  if (raw < 1e12) return raw * 1000;
  return raw;
};

const isWhapiCreateAllowed = () => {
  const config = useRuntimeConfig();
  const raw =
    config.WHAPI_ALLOW_CREATE_CHANNEL ||
    process.env.WHAPI_ALLOW_CREATE_CHANNEL ||
    "";
  if (raw === undefined || raw === null || raw === "") return true;
  const normalized = String(raw).trim().toLowerCase();
  if (["false", "0", "no", "off"].includes(normalized)) return false;
  return true;
};


const findLeadByPhone = async (phoneDigits, orgId = null) => {
  if (!phoneDigits) return null;
  const last6 = phoneDigits.slice(-6);
  const where = {
    telephone: { [Op.ne]: null, [Op.like]: `%${last6}%` },
  };
  if (orgId) where.organisationId = Number(orgId);
  const candidates = await CrmLead.findAll({
    where,
    limit: 25,
  });
  for (const lead of candidates) {
    const leadDigits = normalizeWhatsAppNumber(lead.telephone);
    if (!leadDigits) continue;
    if (leadDigits === phoneDigits) return lead;
    if (leadDigits.endsWith(phoneDigits) || phoneDigits.endsWith(leadDigits)) return lead;
  }
  return null;
};

const updateLeadWhatsAppMeta = async (lead, updates = {}) => {
  const raw = lead.rawData || {};
  const existing = raw.whatsapp || {};
  lead.rawData = {
    ...raw,
    whatsapp: {
      ...existing,
      ...updates,
    },
  };
  if (!lead.telephone && updates.lastInboundFrom) {
    lead.telephone = updates.lastInboundFrom;
  }
  await lead.save();
};

const collectMessages = (body) => {
  const out = [];
  if (!body || typeof body !== "object") return out;
  if (Array.isArray(body.messages)) out.push(...body.messages);
  if (body.message) out.push(body.message);
  if (Array.isArray(body.data?.messages)) out.push(...body.data.messages);
  if (Array.isArray(body.events)) {
    body.events.forEach((evt) => {
      if (evt?.message) out.push(evt.message);
      if (evt?.data?.message) out.push(evt.data.message);
    });
  }
  return out.filter(Boolean);
};

const getMessageContent = (msg) => {
  if (!msg || typeof msg !== "object") return "";
  const type = String(msg?.type || "").toLowerCase();

  // Plain text / caption (top-level or nested under the media type object)
  // Whapi stores captions at msg.image.caption, msg.video.caption, msg.document.caption, etc.
  const mediaCaption = ["image", "video", "document", "audio", "sticker"].includes(type)
    ? (msg?.[type]?.caption || null)
    : null;
  const textBody = msg?.text?.body || msg?.text || msg?.body || msg?.caption || mediaCaption || msg?.data?.text || msg?.message?.body || msg?.message || msg?.content || "";
  if (typeof textBody === "string" && textBody) return textBody;

  // Action (reaction, vote, label change, etc.)
  if (type === "action" || msg?.action) {
    const action = msg?.action || {};
    const actionType = String(action?.type || "").toLowerCase();
    if (actionType === "reaction" && action?.emoji) return `Reacted ${action.emoji}`;
    if (actionType === "edit") return "";  // handled separately in webhook; never log "edit" as content
    if (actionType === "vote") return "Voted on a poll";
    if (actionType === "label_change") return "Changed a label";
    if (actionType === "media_notify") return "Shared media";
    if (actionType) return `${actionType}`;
    return "";
  }

  // Location
  if (type === "location" && msg?.location) {
    const loc = msg.location;
    const caption = loc?.caption || loc?.name || "";
    const coords = (loc?.latitude && loc?.longitude) ? `${loc.latitude}, ${loc.longitude}` : "";
    return caption || (coords ? `📍 ${coords}` : "📍 Location");
  }
  if (type === "live_location" && msg?.live_location) {
    return msg.live_location?.caption || "📍 Live Location";
  }

  // Contact
  if (type === "contact" && msg?.contact) {
    return msg.contact?.name || "👤 Contact";
  }
  if (type === "contact_list" && msg?.contact_list) {
    const names = (msg.contact_list?.list || []).map((c) => c?.name).filter(Boolean);
    return names.length ? `👤 ${names.join(", ")}` : "👤 Contacts";
  }

  // Poll
  if (type === "poll" && msg?.poll) {
    return msg.poll?.title ? `📊 ${msg.poll.title}` : "📊 Poll";
  }

  // Revoked / deleted
  if (type === "revoked") return "🚫 This message was deleted";

  // System / encryption notices
  if (type === "e2e_notification") return "🔒 Messages are end-to-end encrypted";
  if (type === "system") return msg?.body || msg?.text || "System message";

  // Link preview
  if (type === "link_preview" && msg?.link_preview) {
    return msg.link_preview?.body || msg.link_preview?.url || "🔗 Link";
  }

  // Group invite
  if (type === "group_invite" && msg?.group_invite) {
    return msg.group_invite?.title ? `👥 Group invite: ${msg.group_invite.title}` : "👥 Group invite";
  }

  // Product / Catalog / Order
  if (type === "product") return "🛍️ Product";
  if (type === "catalog" && msg?.catalog) {
    return msg.catalog?.title ? `📦 ${msg.catalog.title}` : "📦 Catalog";
  }
  if (type === "order" && msg?.order) {
    return msg.order?.title ? `🧾 Order: ${msg.order.title}` : "🧾 Order";
  }

  // Reply (button/list response)
  if (type === "reply" && msg?.reply) {
    return msg.reply?.buttons_reply?.title || msg.reply?.list_reply?.title || "↩️ Reply";
  }

  // Carousel
  if (type === "carousel" && msg?.carousel) {
    return msg.carousel?.text || "🎠 Carousel";
  }

  // Album
  if (type === "album") return "🖼️ Album";

  // Admin / newsletter invite
  if (type === "admin_invite" && msg?.admin_invite) {
    return msg.admin_invite?.newsletter_name ? `📢 ${msg.admin_invite.newsletter_name}` : "📢 Newsletter invite";
  }

  // HSM (template)
  if (type === "hsm") return "📋 Template message";

  return "";
};

const inferExtension = (mimeType = "") => {
  const lower = String(mimeType || "").toLowerCase();
  if (lower.includes("jpeg")) return ".jpg";
  if (lower.includes("png")) return ".png";
  if (lower.includes("gif")) return ".gif";
  if (lower.includes("mp4")) return ".mp4";
  if (lower.includes("mpeg")) return ".mpeg";
  if (lower.includes("mp3")) return ".mp3";
  if (lower.includes("pdf")) return ".pdf";
  return "";
};

const buildAttachmentFilename = ({ originalName, mimeType }) => {
  const base = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  if (originalName && originalName.includes(".")) return originalName;
  const ext = inferExtension(mimeType);
  return `${base}${ext}`;
};

const downloadWhapiMediaToS3 = ({ url, token, mimeType, filename }) =>
  downloadUrlToS3({
    url,
    filename: buildAttachmentFilename({ originalName: filename, mimeType }),
    contentType: mimeType || undefined,
    baseDir: 'chat-attachments',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

const fetchWhapiMediaById = async ({ mediaId, token }) => {
  if (!mediaId || !token) return null;
  const env = getWhapiEnvConfig();
  const base = String(env.baseUrl || "").replace(/\/+$/, "");
  try {
    const data = await $fetch(`${base}/media/${encodeURIComponent(String(mediaId))}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      responseType: "arrayBuffer",
    });
    return data ? Buffer.from(data) : null;
  } catch {
    return null;
  }
};

const extractWhapiAttachments = async ({ msg, token }) => {
  const mediaKeyMap = [
    { key: "image", defaultType: "image" },
    { key: "video", defaultType: "video" },
    { key: "audio", defaultType: "audio" },
    { key: "voice", defaultType: "audio" },
    { key: "document", defaultType: "document" },
    { key: "media", defaultType: null },
    { key: "file", defaultType: "document" },
    { key: "attachment", defaultType: "document" },
  ];

  for (const { key, defaultType } of mediaKeyMap) {
    const item = msg?.[key];
    if (!item || typeof item !== "object") continue;

    const mimeType = item?.mime_type || item?.mimeType || item?.mimetype || null;
    const name = item?.filename || item?.file_name || item?.name || null;
    const type =
      defaultType ||
      item?.type ||
      (mimeType?.startsWith("image/") ? "image" :
        mimeType?.startsWith("video/") ? "video" :
          mimeType?.startsWith("audio/") ? "audio" : "document");

    // Prefer direct link (Auto Download enabled)
    const directUrl =
      item?.link ||
      item?.url ||
      item?.file ||
      item?.mediaUrl ||
      item?.media_url ||
      item?.payload?.url ||
      null;

    if (directUrl) {
      const s3Url = await downloadWhapiMediaToS3({ url: directUrl, token, mimeType, filename: name });
      if (s3Url) return [{ url: s3Url, type, mimeType: mimeType || null, name: name || null }];
      continue;
    }

    // Fallback: fetch by media ID (Auto Download disabled)
    const mediaId = item?.id || null;
    if (mediaId && token) {
      const buf = await fetchWhapiMediaById({ mediaId, token });
      if (buf) {
        const filename = buildAttachmentFilename({ originalName: name, mimeType });
        const s3Url = await uploadBufferFile({
          data: buf,
          filename,
          contentType: mimeType || undefined,
          baseDir: "chat-attachments",
        });
        if (s3Url) return [{ url: s3Url, type, mimeType: mimeType || null, name: name || null }];
      }
    }
  }

  return null;
};

const resolveWebhookUrl = () => {
  const config = useRuntimeConfig();
  const explicit =
    config.WHAPI_WEBHOOK_URL ||
    process.env.WHAPI_WEBHOOK_URL ||
    config.public?.WHAPI_WEBHOOK_URL ||
    "";
  if (explicit) return String(explicit).trim();
  const base = config.public?.BASE_URL || config.BASE_URL || process.env.BASE_URL || "";
  return base ? `${String(base).replace(/\/+$/, "")}/api/whapi/webhook` : "";
};

const syncWhapiConfig = async () => {};

const findOrgChannel = async (orgId) => {
  await syncWhapiConfig();
  return await WhapiChannelConfig.findOne({
    where: { organisationId: Number(orgId) },
    order: [["updatedAt", "DESC"]],
  });
};

const findChannelRows = async (channelId) => {
  await syncWhapiConfig();
  if (!channelId) return [];
  return await WhapiChannelConfig.findAll({
    where: { channelId: String(channelId) },
    order: [["updatedAt", "DESC"]],
  });
};

const pickLatestChannel = (rows = []) => {
  if (!rows.length) return null;
  return rows[0];
};

const updateChannelRows = async (rows = [], updates = {}) => {
  if (!rows.length) return;
  await Promise.all(
    rows.map((row) => {
      Object.entries(updates || {}).forEach(([key, value]) => {
        row[key] = value;
      });
      return row.save();
    })
  );
};

const isWhapiConnected = (status, phoneNumber, displayName) => {
  const raw = String(status || "").trim().toLowerCase();
  const hasIdentity = !!(phoneNumber || displayName);
  if (!hasIdentity) return false;
  if (!raw) return false;
  if (raw.includes("loggedout") || raw.includes("disconnected")) return false;
  if (raw.includes("stopped") || raw.includes("overdue")) return false;
  if (raw.includes("pending") || raw.includes("created")) return false;
  return (
    raw.includes("active") ||
    raw.includes("live") ||
    raw.includes("trial") ||
    raw.includes("launched") ||
    raw.includes("auth") ||
    raw.includes("authorized")
  );
};

const isWhapiActivationBlocked = (status) => {
  const raw = String(status || "").trim().toLowerCase();
  if (!raw) return true;
  // Explicitly ready states — channel API is reachable, QR may be available
  if (raw === "qr" || raw.includes("awaiting") || raw.includes("activating")) return false;
  // Blocked states — channel API will hang or error
  if (raw.includes("stopped") || raw.includes("overdue")) return true;
  if (raw.includes("pending") || raw.includes("created")) return true;
  return false;
};

const resolveMessageAttachmentType = (item = {}) => {
  const mime = String(item?.mimeType || item?.contentType || "").toLowerCase();
  if (item?.type) return String(item.type).toLowerCase();
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "document";
};

export const sendMessage = async (event) => {
  try {
    const { orgId, userId } = event.context.user || {};
    if (!orgId) return error(401, "Unauthenticated");

    const raw = await readBody(event);
    const body = typeof raw === "string" ? parseJsonBody(raw) : raw || {};
    const phone = String(body.phone || body.to || "").trim();
    const messageText = String(body.message || "").trim();
    const attachments = Array.isArray(body.attachments) ? body.attachments : [];

    if (!phone) return error(400, "phone is required");
    if (!messageText && !attachments.length) return error(400, "message or attachments required");

    const normalizedPhone = normalizeWhatsAppNumber(phone);
    if (!normalizedPhone) return error(400, "Invalid phone number");

    const whapiConfig = await resolveWhapiConfig(orgId);
    if (!whapiConfig?.token) return error(400, "Whapi channel not configured or token missing");

    const limitStatus = await isWhatsAppLimitExceeded(orgId, userId);
    if (limitStatus.exceeded) {
      return error(402, `WhatsApp monthly limit reached (${limitStatus.count}/${limitStatus.limit})`);
    }

    const whapiBase = String(whapiConfig.baseUrl || "").replace(/\/+$/, "");
    const headers = {
      Authorization: `Bearer ${whapiConfig.token}`,
      "Content-Type": "application/json",
    };

    let sent = 0;
    const failures = [];

    if (messageText) {
      const resp = await $fetch(`${whapiBase}/messages/text`, {
        method: "POST",
        headers,
        body: {
          to: normalizedPhone,
          body: messageText,
        },
      });
      const providerMessageId = resp?.message?.id || resp?.id || null;
      await logWhatsAppMessage({
        organisationId: orgId,
        to: normalizedPhone,
        direction: "outbound",
        type: "text",
        status: "sent",
        providerMessageId,
        content: messageText,
      });
      sent += 1;
    }

    if (attachments.length) {
      for (let idx = 0; idx < attachments.length; idx += 1) {
        const att = attachments[idx] || {};
        const type = resolveMessageAttachmentType(att);
        const endpoint = type === "image" ? "image" : type === "video" ? "video" : type === "audio" ? "audio" : "document";
        const media = String(att.url || att.link || att.path || "").trim();
        if (!media) continue;

        try {
          const resp = await $fetch(`${whapiBase}/messages/${endpoint}`, {
            method: "POST",
            headers,
            body: {
              to: normalizedPhone,
              media,
              ...(endpoint === "document" && att.name ? { filename: att.name } : {}),
            },
          });

          const providerMessageId = resp?.message?.id || resp?.id || null;
          await logWhatsAppMessage({
            organisationId: orgId,
            to: normalizedPhone,
            direction: "outbound",
            type,
            status: "sent",
            providerMessageId,
            content: att.name || `Attachment ${idx + 1}`,
            attachments: [{ ...att }],
          });
          sent += 1;
        } catch (sendErr) {
          failures.push({ attachment: att.name || att.url || `#${idx + 1}`, error: sendErr?.message || "Failed to send attachment" });
        }
      }
    }

    await DiaryPatientCommunicationLogs.create({
      organisationId: Number(orgId),
      patientId: body.patientId ? Number(body.patientId) : null,
      practitionerId: userId,
      type: "WhatsApp",
      subject: `WhatsApp message${messageText ? ": " + messageText.slice(0, 40) : ""}`,
      content: messageText || `Sent ${attachments.length} attachment(s)`,
      status: failures.length > 0 ? "Pending" : "Sent",
      sentAt: new Date(),
      metadata: {
        recipientPhone: normalizedPhone,
        attachments: attachments.map((item) => ({ ...item })),
        failedAttachments: failures.length ? failures : undefined,
      },
    });

    if (failures.length) {
      return error(500, failures.map((item) => item.error).join(", "));
    }

    return success({ sent, failures });
  } catch (e) {
    return error(500, e.message || "Failed to send WhatsApp message");
  }
};

const createPartnerChannel = async ({ name, webhookUrl }) => {
  const partner = getWhapiPartnerConfig();
  if (!partner.partnerToken || !partner.projectId) {
    throw new Error("Whapi partner token or project id is missing");
  }
  const base = String(partner.managerBaseUrl || "").replace(/\/+$/, "");
  const url = `${base}/channels`;
  const payload = {
    name: name || "Flossly Org",
    webhook_url: webhookUrl || null,
    projectId: partner.projectId,
  };
  const resp = await $fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${partner.partnerToken}`,
      "Content-Type": "application/json",
      "Project-Id": partner.projectId,
    },
    body: payload,
  });
  return {
    channelId: resp?.id || resp?.channel_id || resp?.channelId || null,
    token: resp?.token || resp?.api_token || resp?.apiToken || null,
    raw: resp,
  };
};

const resolveWhapiExtendDays = () => {
  const config = useRuntimeConfig();
  const raw =
    config.WHAPI_EXTEND_DAYS ||
    process.env.WHAPI_EXTEND_DAYS ||
    "";
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return 1;
  return Math.floor(parsed);
};

const setPartnerChannelMode = async (channelId, mode) => {
  const partner = getWhapiPartnerConfig();
  if (!partner.partnerToken || !partner.projectId) {
    throw new Error("Whapi partner token or project id is missing");
  }
  if (!channelId) {
    throw new Error("Whapi channel id is missing");
  }
  const base = String(partner.managerBaseUrl || "").replace(/\/+$/, "");
  const url = `${base}/channels/${encodeURIComponent(String(channelId))}/mode`;
  try {
    return await $fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${partner.partnerToken}`,
        "Content-Type": "application/json",
        "Project-Id": partner.projectId,
      },
      body: { mode: mode || partner.channelMode || "trial" },
    });
  } catch {
    return null;
  }
};

const extendPartnerChannel = async (channelId, days, comment) => {
  const partner = getWhapiPartnerConfig();
  if (!partner.partnerToken || !partner.projectId) {
    throw new Error("Whapi partner token or project id is missing");
  }
  if (!channelId) {
    throw new Error("Whapi channel id is missing");
  }
  const base = String(partner.managerBaseUrl || "").replace(/\/+$/, "");
  const url = `${base}/channels/${encodeURIComponent(String(channelId))}/extend`;
  try {
    return await $fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${partner.partnerToken}`,
        "Content-Type": "application/json",
        "Project-Id": partner.projectId,
      },
      body: {
        days: Number(days || 1),
        comment: String(comment || "Auto extend"),
      },
    });
  } catch {
    return null;
  }
};

const fetchQrBase64 = async (token) => {
  if (!token) return null;
  const env = getWhapiEnvConfig();
  const base = String(env.baseUrl || "").replace(/\/+$/, "");
  try {
    const resp = await $fetch(`${base}/users/login`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const b64 = resp?.qr_code?.base64 || resp?.qr_base64 || resp?.base64 || null;
    if (!b64) return null;
    return b64.startsWith("data:") ? b64 : `data:image/png;base64,${b64}`;
  } catch (err) {
    if (err?.statusCode === 404) return null;
    return null;
  }
};

const fetchQrWithRetry = async (token, attempts = 3, delayMs = 1500) => {
  let last = null;
  for (let i = 0; i < attempts; i += 1) {
    last = await fetchQrBase64(token);
    if (last) return last;
    if (i < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return last;
};

const updateWebhook = async (token, webhookUrl) => {
  if (!token || !webhookUrl) return null;
  const env = getWhapiEnvConfig();
  const base = String(env.baseUrl || "").replace(/\/+$/, "");
  const payload = {
    webhooks: [
      {
        url: webhookUrl,
        mode: "body",
        events: [
          { type: "messages", method: "post" },
          { type: "messages", method: "patch" },
          { type: "statuses", method: "post" },
          { type: "users", method: "post" },
          { type: "channel", method: "post" },
        ],
      },
    ],
  };
  try {
    return await $fetch(`${base}/settings`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: payload,
    });
  } catch {
    return null;
  }
};

const logoutChannel = async (token) => {
  if (!token) return null;
  const env = getWhapiEnvConfig();
  const base = String(env.baseUrl || "").replace(/\/+$/, "");
  try {
    return await $fetch(`${base}/users/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    return null;
  }
};

const deletePartnerChannel = async (channelId) => {
  const partner = getWhapiPartnerConfig();
  if (!partner.partnerToken || !partner.projectId) {
    throw new Error("Whapi partner token or project id is missing");
  }
  if (!channelId) {
    throw new Error("Whapi channel id is missing");
  }
  const base = String(partner.managerBaseUrl || "").replace(/\/+$/, "");
  const url = `${base}/channels/${encodeURIComponent(String(channelId))}`;
  return await $fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${partner.partnerToken}`,
      "Project-Id": partner.projectId,
    },
  });
};

const _partnerStatusCache = new Map();
const PARTNER_CACHE_TTL = 60_000;

const fetchPartnerChannelStatus = async (channelId) => {
  const partner = getWhapiPartnerConfig();
  if (!partner.partnerToken || !partner.projectId) return null;
  if (!channelId) return null;

  const cached = _partnerStatusCache.get(channelId);
  if (cached && Date.now() - cached._ts < PARTNER_CACHE_TTL) {
    const { _ts, ...rest } = cached;
    return rest;
  }

  const base = String(partner.managerBaseUrl || "").replace(/\/+$/, "");
  const url = `${base}/channels/${encodeURIComponent(String(channelId))}`;
  try {
    const resp = await $fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${partner.partnerToken}`,
        "Project-Id": partner.projectId,
      },
    });
    const status =
      resp?.status ||
      resp?.state ||
      resp?.health?.status?.text ||
      resp?.health?.status ||
      null;
    const stopped =
      typeof resp?.stopped === "boolean"
        ? resp.stopped
        : typeof resp?.channel?.stopped === "boolean"
          ? resp.channel.stopped
          : null;
    const result = { status: status ? String(status) : null, stopped, raw: resp };
    _partnerStatusCache.set(channelId, { ...result, _ts: Date.now() });
    return result;
  } catch {
    return null;
  }
};

export const connect = async (event) => {
  await requireFeature(event, 'whatsapp')
  const { orgId, userId } = event.context.user || {};
  if (!orgId || !userId) return error(401, "Unauthenticated");
  if (!(await isPaidWhapiAllowed(userId, orgId))) {
    throw createError({
      statusCode: 403,
      data: {
        code: "FEATURE_NOT_AVAILABLE",
        feature: "whatsapp",
        message: "WhatsApp connection is only available on a paid CRM or Pro subscription.",
      },
    });
  }

  const bodyRaw = await readBody(event);
  let body = bodyRaw;
  if (typeof bodyRaw === "string") {
    try {
      body = JSON.parse(bodyRaw);
    } catch {
      body = {};
    }
  }
  const requestedChannelId = String(body?.channelId || "").trim() || null;
  const forceNew = !!body?.forceNew;

  const existingOrg = await findOrgChannel(orgId);
  if (existingOrg && !requestedChannelId && !forceNew) {
    if (isWhapiActivationBlocked(existingOrg.status)) {
      // Channel is stopped/overdue/pending — calling its API will hang.
      // Extend it via the partner API (manager.whapi.cloud, always reachable)
      // to reactivate it, then let the client poll for the QR once it's live.
      const extendDays = resolveWhapiExtendDays();
      const extendResp = await extendPartnerChannel(existingOrg.channelId, extendDays, "Auto extend on reconnect");
      if (extendResp) {
        existingOrg.status = "Activating";
        await existingOrg.save();
        return success({
          channelId: existingOrg.channelId,
          status: existingOrg.status,
          qr: null,
          qrReady: false,
          canActivate: false,
          activationPending: true,
          extended: true,
          extendedDays: extendDays,
          warning: null,
        });
      }
      // Extend failed — return blocked state so client shows a useful message
      return success({
        channelId: existingOrg.channelId,
        status: existingOrg.status,
        qr: null,
        qrReady: false,
        canActivate: true,
        activationPending: false,
        warning: "Failed to reactivate the WhatsApp connection. Please contact support.",
      });
    }
    const token = decrypt(existingOrg.tokenEnc);
    const webhookUrl = resolveWebhookUrl();
    const webhookResp = await updateWebhook(token, webhookUrl);
    const qr = await fetchQrWithRetry(token);
    if (qr) {
      existingOrg.lastQrAt = new Date();
      await existingOrg.save();
    }
    return success({
      channelId: existingOrg.channelId,
      status: existingOrg.status,
      qr,
      qrReady: Boolean(qr),
      webhookUpdated: !!webhookResp,
      canActivate: isWhapiActivationBlocked(existingOrg.status),
      warning: qr
        ? null
        : "QR not ready. If the channel is Stopped/Overdue, activate it with at least 1 day, wait ~1 minute, then refresh.",
    });
  }

  if (requestedChannelId) {
    const channelRows = await findChannelRows(requestedChannelId);
    const selected = pickLatestChannel(channelRows);
    if (!selected) return error(404, "Whapi channel not found");

    // Ensure the org row points to this channel (create or update)
    const webhookUrl = resolveWebhookUrl();
    let target = existingOrg;
    if (!target) {
      await syncWhapiConfig();
      target = await WhapiChannelConfig.create({
        organisationId: Number(orgId),
        userId: Number(userId),
        channelId: selected.channelId,
        tokenEnc: selected.tokenEnc,
        status: selected.status || "Active",
        displayName: selected.displayName || null,
        phoneNumber: selected.phoneNumber || null,
        connectedAt: selected.connectedAt || null,
        webhookUrl: selected.webhookUrl || webhookUrl || null,
      });
    } else {
      target.channelId = selected.channelId;
      target.tokenEnc = selected.tokenEnc;
      target.status = selected.status || target.status;
      target.displayName = selected.displayName || target.displayName;
      target.phoneNumber = selected.phoneNumber || target.phoneNumber;
      target.webhookUrl = selected.webhookUrl || webhookUrl || target.webhookUrl;
      await target.save();
    }

    // Stopped/overdue channels will hang if we call their API — extend first
    if (isWhapiActivationBlocked(target.status)) {
      const extendDays = resolveWhapiExtendDays();
      const extendResp = await extendPartnerChannel(target.channelId, extendDays, "Auto extend on reconnect");
      if (extendResp) {
        target.status = "Activating";
        await target.save();
        return success({
          channelId: target.channelId,
          status: target.status,
          qr: null,
          qrReady: false,
          canActivate: false,
          activationPending: true,
          extended: true,
          extendedDays: extendDays,
          warning: null,
        });
      }
      return success({
        channelId: target.channelId,
        status: target.status,
        qr: null,
        qrReady: false,
        canActivate: true,
        activationPending: false,
        warning: "Failed to reactivate the WhatsApp connection. Please contact support.",
      });
    }

    const token = decrypt(target.tokenEnc);
    const webhookResp = await updateWebhook(token, webhookUrl);
    const qr = await fetchQrWithRetry(token);

    if (qr) {
      target.lastQrAt = new Date();
      await target.save();
    }

    return success({
      channelId: target.channelId,
      status: target.status,
      qr,
      qrReady: Boolean(qr),
      webhookUpdated: !!webhookResp,
      canActivate: isWhapiActivationBlocked(target.status),
      warning: qr
        ? null
        : "QR not ready. If the channel is Stopped/Overdue, activate it with at least 1 day, wait ~1 minute, then refresh.",
    });
  }

  if (!isWhapiCreateAllowed()) {
    return error(403, "Whapi channel creation is disabled. Contact your administrator.");
  }

  const webhookUrl = resolveWebhookUrl();
  if (!webhookUrl) {
    console.warn("[Whapi] WARNING: No webhook URL configured (WHAPI_WEBHOOK_URL / BASE_URL not set). Incoming messages will not be received.");
  }
  const created = await createPartnerChannel({
    name: `Flossly Org ${orgId}`,
    webhookUrl,
  });
  if (!created.channelId || !created.token) {
    return error(500, "Failed to create Whapi channel");
  }

  const requestedMode = getWhapiPartnerConfig().channelMode || "trial";
  const modeResp = await setPartnerChannelMode(created.channelId, requestedMode);
  const extendDays = resolveWhapiExtendDays();
  const extendComment = "Auto extend";
  const extendResp = await extendPartnerChannel(created.channelId, extendDays, extendComment);

  await syncWhapiConfig();
  const row = existingOrg
    ? Object.assign(existingOrg, {
        channelId: created.channelId,
        tokenEnc: encrypt(created.token),
        status: "Pending",
        connectedAt: null,
        webhookUrl: webhookUrl || null,
      })
    : await WhapiChannelConfig.create({
        organisationId: Number(orgId),
        userId: Number(userId),
        channelId: created.channelId,
        tokenEnc: encrypt(created.token),
        status: "Pending",
        connectedAt: null,
        webhookUrl: webhookUrl || null,
      });
  if (existingOrg) await row.save();

  // New channels take up to 90 seconds to fully initialize (Whapi docs).
  // Attempting updateWebhook or fetchQr immediately will always fail on an
  // unactivated channel — skip both and let the client poll for the QR instead.
  row.status = "Activating";
  await row.save();

  return success({
    channelId: row.channelId,
    status: row.status,
    qr: null,
    qrReady: false,
    canActivate: false,
    activationPending: true,
    warning: null,
    mode: requestedMode,
    modeUpdated: !!modeResp,
    webhookUpdated: false,
    extended: !!extendResp,
    extendedDays: extendDays,
  });
};

export const extendChannel = async (event) => {
  const { orgId } = event.context.user || {};
  if (!orgId) return error(401, "Unauthenticated");
  const existing = await findOrgChannel(orgId);
  if (!existing) return error(404, "Whapi channel not connected");
  const body = await readBody(event);
  const partner = getWhapiPartnerConfig();
  const days = Number(body?.days || 1);
  const comment = String(body?.comment || "Auto extend");
  const resp = await extendPartnerChannel(existing.channelId, days, comment);
  if (!resp) return error(502, "Failed to extend Whapi channel");
  existing.status = "Activating";
  await updateChannelRows(await findChannelRows(existing.channelId), {
    status: "Activating",
  });
  return success({
    channelId: existing.channelId,
    extended: true,
    days,
    response: resp,
  });
};

export const disconnect = async (event) => {
  const { orgId } = event.context.user || {};
  if (!orgId) return error(401, "Unauthenticated");
  const bodyRaw = await readBody(event);
  let body = bodyRaw;
  if (typeof bodyRaw === "string") {
    try {
      body = JSON.parse(bodyRaw);
    } catch {
      body = {};
    }
  }
  const forceLogout = !!body?.force;
  const existing = await findOrgChannel(orgId);
  if (!existing) return error(404, "Whapi channel not connected");
  const channelRows = await findChannelRows(existing.channelId);
  if (channelRows.length > 1 && !forceLogout) {
    await existing.destroy();
    return success({
      disconnected: true,
      channelId: existing.channelId,
      response: null,
      shared: true,
    });
  }
  const token = decrypt(existing.tokenEnc);
  const resp = await logoutChannel(token);
  const rowsToUpdate = channelRows.length ? channelRows : [existing];
  await updateChannelRows(rowsToUpdate, {
    status: "LoggedOut",
    phoneNumber: null,
    displayName: null,
    connectedAt: null,
    lastSeenAt: new Date(),
  });
  return success({
    disconnected: true,
    channelId: existing.channelId,
    response: resp || null,
    forced: forceLogout,
  });
};

export const deleteChannel = async (event) => {
  const { orgId } = event.context.user || {};
  if (!orgId) return error(401, "Unauthenticated");
  const existing = await findOrgChannel(orgId);
  if (!existing) return error(404, "Whapi channel not connected");

  const channelRows = await findChannelRows(existing.channelId);
  if (channelRows.length > 1) {
    await existing.destroy();
    return success({
      deleted: true,
      channelId: existing.channelId,
      response: null,
      shared: true,
    });
  }
  const resp = await deletePartnerChannel(existing.channelId);
  await existing.destroy();
  return success({
    deleted: true,
    channelId: existing.channelId,
    response: resp || null,
  });
};

export const qr = async (event) => {
  const { orgId } = event.context.user || {};
  if (!orgId) return error(401, "Unauthenticated");
  const existing = await findOrgChannel(orgId);
  if (!existing) return error(404, "Whapi channel not connected");
  const token = decrypt(existing.tokenEnc);
  // For channels still in the activation window, attempt webhook setup on every poll.
  // This is a no-op if the channel is not ready yet (it will just fail silently),
  // but once the channel IS ready, it ensures SSE events start flowing immediately.
  if (existing.status === "Activating") {
    const webhookUrl = resolveWebhookUrl();
    if (webhookUrl) {
      await updateWebhook(token, webhookUrl);
    }
  }
  const qrData = await fetchQrWithRetry(token);
  if (qrData) {
    existing.lastQrAt = new Date();
    if (existing.status === "Activating") {
      existing.status = "qr";
    }
    await existing.save();
  }
  return success({
    channelId: existing.channelId,
    qr: qrData,
    qrReady: Boolean(qrData),
    warning: qrData
      ? null
      : "QR not ready. If the channel is Stopped/Overdue, activate it with at least 1 day, wait ~1 minute, then refresh.",
  });
};

export const status = async (event) => {
  const { orgId } = event.context.user || {};
  if (!orgId) return error(401, "Unauthenticated");
  const existing = await findOrgChannel(orgId);
  if (!existing) return success({ connected: false });
  const channelRows = await findChannelRows(existing.channelId);
  if (existing.channelId) {
    const live = await fetchPartnerChannelStatus(existing.channelId);
    if (live?.status || typeof live?.stopped === "boolean") {
      const resolvedStatus =
        live?.stopped === true ? "Stopped" : live?.status || existing.status;
      await updateChannelRows(channelRows.length ? channelRows : [existing], {
        status: resolvedStatus,
        lastSeenAt: new Date(),
      });
      existing.status = resolvedStatus;
    }
  }
  const connected = isWhapiConnected(existing.status, existing.phoneNumber, existing.displayName);
  return success({
    connected,
    channelId: existing.channelId,
    status: existing.status,
    phoneNumber: existing.phoneNumber || null,
    displayName: existing.displayName || null,
    connectedAt: existing.connectedAt || null,
    canActivate: isWhapiActivationBlocked(existing.status),
  });
};

export const listChannels = async (event) => {
  const { orgId, userId } = event.context.user || {};
  if (!orgId || !userId) return error(401, "Unauthenticated");
  await syncWhapiConfig();

  const memberships = await UserOrganisation.findAll({
    where: { userId: Number(userId), status: "Active" },
    include: [{ model: Organisation, as: "organisation", attributes: ["id", "name"] }],
  });
  const orgIds = memberships.map((row) => Number(row.organisationId)).filter(Boolean);
  if (!orgIds.length) return success({ channels: [] });

  const orgNameById = new Map(
    memberships
      .map((row) => [Number(row.organisationId), row.organisation?.name || null])
      .filter((entry) => entry[0])
  );

  const rows = await WhapiChannelConfig.findAll({
    where: { organisationId: { [Op.in]: orgIds } },
    order: [["updatedAt", "DESC"]],
  });

  const map = new Map();
  rows.forEach((row) => {
    if (!map.has(row.channelId)) {
      map.set(row.channelId, {
        channelId: row.channelId,
        status: row.status || null,
        phoneNumber: row.phoneNumber || null,
        displayName: row.displayName || null,
        connected: isWhapiConnected(row.status, row.phoneNumber, row.displayName),
        orgCount: 0,
        linked: false,
        orgNames: new Set(),
      });
    }
    const item = map.get(row.channelId);
    item.orgCount += 1;
    const orgName = orgNameById.get(Number(row.organisationId));
    if (orgName) item.orgNames.add(orgName);
    if (row.organisationId === Number(orgId)) item.linked = true;
  });

  const channels = Array.from(map.values()).map((item) => ({
    ...item,
    orgNames: Array.from(item.orgNames || []),
  }));

  return success({ channels });
};

const sendWhatsAppAutoReply = async ({ orgId, lead, content, token, channelId }) => {
  try {
    const org = await Organisation.findOne({
      where: { id: orgId },
      attributes: ['name', 'type', 'whatsappAutoReplyEnabled'],
    });

    if (!org || !org.whatsappAutoReplyEnabled) return;
    if (lead.autoReplyEnabled !== true) return;
    if (lead.autoReplyDisabledUntil && new Date() < new Date(lead.autoReplyDisabledUntil)) return;
    if (lead.autoReplyDisabledUntil && new Date() >= new Date(lead.autoReplyDisabledUntil)) {
      lead.autoReplyEnabled = true;
      lead.autoReplyDisabledUntil = null;
      await lead.save();
    }

    const treatments = await OrganisationTreatment.findAll({
      where: { organisationId: orgId, active: true },
      attributes: ['name', 'category'],
      limit: 20,
    });

    const recentMessages = await CrmWhatsAppMessageLog.findAll({
      where: { organisationId: orgId, leadId: lead.id },
      order: [['createdAt', 'DESC']],
      limit: 10,
    });

    const conversationHistory = recentMessages
      .slice()
      .reverse()
      .filter(m => m.direction === 'inbound' || m.direction === 'outbound')
      .map(m => ({
        role: m.direction === 'inbound' ? 'user' : 'assistant',
        content: m.content,
      }));

    console.log(`[WhatsApp AutoReply] Conversation history: ${conversationHistory.length} messages for org ${orgId}, lead ${lead.id}`);

    const { reply: replyText } = await generateAutoReply({
      organisationName: org.name,
      organisationType: org.type,
      message: content,
      history: conversationHistory,
    });

    if (!replyText) return;

    const whapiConfig = await resolveWhapiConfig(orgId);
    if (!whapiConfig?.token) {
      console.warn(`[WhatsApp AutoReply] No whapi config for org ${orgId}`);
      return;
    }

    const limitStatus = await isWhatsAppLimitExceeded(orgId);
    if (limitStatus.exceeded) {
      console.warn(`[WhatsApp AutoReply] Limit exceeded for org ${orgId} (${limitStatus.count}/${limitStatus.limit})`);
      return;
    }

    const whapiBase = String(whapiConfig.baseUrl || 'https://gate.whapi.cloud').replace(/\/+$/, '');
    const headers = { Authorization: `Bearer ${whapiConfig.token}`, 'Content-Type': 'application/json' };
    const to = normalizeWhatsAppNumber(lead.telephone);

    const resp = await $fetch(`${whapiBase}/messages/text`, {
      method: 'POST',
      headers,
      body: { to, body: replyText },
    });

    const providerMessageId = resp?.message?.id || resp?.id || null;

    await logWhatsAppMessage({
      organisationId: orgId,
      leadId: lead.id,
      to,
      direction: 'outbound',
      type: 'text',
      status: 'sent',
      providerMessageId,
      content: replyText,
      attachments: null,
    });

    broadcastWhapiEvent("message", { orgId, leadId: lead.id });

    console.log(`[WhatsApp AutoReply] Sent auto-reply for org ${orgId}: ${replyText.slice(0, 50)}...`);
  } catch (err) {
    console.error(`[WhatsApp AutoReply] Failed for org ${orgId}:`, err?.message || err);
  }
};

export const webhook = async (event) => {
  if (getMethod(event) === "HEAD") return send(event, "ok");
  if (getMethod(event) === "GET") return send(event, "ok");

  if (getMethod(event) === "POST") {
    const body = await readBody(event);
    const channelId =
      body?.channel_id ||
      body?.channelId ||
      body?.channel?.id ||
      body?.channel?.channelId ||
      body?.metadata?.channel_id ||
      null;
    let channelRows = [];
    if (channelId) {
      channelRows = await findChannelRows(String(channelId));
      if (channelRows.length) {
        const channelInfo = body?.channel || body?.data?.channel || body?.user || body?.data?.user || null;
        const healthStatus = body?.health?.status?.text || null;
        const updates = {};
        if (channelInfo) {
          updates.displayName = channelInfo?.name || channelInfo?.pushname || null;
          const phone = channelInfo?.phone || channelInfo?.phone_number || channelInfo?.phoneNumber || null;
          const userId = channelInfo?.id || null;
          if (phone) updates.phoneNumber = String(phone);
          else if (userId) updates.phoneNumber = String(userId);
          updates.status = channelInfo?.status || null;
        }
        if (healthStatus) updates.status = String(healthStatus);
        if (!updates.status) updates.status = channelRows[0]?.status || "Active";
        const connected = isWhapiConnected(
          updates.status || channelRows[0].status,
          updates.phoneNumber || channelRows[0].phoneNumber,
          updates.displayName || channelRows[0].displayName
        );
        if (connected) updates.connectedAt = new Date();
        updates.lastSeenAt = new Date();
        await updateChannelRows(channelRows, updates);
        for (const cfg of channelRows) {
          broadcastWhapiEvent("status", {
            orgId: cfg.organisationId,
            channelId: String(channelId),
            status: updates.status,
            connected,
            phoneNumber: updates.phoneNumber || cfg.phoneNumber || null,
            displayName: updates.displayName || cfg.displayName || null,
          });
        }
      }
    }
    // ── Handle message edits (messages_updates, event.event === "patch") ──
    // Whapi sends edits in a separate messages_updates array, not in messages.
    // Structure: { id, after_update: { text: { body: "new text" } }, trigger: { type: "edit" } }
    if (Array.isArray(body?.messages_updates)) {
      for (const update of body.messages_updates) {
        if (String(update?.trigger?.type || "").toLowerCase() !== "edit") continue;
        const msgId = update?.id || update?.after_update?.id;
        const newText = update?.after_update?.text?.body || update?.after_update?.caption || "";
        if (!msgId || !newText) continue;

        // Find the org for this update via channel_id
        if (!channelRows.length) continue;
        for (const cfg of channelRows) {
          const logRow = await CrmWhatsAppMessageLog.findOne({
            where: { providerMessageId: String(msgId), organisationId: cfg.organisationId },
            attributes: ["id", "leadId"],
          });
          if (!logRow) continue;
          await logRow.update({ content: newText });
          broadcastWhapiEvent("message", { orgId: cfg.organisationId, leadId: logRow.leadId });
        }
      }
    }

    const messages = collectMessages(body);

    for (const msg of messages) {
      const fromRaw =
        msg?.from ||
        msg?.author ||
        msg?.sender?.id ||
        msg?.sender?.phone ||
        msg?.chatId ||
        msg?.chat_id ||
        msg?.chat?.id ||
        msg?.chat?.chatId;
      const fromDigits = normalizeWhatsAppNumber(fromRaw);
      if (!fromDigits) continue;
      let lead = null;
      let orgId = null;
      if (channelRows.length) {
        const matches = [];
        for (const cfg of channelRows) {
          const found = await findLeadByPhone(fromDigits, cfg.organisationId);
          if (found) matches.push({ cfg, lead: found });
        }
        if (matches.length === 1) {
          lead = matches[0].lead;
          orgId = matches[0].cfg.organisationId;
        } else if (matches.length > 1) {
          matches.sort((a, b) => {
            const aMeta = a.lead?.rawData?.whatsapp || {};
            const bMeta = b.lead?.rawData?.whatsapp || {};
            const aTime = new Date(aMeta.lastInboundAt || aMeta.lastOutboundAt || 0).getTime();
            const bTime = new Date(bMeta.lastInboundAt || bMeta.lastOutboundAt || 0).getTime();
            if (aTime !== bTime) return bTime - aTime;
            return new Date(b.cfg.updatedAt || 0).getTime() - new Date(a.cfg.updatedAt || 0).getTime();
          });
          lead = matches[0].lead;
          orgId = matches[0].cfg.organisationId;
        }
      }
      if (!lead || !orgId) continue;
      const msgType =
        msg?.type ||
        msg?.message_type ||
        msg?.messageType ||
        (msg?.text ? "text" : null) ||
        "text";
      const normalizedMsgType = String(msgType).toLowerCase();

      // ── Revoked message: update existing row, never create a new inbound ghost ──
      if (normalizedMsgType === "revoked") {
        const revokedId = msg?.id || msg?.message_id || msg?.messageId;
        if (revokedId) {
          await CrmWhatsAppMessageLog.update(
            { type: "revoked", content: "🚫 This message was deleted" },
            { where: { providerMessageId: revokedId, organisationId: orgId } }
          );
        }
        broadcastWhapiEvent("message", { orgId, leadId: lead.id });
        continue;
      }

      // ── Action messages: reactions, revokes, deletes — never create a new log row ──
      if (normalizedMsgType === "action") {
        const actionType = String(msg?.action?.type || "").toLowerCase();

        if (actionType === "reaction") {
          const targetId = msg?.action?.message_id || msg?.action?.messageId || msg?.action?.id;
          const emoji = msg?.action?.emoji;
          if (targetId) {
            await CrmWhatsAppMessageLog.update(
              { reaction: emoji || null },
              { where: { providerMessageId: targetId, organisationId: orgId } }
            );
          }
          broadcastWhapiEvent("message", { orgId, leadId: lead.id });
          continue;
        }

        if (["revoke", "delete", "deleted", "revoked"].includes(actionType)) {
          const targetId = msg?.action?.message_id || msg?.action?.messageId || msg?.action?.id || msg?.id;
          if (targetId) {
            await CrmWhatsAppMessageLog.update(
              { type: "revoked", content: "🚫 This message was deleted" },
              { where: { providerMessageId: targetId, organisationId: orgId } }
            );
          }
          broadcastWhapiEvent("message", { orgId, leadId: lead.id });
          continue;
        }

        // All other action types — skip silently, never create a ghost inbound row
        continue;
      }

      // ── Edit action: update the original message with the new text ──
      if (
        normalizedMsgType === "action" &&
        String(msg?.action?.type || "").toLowerCase() === "edit"
      ) {
        const targetId = msg?.action?.message_id || msg?.action?.messageId || msg?.action?.id;
        const newText = msg?.action?.body || msg?.action?.text || msg?.action?.content || "";
        if (targetId && newText) {
          await CrmWhatsAppMessageLog.update(
            { content: newText },
            { where: { providerMessageId: targetId, organisationId: orgId } }
          );
        }
        broadcastWhapiEvent("message", { orgId, leadId: lead.id });
        continue;
      }

      const token = channelRows?.[0]?.tokenEnc ? decrypt(channelRows[0].tokenEnc) : null;
      const attachments = await extractWhapiAttachments({ msg, token });
      const providerId = msg?.id || msg?.message_id || msg?.messageId || null;
      const content = getMessageContent(msg);

      // ── Same-ID update: update existing row instead of creating a duplicate ──
      if (providerId) {
        const existing = await CrmWhatsAppMessageLog.findOne({
          where: { providerMessageId: providerId, organisationId: orgId },
        });
        if (existing) {
          await existing.update({
            content,
            ...(attachments ? { attachments } : {}),
          });
          broadcastWhapiEvent("message", { orgId, leadId: lead.id });
          continue;
        }
      }

      await updateLeadWhatsAppMeta(lead, {
        lastInboundAt: new Date(extractTimestamp(msg?.timestamp || msg?.time || msg?.sent)).toISOString(),
        lastInboundFrom: fromDigits,
        lastMessageAt: new Date().toISOString(),
      });
      await logWhatsAppMessage({
        organisationId: lead.organisationId,
        leadId: lead.id,
        to: fromDigits,
        direction: "inbound",
        type: String((attachments?.[0]?.type || msgType) || "text"),
        status: "received",
        providerMessageId: providerId,
        content,
        attachments,
      });
      broadcastWhapiEvent("message", { orgId, leadId: lead.id });

      if (content && token) {
        sendWhatsAppAutoReply({
          orgId,
          lead,
          content,
          token,
          channelId: channelRows?.[0]?.channelId || null,
        }).catch((err) => console.error('[WhatsApp AutoReply] Error:', err?.message || err));
      }

      // Push notification to all org members
      try {
        const orgUsers = await UserOrganisation.findAll({
          where: { organisationId: orgId },
          attributes: ["userId"],
        });
        const userIds = orgUsers.map((u) => u.userId).filter(Boolean);
        if (userIds.length) {
          const senderLabel = lead.name || lead.telephone || fromDigits;
          const preview = (content ? String(content).slice(0, 80) : null) || (attachments?.length ? "📎 Media" : "New message");
          await sendNotificationToMultipleUsers({
            userIds,
            organisationId: orgId,
            title: `New WhatsApp message from ${senderLabel}`,
            body: preview,
            type: "whatsapp_message",
            referenceType: "lead",
            referenceId: lead.id,
            data: {
              leadId: String(lead.id),
              leadName: String(senderLabel),
              url: `/crm/leads?leadId=${lead.id}&tab=whatsapp`,
            },
            priority: "high",
          });
        }
      } catch {}
    }

    return success({ received: true });
  }

  return success("ok");
};

// ── Resolve org channel token (shared helper for message actions) ──
const resolveOrgWhapiToken = async (orgId) => {
  const channel = await findOrgChannel(orgId);
  if (!channel?.tokenEnc) return null;
  try {
    return decrypt(channel.tokenEnc);
  } catch {
    return channel.tokenEnc;
  }
};

// ── Edit a sent message (text only, within 15 min) ──
export const editMessage = async (event) => {
  const { orgId } = event.context.user || {};
  if (!orgId) return error(401, "Unauthenticated");

  const body = await readBody(event);
  const { providerMessageId, newText, to } = body || {};
  if (!providerMessageId || !newText || !to) {
    return error(400, "providerMessageId, newText, and to are required");
  }

  // Server-side 15-minute edit window check
  const EDIT_WINDOW_MS = 15 * 60 * 1000;
  const logRow = await CrmWhatsAppMessageLog.findOne({
    where: { providerMessageId, organisationId: orgId },
    attributes: ["createdAt"],
  });
  if (logRow) {
    const age = Date.now() - new Date(logRow.createdAt).getTime();
    if (age > EDIT_WINDOW_MS) {
      return error(400, "Message can no longer be edited (15-minute window has passed)");
    }
  }

  const token = await resolveOrgWhapiToken(orgId);
  if (!token) return error(400, "Whapi not configured for this organisation");

  const env = getWhapiEnvConfig();
  const base = String(env.baseUrl || "").replace(/\/+$/, "");

  try {
    const resp = await $fetch(`${base}/messages/text`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: { to, body: newText, edit: providerMessageId },
    });
    const newMessageId = resp?.message?.id || resp?.id || null;

    // Persist the edited text in the DB so the change survives a page reload.
    // Also update the providerMessageId if Whapi issued a new one for the edit.
    const dbUpdate = { content: newText };
    if (newMessageId && newMessageId !== providerMessageId) {
      dbUpdate.providerMessageId = newMessageId;
    }
    await CrmWhatsAppMessageLog.update(dbUpdate, {
      where: { providerMessageId, organisationId: orgId },
    });

    return success({ messageId: newMessageId });
  } catch (err) {
    return error(500, err?.message || "Failed to edit message");
  }
};

// ── Delete / revoke a sent message ──
export const deleteMessage = async (event) => {
  const { orgId } = event.context.user || {};
  if (!orgId) return error(401, "Unauthenticated");

  const body = await readBody(event);
  const { providerMessageId } = body || {};
  if (!providerMessageId) return error(400, "providerMessageId is required");

  const token = await resolveOrgWhapiToken(orgId);
  if (!token) return error(400, "Whapi not configured for this organisation");

  const env = getWhapiEnvConfig();
  const base = String(env.baseUrl || "").replace(/\/+$/, "");

  try {
    await $fetch(`${base}/messages/${encodeURIComponent(String(providerMessageId))}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    // Persist the revoked state in the DB immediately so that when SSE triggers
    // a reload of logs the message shows as deleted rather than reappearing.
    await CrmWhatsAppMessageLog.update(
      { type: "revoked", content: "🚫 This message was deleted" },
      { where: { providerMessageId, organisationId: orgId } }
    );

    return success({ deleted: true });
  } catch (err) {
    return error(500, err?.message || "Failed to delete message");
  }
};

// ── React to a message with an emoji ──
export const reactToMessage = async (event) => {
  const { orgId } = event.context.user || {};
  if (!orgId) return error(401, "Unauthenticated");

  const body = await readBody(event);
  const { providerMessageId, emoji } = body || {};
  // emoji may be "" to remove a reaction — only providerMessageId is strictly required
  if (!providerMessageId) return error(400, "providerMessageId is required");

  const token = await resolveOrgWhapiToken(orgId);
  if (!token) return error(400, "Whapi not configured for this organisation");

  const env = getWhapiEnvConfig();
  const base = String(env.baseUrl || "").replace(/\/+$/, "");

  try {
    await $fetch(`${base}/messages/${encodeURIComponent(String(providerMessageId))}/reaction`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: { emoji: emoji || "" },
    });

    // Write to DB directly so the reaction is visible on next open without
    // waiting for the Whapi webhook to echo back
    await CrmWhatsAppMessageLog.update(
      { reaction: emoji || null },
      { where: { providerMessageId, organisationId: orgId } }
    );

    return success({ reacted: true });
  } catch (err) {
    return error(500, err?.message || "Failed to react to message");
  }
};

export const stream = async (event) => {
  const { orgId } = event.context.user || {};
  if (!orgId) return error(401, "Unauthenticated");

  const res = event.node.res;
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.write(`event: ready\ndata: "ok"\n\n`);

  const cleanup = addWhapiClient(res, orgId);
  event.node.req.on("close", () => {
    cleanup();
  });

  return new Promise(() => {});
};
