import { MetaWhatsAppConfig } from "../models/index.js";
import { decrypt, encrypt } from "./crypto.js";

const resolveMetaAppCredentials = () => {
  const config = useRuntimeConfig?.() || {};
  const appId = config.META_APP_ID || process.env.META_APP_ID || "";
  const appSecret = config.META_APP_SECRET || process.env.META_APP_SECRET || "";
  return { appId, appSecret };
};

export const refreshWhatsAppAccessTokenIfNeeded = async (waRow) => {
  if (!waRow) return null;
  const { appId, appSecret } = resolveMetaAppCredentials();
  if (!appId || !appSecret) return waRow;

  const expiresAt = waRow.tokenExpiresAt ? new Date(waRow.tokenExpiresAt) : null;
  const now = Date.now();
  const refreshWindowMs = 7 * 24 * 60 * 60 * 1000;
  if (expiresAt && expiresAt.getTime() - now > refreshWindowMs) {
    return waRow;
  }

  const currentToken = decrypt(waRow.accessTokenEnc);
  if (!currentToken) return waRow;

  try {
    const url = `https://graph.facebook.com/v24.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${encodeURIComponent(
      appId
    )}&client_secret=${encodeURIComponent(appSecret)}&fb_exchange_token=${encodeURIComponent(
      currentToken
    )}`;
    const resp = await $fetch(url, { method: "GET" });
    const nextToken = resp?.access_token;
    if (!nextToken) return waRow;

    waRow.accessTokenEnc = encrypt(nextToken);
    if (resp?.expires_in) {
      waRow.tokenExpiresAt = new Date(Date.now() + Number(resp.expires_in) * 1000);
    }
    await waRow.save();
  } catch {
    // ignore refresh failures and keep current token
  }
  return waRow;
};

export const resolveWhatsAppConfig = async (orgId) => {
  const config = useRuntimeConfig?.() || {};
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

  try {
    await MetaWhatsAppConfig.sync();
  } catch {}

  const row = await MetaWhatsAppConfig.findOne({
    where: { organisationId: Number(orgId) },
  });
  if (row) {
    await refreshWhatsAppAccessTokenIfNeeded(row);
    return {
      phoneNumberId: row.phoneNumberId,
      accessToken: decrypt(row.accessTokenEnc),
      wabaId: row.wabaId || null,
      source: "db",
    };
  }

  if (envPhoneNumberId && envToken) {
    return {
      phoneNumberId: String(envPhoneNumberId).trim(),
      accessToken: String(envToken).trim(),
      wabaId: envWabaId ? String(envWabaId).trim() : null,
      source: "env",
    };
  }

  return null;
};

