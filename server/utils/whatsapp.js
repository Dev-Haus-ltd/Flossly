import { Op } from "sequelize";
import { CrmWhatsAppMessageLog } from "../models/index.js";
import { UserPreference, UserSubscription } from "../models/index.js";

const WHATSAPP_LIMITS_BY_PLAN = {
  drift: 250,
  glide: 750,
  soar: 1500,
  trial: 250,
};
const TRIAL_TOTAL_LIMIT = 250;
const TRIAL_WINDOW_DAYS = 15;

const normalizePlanKey = (value) => {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return null;
  if (raw.includes("soar")) return "soar";
  if (raw.includes("glide")) return "glide";
  if (raw.includes("drift")) return "drift";
  if (raw.includes("trial")) return "trial";
  return null;
};

export const normalizeWhatsAppNumber = (value) => {
  const raw = String(value || '').trim()
  if (!raw) return null
  const digits = raw.replace(/\D/g, '')
  if (digits.length < 8) return null
  return digits
}

export const hasActiveWhatsAppWindow = (lead) => {
  const lastInboundAt = lead?.rawData?.whatsapp?.lastInboundAt
  if (!lastInboundAt) return false
  const last = new Date(lastInboundAt)
  if (Number.isNaN(last.valueOf())) return false
  const diffMs = Date.now() - last.getTime()
  return diffMs >= 0 && diffMs <= 24 * 60 * 60 * 1000
}

export const markWhatsAppOutbound = async (lead, to) => {
  const raw = lead.rawData || {}
  const existing = raw.whatsapp || {}
  lead.rawData = {
    ...raw,
    whatsapp: {
      ...existing,
      lastOutboundAt: new Date().toISOString(),
      lastOutboundTo: to || existing.lastOutboundTo || null,
    },
  }
  await lead.save()
}

export const logWhatsAppMessage = async ({
  organisationId,
  leadId = null,
  to = null,
  direction = "outbound",
  type = "text",
  templateName = null,
  status = "sent",
  providerMessageId = null,
  content = null,
  attachments = null,
  error = null,
}) => {
  try {
    await CrmWhatsAppMessageLog.create({
      organisationId: Number(organisationId),
      leadId: leadId ? Number(leadId) : null,
      to: to ? String(to) : null,
      direction,
      type,
      templateName,
      status,
      providerMessageId,
      content: content != null ? String(content) : null,
      attachments: attachments ?? null,
      error,
    });
  } catch {
    // avoid blocking core flow if logging fails
  }
};

export const getMonthlyWhatsAppUsage = async (organisationId, atDate = new Date()) => {
  if (!organisationId) return { count: 0, start: null, end: null };
  const start = new Date(atDate.getFullYear(), atDate.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(atDate.getFullYear(), atDate.getMonth() + 1, 1, 0, 0, 0, 0);
  return await getWhatsAppUsageInWindow(organisationId, start, end);
};

export const getWhatsAppUsageInWindow = async (organisationId, start, end) => {
  if (!organisationId || !start || !end) return { count: 0, start, end };
  try {
    const count = await CrmWhatsAppMessageLog.count({
      where: {
        organisationId: Number(organisationId),
        direction: "outbound",
        status: "sent",
        createdAt: { [Op.gte]: start, [Op.lt]: end },
      },
    });
    return { count: Number(count || 0), start, end };
  } catch {
    return { count: 0, start, end };
  }
};

const getTrialWindowForOrg = async (organisationId) => {
  if (!organisationId) return null;
  try {
    const pref = await UserPreference.findOne({
      where: { organisationId: Number(organisationId), licenseType: "Trial" },
      order: [["createdAt", "DESC"]],
    });
    if (!pref) return null;
    const end = pref.licenseRenewalDate ? new Date(pref.licenseRenewalDate) : null;
    if (!end) return null;
    const start = pref.createdAt ? new Date(pref.createdAt) : new Date(end.getTime() - TRIAL_WINDOW_DAYS * 86400000);
    const now = new Date();
    if (now > end) return null;
    return { start, end };
  } catch {
    return null;
  }
};

export const getOrganisationWhatsAppLimit = async (organisationId, userId = null) => {
  let licenseType = null;
  try {
    if (userId) {
      const pref = await UserPreference.findOne({
        where: { organisationId: Number(organisationId), userId: Number(userId) },
      });
      licenseType = pref?.licenseType || null;
    }
    if (!licenseType) {
      const sub = await UserSubscription.findOne({
        where: { organisationId: Number(organisationId) },
      });
      licenseType = sub?.licenseType || sub?.stripeSubscriptionStatus || null;
    }
  } catch {
    licenseType = null;
  }
  const planKey = normalizePlanKey(licenseType) || "trial";
  return WHATSAPP_LIMITS_BY_PLAN[planKey] || WHATSAPP_LIMITS_BY_PLAN.trial;
};

export const isWhatsAppLimitExceeded = async (organisationId, userId = null) => {
  const trialWindow = await getTrialWindowForOrg(organisationId);
  if (trialWindow) {
    const { count } = await getWhatsAppUsageInWindow(organisationId, trialWindow.start, trialWindow.end);
    return { exceeded: count >= TRIAL_TOTAL_LIMIT, count, limit: TRIAL_TOTAL_LIMIT, window: trialWindow, isTrial: true };
  }

  const [{ count }, limit] = await Promise.all([
    getMonthlyWhatsAppUsage(organisationId),
    getOrganisationWhatsAppLimit(organisationId, userId),
  ]);
  return { exceeded: count >= limit, count, limit, isTrial: false };
};
