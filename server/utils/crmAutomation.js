import { crmAutomationDefaults } from "@shared/defaults/crmAutomationDefaults.js";
import { formatYmd, parseDayOffsetFromText } from "~/lib/misc";
import { template as EMAIL_TEMPLATE } from "./emailTemplate.js";
import { transporter } from "./nodeMailer.js";
import { buildLeadContext, renderTokens } from "./tokenRenderer.js";
import { CrmAutomationTemplate } from "../models/index.js";
import { normalizeWhatsAppNumber, markWhatsAppOutbound, logWhatsAppMessage, isWhatsAppLimitExceeded } from "./whatsapp.js";
import { resolveWhatsAppProviderConfig } from "./whatsappProvider.js";

const crmTriggersByKey = new Map(
  crmAutomationDefaults
    .map((def) => [def.key, def.trigger])
    .filter((entry) => entry[1])
);

export const resolveCrmTrigger = (tpl) => {
  if (tpl?.trigger) return tpl.trigger;
  const fromDefaults = crmTriggersByKey.get(tpl.key);
  if (fromDefaults) return fromDefaults;
  const days = parseDayOffsetFromText(tpl.sending);
  if (days === null) return null;
  return { type: "inquiry_days", days };
};

export const buildCrmTemplatesByOrg = (templates = []) => {
  const templatesByOrg = new Map();
  templates.forEach((tpl) => {
    const orgId = Number(tpl.organisationId);
    const list = templatesByOrg.get(orgId) || [];
    const base = typeof tpl?.toJSON === "function" ? tpl.toJSON() : tpl;
    list.push(base);
    templatesByOrg.set(orgId, list);
  });
  return templatesByOrg;
};

export const buildEffectiveCrmTemplates = (lead, templatesByOrg) => {
  const raw = lead?.rawData || {};
  const overrides = raw?.crmAutomationOverrides || {};
  const baseTemplates = templatesByOrg.get(Number(lead.organisationId)) || [];
  const effectiveTemplates = [];
  const seen = new Set();
  baseTemplates.forEach((tpl) => {
    const override = overrides[tpl.key];
    const combined = override ? { ...tpl, ...override, key: tpl.key } : tpl;
    effectiveTemplates.push(combined);
    seen.add(tpl.key);
  });
  Object.entries(overrides).forEach(([key, override]) => {
    if (seen.has(key)) return;
    effectiveTemplates.push({ key, ...override });
  });
  return effectiveTemplates;
};

export const buildCrmEmail = (lead, tpl) => {
  const baseSubject = tpl?.subject || tpl?.name || "Message from Flossly";
  const ctx = buildLeadContext({ lead, userName: "Team" });
  const subject = renderTokens(baseSubject, ctx);
  const html = renderTokens(tpl.template || "", ctx);
  return { subject, html };
};

