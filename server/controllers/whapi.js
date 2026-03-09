import { Op } from "sequelize";
import {
  CrmLead,
  WhapiChannelConfig,
  UserOrganisation,
  Organisation,
  UserPreference,
} from "../models";
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

const isPaidWhapiAllowed = async (userId, orgId) => {
  if (!userId || !orgId) return false;
  const pref = await UserPreference.findOne({
    where: { userId: Number(userId), organisationId: Number(orgId) },
  });
  const license = String(pref?.licenseType || "").trim().toLowerCase();
  if (!license) return false;
  if (license === "trial") return false;
  return ["drift", "glide", "soar", "system"].includes(license);
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
    raw.includes("authorized") ||
    raw.includes("qr")
  );
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

const fetchPartnerChannelStatus = async (channelId) => {
  const partner = getWhapiPartnerConfig();
  if (!partner.partnerToken || !partner.projectId) {
    return null;
  }
  if (!channelId) return null;
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
    return {
      status: status ? String(status) : null,
      stopped,
      raw: resp,
    };
  } catch {
    return null;
  }
};

export const connect = async (event) => {
  const { orgId, userId } = event.context.user || {};
  if (!orgId || !userId) return error(401, "Unauthenticated");

  const hasPaidLicense = await isPaidWhapiAllowed(userId, orgId);
  if (!hasPaidLicense) {
    return error(403, "WhatsApp connection is available on paid plans only.");
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

  const existingOrg = await findOrgChannel(orgId);
  if (existingOrg && !requestedChannelId) {
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
    const token = decrypt(selected.tokenEnc);
    const webhookUrl = resolveWebhookUrl();
    const webhookResp = await updateWebhook(token, webhookUrl);
    const qr = await fetchQrWithRetry(token);

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
      const content = getMessageContent(msg);
      const msgType =
        msg?.type ||
        msg?.message_type ||
        msg?.messageType ||
        (msg?.text ? "text" : null) ||
        "text";
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
        type: String(msgType || "text"),
        status: "received",
        providerMessageId: msg?.id || msg?.message_id || msg?.messageId || null,
        content,
      });
    }

    return success({ received: true });
  }

  return success("ok");
};
