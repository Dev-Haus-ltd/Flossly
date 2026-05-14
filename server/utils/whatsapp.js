import { Op } from "sequelize";
import { CrmWhatsAppMessageLog } from "../models/index.js";
import { Organisation } from "../models/index.js";

const WHATSAPP_LIMITS_BY_PLAN = {
  lite: 250,
  crm: 750,
  pro: 1500,
};

const normalizePlanKey = (value) => {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return null;
  if (raw.includes("pro") || raw.includes("soar") || raw.includes("system")) return "pro";
  if (raw.includes("crm") || raw.includes("glide")) return "crm";
  if (raw.includes("lite") || raw.includes("drift") || raw.includes("trial")) return "lite";
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
  lead.autoReplyEnabled = false
  lead.autoReplyDisabledUntil = new Date(Date.now() + 12 * 60 * 60 * 1000)
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

export const getOrganisationWhatsAppLimit = async (organisationId, userId = null) => {
  let licenseType = null;
  try {
    const org = await Organisation.findByPk(Number(organisationId), {
      attributes: ["licenseType"],
    });
    if (org) {
      licenseType = org.licenseType || null;
    }
  } catch {
    licenseType = null;
  }
  const planKey = normalizePlanKey(licenseType) || "lite";
  return WHATSAPP_LIMITS_BY_PLAN[planKey] || WHATSAPP_LIMITS_BY_PLAN.lite;
};

export const isWhatsAppLimitExceeded = async (organisationId, userId = null) => {
  const [{ count }, limit] = await Promise.all([
    getMonthlyWhatsAppUsage(organisationId),
    getOrganisationWhatsAppLimit(organisationId, userId),
  ]);
  return { exceeded: count >= limit, count, limit, isTrial: false };
};