const stripHtmlToText = (html = "") => {
  if (!html) return "";
  return String(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*/gi, "\n\n")
    .replace(/<\/li>\s*/gi, "\n")
    .replace(/<li>\s*/gi, "• ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};


export const buildCrmWhatsAppMessage = (lead, tpl) => {
  const ctx = buildLeadContext({ lead, userName: "Team" });
  const rawTemplate = tpl?.template || "";
  const rendered = renderTokens(rawTemplate, ctx);
  return stripHtmlToText(rendered);
};

const extractWhatsAppParams = (templateText = "", ctx = {}) => {
  const tokenMap = {
    "[Patient Name]": ctx.name || "",
    "[Name]": ctx.name || "",
    "[First Name]": ctx.firstName || "",
    "[Email]": ctx.email || "",
    "[Your Name]": ctx.yourName || "",
    "[Patient Info]": ctx.info || "",
    "{{name}}": ctx.name || "",
    "{{firstName}}": ctx.firstName || "",
    "{{email}}": ctx.email || "",
    "{{yourName}}": ctx.yourName || "",
    "{{info}}": ctx.info || "",
  };
  const pattern = /\[Patient Name\]|\[Name\]|\[First Name\]|\[Email\]|\[Your Name\]|\[Patient Info\]|\{\{name\}\}|\{\{firstName\}\}|\{\{email\}\}|\{\{yourName\}\}|\{\{info\}\}/g;
  const matches = String(templateText || "").match(pattern) || [];
  return matches.map((m) => tokenMap[m] ?? "");
};

export const buildCrmWhatsAppTemplatePayload = (lead, tpl) => {
  const name = String(tpl?.whatsappTemplateName || "").trim();
  if (!name) return null;
  const language = String(tpl?.whatsappTemplateLanguage || "en_US").trim() || "en_US";
  const ctx = buildLeadContext({ lead, userName: "Team" });
  const params = extractWhatsAppParams(tpl?.template || "", ctx);
  const bodyParams = params.map((text) => ({ type: "text", text: String(text ?? "") }));
  const components = bodyParams.length ? [{ type: "body", parameters: bodyParams }] : [];
  return {
    name,
    language: { code: language },
    ...(components.length ? { components } : {}),
  };
};

export const sendCrmAutomationEmail = async (lead, subject, html) => {
  const wrapped = EMAIL_TEMPLATE.replaceAll("{subject}", subject).replace(
    "{content}",
    html
  );
  await transporter.sendMail({
    to: lead.email,
    from: process.env.MAIL_FROM || "helloflossly@gmail.com",
    subject,
    html: wrapped,
  });
};

export const sendCrmAutomationWhatsApp = async (lead, message, templatePayload = null) => {
  const to = normalizeWhatsAppNumber(lead?.telephone);
  if (!to) throw new Error("Missing or invalid phone number");
  const waConfig = await resolveWhatsAppProviderConfig(lead.organisationId);
  if (!waConfig?.provider) throw new Error("WhatsApp provider not configured");
  if (waConfig.provider === "meta" && (!waConfig?.phoneNumberId || !waConfig?.accessToken)) {
    throw new Error("WhatsApp is not configured");
  }
  if (waConfig.provider === "whapi" && !waConfig?.token) {
    throw new Error("Whapi token is missing");
  }
  const limitStatus = await isWhatsAppLimitExceeded(lead.organisationId);
  if (limitStatus.exceeded) {
    throw new Error(`WhatsApp monthly limit reached (${limitStatus.count}/${limitStatus.limit})`);
  }
  const metaUrl = waConfig.provider === "meta"
    ? `https://graph.facebook.com/v24.0/${waConfig.phoneNumberId}/messages`
    : null;
  const whapiUrl = waConfig.provider === "whapi"
    ? `${String(waConfig.baseUrl || "").replace(/\/+$/, "")}/messages/text`
    : null;
  try {
    const body =
      waConfig.provider === "meta"
        ? (
          templatePayload
            ? { messaging_product: "whatsapp", to, type: "template", template: templatePayload }
            : { messaging_product: "whatsapp", to, type: "text", text: { body: message || "" } }
        )
        : { to, body: String(message || "") };
    const resp = await $fetch(waConfig.provider === "meta" ? metaUrl : whapiUrl, {
      method: "POST",
      headers: waConfig.provider === "meta"
        ? {
            Authorization: `Bearer ${waConfig.accessToken}`,
            "Content-Type": "application/json",
          }
        : {
            Authorization: `Bearer ${waConfig.token}`,
            "Content-Type": "application/json",
          },
      body,
    });
    const providerMessageId =
      resp?.messages?.[0]?.id || resp?.message?.id || resp?.id || null;
    await markWhatsAppOutbound(lead, to);
    await logWhatsAppMessage({
      organisationId: lead.organisationId,
      leadId: lead.id,
      to,
      type: waConfig.provider === "meta" && templatePayload ? "template" : "text",
      templateName: waConfig.provider === "meta" ? (templatePayload?.name || null) : null,
      status: "sent",
      providerMessageId,
    });
  } catch (e) {
    await logWhatsAppMessage({
      organisationId: lead.organisationId,
      leadId: lead.id,
      to,
      type: waConfig.provider === "meta" && templatePayload ? "template" : "text",
      templateName: waConfig.provider === "meta" ? (templatePayload?.name || null) : null,
      status: "failed",
      error: e?.data?.error?.message || e?.message || "Failed to send",
    });
    throw e;
  }
};

export const hasCrmSent = (raw, key) =>
  !!(raw?.automationSentKeys && raw.automationSentKeys[key]);

export const markCrmSent = async (lead, raw, key) => {
  const map = { ...(raw.automationSentKeys || {}) };
  map[key] = new Date().toISOString();
  lead.rawData = { ...raw, automationSentKeys: map };
  await lead.save();
};

const daysSince = (today, date) => {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  return Math.floor((today - d) / (24 * 60 * 60 * 1000));
};

const getNthWeekdayOfMonth = (year, monthIndex, weekday, weekIndex) => {
  const first = new Date(year, monthIndex, 1);
  const firstWeekday = first.getDay();
  const offset = (weekday - firstWeekday + 7) % 7;
  const day = 1 + offset + 7 * (weekIndex - 1);
  return new Date(year, monthIndex, day);
};

export const shouldSendCrmTemplate = ({ lead, tpl, trigger, today }) => {
  if (!trigger) return { due: false, sentKey: null };
  if (trigger.type === "inquiry_days") {
    if (!lead?.inquiryDate) return { due: false, sentKey: tpl.key };
    const d = daysSince(today, lead.inquiryDate);
    return { due: d !== null && d >= trigger.days, sentKey: tpl.key };
  }
  if (trigger.type === "birthday_offset") {
    if (!lead?.dob) return { due: false, sentKey: `${tpl.key}_${today.getFullYear()}` };
    const year = today.getFullYear();
    const dob = new Date(lead.dob);
    const base = new Date(year, dob.getMonth(), dob.getDate());
    const target = new Date(base);
    target.setDate(target.getDate() + Number(trigger.days || 0));
    return {
      due: formatYmd(today) === formatYmd(target),
      sentKey: `${tpl.key}_${year}`,
    };
  }
  if (trigger.type === "black_friday") {
    const year = today.getFullYear();
    const bf = getBlackFriday(year);
    const target = new Date(bf);
    target.setDate(target.getDate() + Number(trigger.offsetDays || 0));
    const minHour = Number(trigger.minHour || 0);
    return {
      due: formatYmd(today) === formatYmd(target) && today.getHours() >= minHour,
      sentKey: `${tpl.key}_${year}`,
    };
  }
  if (trigger.type === "month_day") {
    const year = today.getFullYear();
    const month = Number(trigger.month || 0);
    const day = Number(trigger.day || 0);
    if (!month || !day) return { due: false, sentKey: null };
    const base = new Date(year, month - 1, day);
    const target = new Date(base);
    target.setDate(target.getDate() + Number(trigger.offsetDays || 0));
    const minHour = Number(trigger.minHour || 0);
    return {
      due: formatYmd(today) === formatYmd(target) && today.getHours() >= minHour,
      sentKey: `${tpl.key}_${year}`,
    };
  }
  if (trigger.type === "weekday_of_month") {
    const year = today.getFullYear();
    const month = Number(trigger.month || 0);
    const weekday = Number(trigger.weekday);
    const weekIndex = Number(trigger.weekIndex || 0);
    if (!month || Number.isNaN(weekday) || !weekIndex) {
      return { due: false, sentKey: null };
    }
    const base = getNthWeekdayOfMonth(year, month - 1, weekday, weekIndex);
    const target = new Date(base);
    target.setDate(target.getDate() + Number(trigger.offsetDays || 0));
    const minHour = Number(trigger.minHour || 0);
    return {
      due: formatYmd(today) === formatYmd(target) && today.getHours() >= minHour,
      sentKey: `${tpl.key}_${year}`,
    };
  }
  return { due: false, sentKey: null };
};

export const getBlackFriday = (year) => {
  let thursdays = 0;
  for (let d = 1; d <= 30; d++) {
    const dt = new Date(year, 10, d);
    if (dt.getDay() === 4) {
      thursdays++;
      if (thursdays === 4) {
        const thanksgiving = dt;
        const bf = new Date(thanksgiving);
        bf.setDate(thanksgiving.getDate() + 1);
        return bf;
      }
    }
  }
  let fridays = 0;
  for (let d = 1; d <= 30; d++) {
    const dt = new Date(year, 10, d);
    if (dt.getDay() === 5) {
      fridays++;
      if (fridays === 4) return dt;
    }
  }
  return new Date(year, 10, 29);
};

export const sendImmediateCrmAutomationsForLead = async (lead) => {
  const templates = await CrmAutomationTemplate.findAll({
    where: { organisationId: Number(lead.organisationId) },
  });
  if (!templates.length) return;
  const templatesByOrg = buildCrmTemplatesByOrg(templates);
  const effectiveTemplates = buildEffectiveCrmTemplates(lead, templatesByOrg);
  const today = new Date();
  const raw = lead.rawData || {};
  for (const tpl of effectiveTemplates) {
    if (!tpl?.enabled) continue;
    const trigger = resolveCrmTrigger(tpl);
    if (!trigger || trigger.type !== "inquiry_days" || trigger.days !== 0) continue;
    const { due, sentKey } = shouldSendCrmTemplate({ lead, tpl, trigger, today });
    if (!due || hasCrmSent(raw, sentKey)) continue;
    if (String(tpl?.type || "Email").toLowerCase() === "whatsapp") {
      if (!lead?.telephone) continue;
      const templatePayload = buildCrmWhatsAppTemplatePayload(lead, tpl);
      if (!templatePayload) {
        throw new Error("WhatsApp template name is required for automation");
      }
      const message = buildCrmWhatsAppMessage(lead, tpl);
      await sendCrmAutomationWhatsApp(lead, message, templatePayload);
      await markCrmSent(lead, raw, sentKey);
    } else {
      if (!lead?.email) continue;
      const { subject, html } = buildCrmEmail(lead, tpl);
      await sendCrmAutomationEmail(lead, subject, html);
      await markCrmSent(lead, raw, sentKey);
    }
  }
};
