import { MetaWhatsAppConfig, WhapiChannelConfig } from "../models/index.js";
import { decrypt } from "./crypto.js";

const normalizeProvider = (value) => {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "meta";
  if (raw === "whapi" || raw === "whatsapp-web" || raw === "web") return "whapi";
  return "meta";
};

export const getWhatsAppProviderKey = () => {
  const config = useRuntimeConfig();
  return normalizeProvider(
    config.WHATSAPP_PROVIDER ||
      config.public?.WHATSAPP_PROVIDER ||
      process.env.WHATSAPP_PROVIDER ||
      process.env.NUXT_WHATSAPP_PROVIDER
  );
};

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
    const hasPhone = !!row.phoneNumber;
    const connected =
      hasPhone &&
      status &&
      !status.includes("loggedout") &&
      !status.includes("disconnected") &&
      !status.includes("stopped") &&
      !status.includes("overdue") &&
      !status.includes("pending") &&
      !status.includes("created") &&
      (status.includes("active") || status.includes("live") || status.includes("trial") || status.includes("launched"));
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

export const resolveMetaWhatsAppConfig = async (orgId) => {
  const config = useRuntimeConfig();
  const envPhoneNumberId =
    config.META_WA_PHONE_NUMBER_ID ||
    config.WHATSAPP_PHONE_NUMBER_ID ||
    process.env.META_WA_PHONE_NUMBER_ID ||
    process.env.WHATSAPP_PHONE_NUMBER_ID ||
    "";
  const envToken =
    config.META_WA_ACCESS_TOKEN ||
    config.WHATSAPP_ACCESS_TOKEN ||
    process.env.META_WA_ACCESS_TOKEN ||
    process.env.WHATSAPP_ACCESS_TOKEN ||
    "";
  const envWabaId =
    config.META_WA_WABA_ID ||
    config.WHATSAPP_WABA_ID ||
    process.env.META_WA_WABA_ID ||
    process.env.WHATSAPP_WABA_ID ||
    "";

  let row = null;
  try {
    await MetaWhatsAppConfig.sync();
  } catch {}
  if (orgId) {
    row = await MetaWhatsAppConfig.findOne({
      where: { organisationId: Number(orgId) },
    });
  }

  if (row) {
    return {
      phoneNumberId: row.phoneNumberId,
      accessToken: decrypt(row.accessTokenEnc),
      wabaId: row.wabaId || null,
      source: "db",
      row,
    };
  }

  if (envPhoneNumberId && envToken) {
    return {
      phoneNumberId: String(envPhoneNumberId).trim(),
      accessToken: String(envToken).trim(),
      wabaId: envWabaId ? String(envWabaId).trim() : null,
      source: "env",
      row: null,
    };
  }

  return null;
};

export const resolveWhatsAppProviderConfig = async (orgId) => {
  const provider = getWhatsAppProviderKey();
  if (provider === "whapi") {
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
  }

  const meta = await resolveMetaWhatsAppConfig(orgId);
  return {
    provider: "meta",
    phoneNumberId: meta?.phoneNumberId || null,
    accessToken: meta?.accessToken || null,
    wabaId: meta?.wabaId || null,
    supportsTemplates: true,
    requiresTemplateOutside24h: true,
  };
};
