import { Op } from "sequelize";
import { CrmLead, WhapiChannelConfig } from "../models";
import { normalizeWhatsAppNumber, logWhatsAppMessage } from "../utils/whatsapp";
import { success, error } from "../utils/response";
import { encrypt, decrypt } from "../utils/crypto";
import { getWhapiEnvConfig, getWhapiPartnerConfig } from "../utils/whatsappProvider";

const extractTimestamp = (value) => {
  if (!value) return Date.now();
  const raw = Number(value);
  if (Number.isNaN(raw)) return Date.now();
  if (raw < 1e12) return raw * 1000;
  return raw;
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
  const direct =
    msg?.text ||
    msg?.body ||
    msg?.message ||
    msg?.caption ||
    msg?.data?.text ||
    "";
  if (typeof direct === "string") return direct;
  if (typeof msg?.text?.body === "string") return msg.text.body;
  if (typeof msg?.message?.body === "string") return msg.message.body;
  if (typeof msg?.content === "string") return msg.content;
  return "";
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

const syncWhapiConfig = async () => {
  try {
    await WhapiChannelConfig.sync();
  } catch {}
};

const findOrgChannel = async (orgId) => {
  await syncWhapiConfig();
  return await WhapiChannelConfig.findOne({
    where: { organisationId: Number(orgId) },
    order: [["updatedAt", "DESC"]],
  });
};

const isWhapiConnected = (status, phoneNumber) => {
  const raw = String(status || "").trim().toLowerCase();
  if (!phoneNumber) return false;
  if (!raw) return false;
  if (raw.includes("loggedout") || raw.includes("disconnected")) return false;
  if (raw.includes("stopped") || raw.includes("overdue")) return false;
  if (raw.includes("pending") || raw.includes("created")) return false;
  return raw.includes("active") || raw.includes("live") || raw.includes("trial") || raw.includes("launched");
};

const isWhapiActivationBlocked = (status) => {
  const raw = String(status || "").trim().toLowerCase();
  if (!raw) return true;
  if (raw.includes("activating")) return false;
  if (raw.includes("stopped") || raw.includes("overdue")) return true;
  if (raw.includes("pending") || raw.includes("created")) return true;
  return false;
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

const fetchQrWithRetry = async (token, attempts = 2, delayMs = 1200) => {
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

export const connect = async (event) => {
  const { orgId, userId } = event.context.user || {};
  if (!orgId || !userId) return error(401, "Unauthenticated");

  const existing = await findOrgChannel(orgId);
  if (existing) {
    const token = decrypt(existing.tokenEnc);
    const webhookUrl = resolveWebhookUrl();
    const webhookResp = await updateWebhook(token, webhookUrl);
    const qr = await fetchQrWithRetry(token);
    if (qr) {
      existing.lastQrAt = new Date();
      await existing.save();
    }
    return success({
      channelId: existing.channelId,
      status: existing.status,
      qr,
      qrReady: Boolean(qr),
      webhookUpdated: !!webhookResp,
      canActivate: isWhapiActivationBlocked(existing.status),
      warning: qr
        ? null
        : "QR not ready. If the channel is Stopped/Overdue, activate it with at least 1 day, wait ~1 minute, then refresh.",
    });
  }

  const webhookUrl = resolveWebhookUrl();
  const created = await createPartnerChannel({
    name: `Flossly Org ${orgId}`,
    webhookUrl,
  });
  if (!created.channelId || !created.token) {
    return error(500, "Failed to create Whapi channel");
  }

  const requestedMode = getWhapiPartnerConfig().channelMode || "trial";
  const modeResp = await setPartnerChannelMode(created.channelId, requestedMode);
  const extendDays = 1;
  const extendComment = "Auto extend";
  const extendResp = await extendPartnerChannel(created.channelId, extendDays, extendComment);

  await syncWhapiConfig();
  const row = await WhapiChannelConfig.create({
    organisationId: Number(orgId),
    userId: Number(userId),
    channelId: created.channelId,
    tokenEnc: encrypt(created.token),
    status: "Pending",
    connectedAt: null,
    webhookUrl: webhookUrl || null,
  });

  const webhookResp = await updateWebhook(created.token, webhookUrl);
  const qr = await fetchQrWithRetry(created.token);
  if (qr) {
    row.lastQrAt = new Date();
    await row.save();
  }
  if (extendResp && !qr) {
    row.status = "Activating";
    await row.save();
  }

  return success({
    channelId: row.channelId,
    status: row.status,
    qr,
    qrReady: Boolean(qr),
    canActivate: !extendResp,
    activationPending: !!extendResp,
    warning: qr
      ? null
      : "QR not ready. If the channel is Stopped/Overdue, activate it with at least 1 day, wait ~1 minute, then refresh.",
    mode: requestedMode,
    modeUpdated: !!modeResp,
    webhookUpdated: !!webhookResp,
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
  await existing.save();
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
  const existing = await findOrgChannel(orgId);
  if (!existing) return error(404, "Whapi channel not connected");
  const token = decrypt(existing.tokenEnc);
  const resp = await logoutChannel(token);
  existing.status = "LoggedOut";
  existing.phoneNumber = null;
  existing.displayName = null;
  existing.connectedAt = null;
  await existing.save();
  return success({
    disconnected: true,
    channelId: existing.channelId,
    response: resp || null,
  });
};

export const deleteChannel = async (event) => {
  const { orgId } = event.context.user || {};
  if (!orgId) return error(401, "Unauthenticated");
  const existing = await findOrgChannel(orgId);
  if (!existing) return error(404, "Whapi channel not connected");

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
  const qr = await fetchQrWithRetry(token);
  if (qr) {
    existing.lastQrAt = new Date();
    await existing.save();
  }
  return success({
    channelId: existing.channelId,
    qr,
    qrReady: Boolean(qr),
    warning: qr
      ? null
      : "QR not ready. If the channel is Stopped/Overdue, activate it with at least 1 day, wait ~1 minute, then refresh.",
  });
};

export const status = async (event) => {
  const { orgId } = event.context.user || {};
  if (!orgId) return error(401, "Unauthenticated");
  const existing = await findOrgChannel(orgId);
  if (!existing) return success({ connected: false });
  const connected = isWhapiConnected(existing.status, existing.phoneNumber);
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
    let orgId = null;
    if (channelId) {
      await syncWhapiConfig();
      const cfg = await WhapiChannelConfig.findOne({
        where: { channelId: String(channelId) },
      });
      if (cfg) {
        orgId = cfg.organisationId;
        cfg.lastSeenAt = new Date();
        const channelInfo = body?.channel || body?.data?.channel || body?.user || body?.data?.user || null;
        if (channelInfo) {
          cfg.displayName = channelInfo?.name || channelInfo?.pushname || cfg.displayName || null;
          const phone = channelInfo?.phone || channelInfo?.phone_number || channelInfo?.phoneNumber || null;
          const userId = channelInfo?.id || null;
          if (phone) cfg.phoneNumber = String(phone);
          else if (userId) cfg.phoneNumber = String(userId);
          cfg.status = channelInfo?.status || cfg.status;
          if (isWhapiConnected(cfg.status, cfg.phoneNumber) && !cfg.connectedAt) {
            cfg.connectedAt = new Date();
          }
        }
        const healthStatus = body?.health?.status?.text || null;
        if (healthStatus) {
          cfg.status = String(healthStatus);
          if (isWhapiConnected(cfg.status, cfg.phoneNumber) && !cfg.connectedAt) {
            cfg.connectedAt = new Date();
          }
        }
        await cfg.save();
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
      const lead = await findLeadByPhone(fromDigits, orgId);
      if (!lead) continue;
      const content = getMessageContent(msg);
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
        type: "text",
        status: "received",
        providerMessageId: msg?.id || msg?.message_id || msg?.messageId || null,
        content,
      });
    }

    return success({ received: true });
  }

  return success("ok");
};
