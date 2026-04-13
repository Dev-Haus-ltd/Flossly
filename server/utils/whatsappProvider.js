import { WhapiChannelConfig } from "../models/index.js";
import { decrypt } from "./crypto.js";

export const getWhapiEnvConfig = () => {
  const config = useRuntimeConfig();
  const baseUrl =
    config.WHAPI_BASE_URL ||
    config.public?.WHAPI_BASE_URL ||
    process.env.WHAPI_BASE_URL ||
    "https://gate.whapi.cloud";
  const token =
    config.WHAPI_TOKEN ||
    config.public?.WHAPI_TOKEN ||
    process.env.WHAPI_TOKEN ||
    "";
  return {
    baseUrl: String(baseUrl || "").trim() || "https://gate.whapi.cloud",
    token: String(token || "").trim() || null,
  };
};

export const getWhapiPartnerConfig = () => {
  const config = useRuntimeConfig();
  const managerBaseUrl =
    config.WHAPI_MANAGER_BASE_URL ||
    process.env.WHAPI_MANAGER_BASE_URL ||
    "https://manager.whapi.cloud";
  const partnerToken =
    config.WHAPI_PARTNER_TOKEN ||
    process.env.WHAPI_PARTNER_TOKEN ||
    "";
  const projectId =
    config.WHAPI_PROJECT_ID ||
    process.env.WHAPI_PROJECT_ID ||
    "";
  const channelMode =
    config.WHAPI_CHANNEL_MODE ||
    process.env.WHAPI_CHANNEL_MODE ||
    "trial";
  return {
    managerBaseUrl: String(managerBaseUrl || "").trim() || "https://manager.whapi.cloud",
    partnerToken: String(partnerToken || "").trim() || null,
    projectId: String(projectId || "").trim() || null,
    channelMode: String(channelMode || "").trim() || "trial",
  };
};

export const resolveWhapiConfig = async (orgId) => {
  let row = null;
  try {
    await WhapiChannelConfig.sync();
  } catch {}
  if (orgId) {
    row = await WhapiChannelConfig.findOne({
      where: { organisationId: Number(orgId) },
      order: [["updatedAt", "DESC"]],
    });
  }
  if (row) {
    const token = decrypt(row.tokenEnc);
    const status = String(row.status || "").trim().toLowerCase();
    const hasIdentity = !!(row.phoneNumber || row.displayName);
    const connected =
      hasIdentity &&
      status &&
      !status.includes("loggedout") &&
      !status.includes("disconnected") &&
      !status.includes("stopped") &&
      !status.includes("overdue") &&
      !status.includes("pending") &&
      !status.includes("created") &&
      (status.includes("active") ||
        status.includes("live") ||
        status.includes("trial") ||
        status.includes("launched") ||
        status.includes("auth") ||
        status.includes("authorized") ||
        status.includes("qr"));
    const env = getWhapiEnvConfig();
    return {
      channelId: row.channelId,
      token,
      baseUrl: env.baseUrl,
      status: row.status || null,
      connected,
      source: "db",
      row,
    };
  }

  const env = getWhapiEnvConfig();
  if (env.token) {
    return {
      channelId: null,
      token: env.token,
      baseUrl: env.baseUrl,
      status: null,
      connected: false,
      source: "env",
      row: null,
    };
  }

  return null;
};

export const resolveWhatsAppProviderConfig = async (orgId) => {
  const whapi = await resolveWhapiConfig(orgId);
  return {
    provider: "whapi",
    baseUrl: whapi?.baseUrl || "https://gate.whapi.cloud",
    token: whapi?.token || null,
    channelId: whapi?.channelId || null,
    status: whapi?.status || null,
    connected: !!whapi?.connected,
    supportsTemplates: false,
    requiresTemplateOutside24h: false,
  };
};
