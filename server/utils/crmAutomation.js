import { crmAutomationDefaults } from "@shared/defaults/crmAutomationDefaults.js";
import { formatYmd, parseDayOffsetFromText } from "~/lib/misc";
import { htmlToPlainText } from "~/lib/format/text.js";
import { transporter } from "./nodeMailer.js";
import { buildLeadContext, renderTokens } from "./tokenRenderer.js";
import { applyLayout } from "./crmEmailRenderer.js";
import { CrmAutomationTemplate, CrmEmailTemplate, CrmLead, Organisation, CrmLeadAssignee, User } from "../models/index.js";
import { normalizeWhatsAppNumber, markWhatsAppOutbound, logWhatsAppMessage, isWhatsAppLimitExceeded } from "./whatsapp.js";
import { resolveWhapiConfig } from "./whatsappProvider.js";
import { sendCrmAutomationSentNotification, sendCrmAutomationFailedNotification } from "./fcmNotification.js";

const crmTriggersByKey = new Map(
  crmAutomationDefaults
    .map((def) => [def.key, def.trigger])
    .filter((entry) => entry[1])
);

export const inferTriggerFromName = (name) => {
  const lower = String(name || '').toLowerCase()
  if (lower.includes('birthday')) {
    if (lower.includes('month')) return { type: 'birthday_month_start', offsetDays: 0 }
    return { type: 'birthday_offset', days: 0 }
  }
  if (lower.includes('black friday')) return { type: 'black_friday', offsetDays: 0 }
  if (lower.includes('anniversary')) return { type: 'practice_anniversary', offsetDays: 0 }
  const daysAfterMatch = lower.match(/(\d+)\s*days?\s*(after|post|follow)/)
  if (daysAfterMatch) return { type: 'inquiry_days', days: Number(daysAfterMatch[1]) }
  const followDaysMatch = lower.match(/follow[- ]?up.*?(\d+)|(\d+)[- ]?day.*?follow/)
  if (followDaysMatch) {
    const days = Number(followDaysMatch[1] || followDaysMatch[2])
    return { type: 'inquiry_days', days: Number.isFinite(days) ? days : 3 }
  }
  return { type: 'inquiry_days', days: 0 }
}

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

export const buildCrmEmail = async (lead, tpl, org = null) => {
  let templateContent = tpl?.template || ''
  let renderMode = tpl?.renderMode || 'wrapped'

  // If the automation references a library template, load its content and mode
  if (tpl?.emailTemplateId) {
    try {
      const lib = await CrmEmailTemplate.findByPk(Number(tpl.emailTemplateId))
      if (lib) {
        templateContent = lib.template || templateContent
        renderMode = lib.renderMode || renderMode
      }
    } catch {}
  }

  const baseSubject = tpl?.subject || tpl?.name || "Message from Flossly"
  const ctx = buildLeadContext({ lead, org, userName: "Team" })
  const subject = renderTokens(baseSubject, ctx, { format: "text" })
  const html = renderTokens(templateContent, ctx, { format: "html" })
  return { subject, html, renderMode }
};


export const buildCrmWhatsAppMessage = (lead, tpl, org = null) => {
  const ctx = buildLeadContext({ lead, org, userName: "Team" });
  const rawTemplate = tpl?.template || "";
  const rendered = renderTokens(rawTemplate, ctx, { format: "text" });
  return htmlToPlainText(rendered);
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

export const sendCrmAutomationEmail = async (lead, subject, html, automationName = null, renderMode = 'wrapped') => {
  if (lead.autoReplyEnabled !== true) return;
  if (lead.autoReplyDisabledUntil && new Date() < new Date(lead.autoReplyDisabledUntil)) return;
  if (lead.autoReplyDisabledUntil && new Date() >= new Date(lead.autoReplyDisabledUntil)) {
    lead.autoReplyEnabled = true;
    lead.autoReplyDisabledUntil = null;
    await lead.save();
  }
  const finalHtml = applyLayout(html, subject, renderMode)
  await transporter.sendMail({
    to: lead.email,
    from: process.env.MAIL_FROM || "helloflossly@gmail.com",
    subject,
    html: finalHtml,
  });

  // Send push notification to lead assignees on success
  try {
    const assignees = await CrmLeadAssignee.findAll({
      where: { organisationId: Number(lead.organisationId), leadId: lead.id },
      include: [{ model: User, as: 'user', attributes: ['id'] }]
    });
    const userIds = assignees.map(a => a.user?.id).filter(Boolean);
    for (const userId of userIds) {
      await sendCrmAutomationSentNotification({
        userId,
        lead,
        automationName: automationName || subject,
        channel: 'Email'
      });
    }
  } catch (pushErr) {
    console.warn('CRM automation sent push notification failed', {
      leadId: lead.id,
      error: pushErr?.message || pushErr
    });
  }
};

export const sendCrmAutomationWhatsApp = async (lead, message, templatePayload = null, automationName = null) => {
  if (lead.autoReplyEnabled !== true) return;
  if (lead.autoReplyDisabledUntil && new Date() < new Date(lead.autoReplyDisabledUntil)) return;
  if (lead.autoReplyDisabledUntil && new Date() >= new Date(lead.autoReplyDisabledUntil)) {
    lead.autoReplyEnabled = true;
    lead.autoReplyDisabledUntil = null;
    await lead.save();
  }
  const to = normalizeWhatsAppNumber(lead?.telephone);
  if (!to) throw new Error("Missing or invalid phone number");
  const whapiConfig = await resolveWhapiConfig(lead.organisationId);
  if (!whapiConfig?.token) throw new Error("Whapi token is missing");
  if (!whapiConfig?.connected) throw new Error("Whapi channel is not connected");
  const limitStatus = await isWhatsAppLimitExceeded(lead.organisationId);
  if (limitStatus.exceeded) {
    throw new Error(`WhatsApp monthly limit reached (${limitStatus.count}/${limitStatus.limit})`);
  }
  const whapiUrl = `${String(whapiConfig.baseUrl || "").replace(/\/+$/, "")}/messages/text`;
  const headers = { Authorization: `Bearer ${whapiConfig.token}`, "Content-Type": "application/json" };
  try {
    const resp = await $fetch(whapiUrl, {
      method: "POST",
      headers,
      body: { to, body: String(message || "") },
    });
    const providerMessageId = resp?.message?.id || resp?.id || null;
    await markWhatsAppOutbound(lead, to);
    await logWhatsAppMessage({
      organisationId: lead.organisationId,
      leadId: lead.id,
      to,
      type: "text",
      status: "sent",
      providerMessageId,
      content: String(message || ""),
    });

    // Send push notification to lead assignees on success
    try {
      const assignees = await CrmLeadAssignee.findAll({
        where: { organisationId: Number(lead.organisationId), leadId: lead.id },
        include: [{ model: User, as: 'user', attributes: ['id'] }]
      });
      const userIds = assignees.map(a => a.user?.id).filter(Boolean);
      for (const userId of userIds) {
        await sendCrmAutomationSentNotification({
          userId,
          lead,
          automationName: automationName || templatePayload?.name || 'WhatsApp',
          channel: 'WhatsApp'
        });
      }
    } catch (pushErr) {
      console.warn('CRM automation sent push notification failed', {
        leadId: lead.id,
        error: pushErr?.message || pushErr
      });
    }
  } catch (e) {
    await logWhatsAppMessage({
      organisationId: lead.organisationId,
      leadId: lead.id,
      to,
      type: "text",
      status: "failed",
      error: e?.data?.error?.message || e?.message || "Failed to send",
    });

    // Send push notification to lead assignees on failure
    try {
      const assignees = await CrmLeadAssignee.findAll({
        where: { organisationId: Number(lead.organisationId), leadId: lead.id },
        include: [{ model: User, as: 'user', attributes: ['id'] }]
      });
      const userIds = assignees.map(a => a.user?.id).filter(Boolean);
      for (const userId of userIds) {
        await sendCrmAutomationFailedNotification({
          userId,
          lead,
          automationName: automationName || 'WhatsApp',
          channel: 'WhatsApp',
          errorMessage: e?.data?.error?.message || e?.message || "Failed to send"
        });
      }
    } catch (pushErr) {
      console.warn('CRM automation failed push notification failed', {
        leadId: lead.id,
        error: pushErr?.message || pushErr
      });
    }

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
  try {
    await CrmAutomationTemplate.update(
      { lastSentAt: new Date() },
      { where: { organisationId: lead.organisationId, key } }
    );
  } catch {}
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

const resolveAnniversaryBase = (org, today) => {
  if (!org?.practiceAnniversaryDate) return null;
  const d = new Date(org.practiceAnniversaryDate);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(today.getFullYear(), d.getMonth(), d.getDate());
};

const resolveAnniversaryMonthEnd = (org, today) => {
  if (!org?.practiceAnniversaryDate) return null;
  const d = new Date(org.practiceAnniversaryDate);
  if (Number.isNaN(d.getTime())) return null;
  const year = today.getFullYear();
  return new Date(year, d.getMonth() + 1, 0);
};

const resolveBirthdayMonthBase = (lead, today) => {
  if (!lead?.dob) return null;
  const dob = new Date(lead.dob);
  if (Number.isNaN(dob.getTime())) return null;
  return new Date(today.getFullYear(), dob.getMonth(), 1);
};

export const shouldSendCrmTemplate = ({ lead, tpl, trigger, today, org }) => {
  if (!trigger) return { due: false, sentKey: null };
  if (trigger.type === "send_now") {
    return { due: true, sentKey: tpl.key };
  }
  if (trigger.type === "inquiry_days") {
    if (!lead?.inquiryDate) return { due: false, sentKey: tpl.key };
    const d = daysSince(today, lead.inquiryDate);
    return { due: d !== null && d === trigger.days, sentKey: tpl.key };
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
  if (trigger.type === "birthday_month_start") {
    const year = today.getFullYear();
    const base = resolveBirthdayMonthBase(lead, today);
    if (!base) return { due: false, sentKey: `${tpl.key}_${year}` };
    const target = new Date(base);
    target.setDate(target.getDate() + Number(trigger.offsetDays || 0));
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
  if (trigger.type === "practice_anniversary") {
    const year = today.getFullYear();
    const base = resolveAnniversaryBase(org, today);
    if (!base) return { due: false, sentKey: `${tpl.key}_${year}` };
    const target = new Date(base);
    target.setDate(target.getDate() + Number(trigger.offsetDays || 0));
    const minHour = Number(trigger.minHour || 0);
    return {
      due: formatYmd(today) === formatYmd(target) && today.getHours() >= minHour,
      sentKey: `${tpl.key}_${year}`,
    };
  }
  if (trigger.type === "practice_anniversary_month_end") {
    const year = today.getFullYear();
    const base = resolveAnniversaryMonthEnd(org, today);
    if (!base) return { due: false, sentKey: `${tpl.key}_${year}` };
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

export const dispatchSendNowAutomation = async (orgId, tpl) => {
  return dispatchSendNowAutomationWithOptions(orgId, tpl, {});
};

export const dispatchSendNowAutomationWithOptions = async (orgId, tpl, options = {}) => {
  const forceResend =
    options?.forceResend === true ||
    String(options?.forceResend || "").toLowerCase() === "true";
  const org = await Organisation.findByPk(Number(orgId));
  const waConfig = await resolveWhapiConfig(orgId);
  const batchSize = 500;
  const summary = {
    orgId: Number(orgId),
    key: String(tpl?.key || ""),
    totalLeads: 0,
    sent: 0,
    resent: 0,
    skippedAlreadySent: 0,
    skippedMissingRecipient: 0,
    failed: 0,
  };
  let offset = 0;
  while (true) {
    const leads = await CrmLead.findAll({
      where: { organisationId: Number(orgId), softDeleted: false },
      limit: batchSize,
      offset,
      order: [["createdAt", "DESC"]],
    });
    if (!leads.length) break;
    for (const lead of leads) {
      summary.totalLeads += 1;
      const raw = lead.rawData || {};
      const sentKey = tpl.key;
      const wasAlreadySent = hasCrmSent(raw, sentKey);
      if (wasAlreadySent && !forceResend) {
        summary.skippedAlreadySent += 1;
        continue;
      }
      try {
        const type = String(tpl?.type || "Email").toLowerCase();
        if (type === "whatsapp") {
          if (!lead?.telephone) {
            summary.skippedMissingRecipient += 1;
            continue;
          }
          const message = buildCrmWhatsAppMessage(lead, tpl, org);
          await sendCrmAutomationWhatsApp(lead, message, null, tpl?.name);
          await markCrmSent(lead, raw, sentKey);
          if (wasAlreadySent && forceResend) summary.resent += 1;
          else summary.sent += 1;
        } else {
          if (!lead?.email) {
            summary.skippedMissingRecipient += 1;
            continue;
          }
          const { subject, html, renderMode } = await buildCrmEmail(lead, tpl, org);
          await sendCrmAutomationEmail(lead, subject, html, tpl?.name, renderMode);
          await markCrmSent(lead, raw, sentKey);
          if (wasAlreadySent && forceResend) summary.resent += 1;
          else summary.sent += 1;
        }
      } catch (e) {
        summary.failed += 1;
        console.error("[CRM send_now] failed for lead", lead.id, e?.message);
      }
    }
    offset += leads.length;
    if (leads.length < batchSize) break;
  }
  return summary;
};

export const previewSendNowAutomation = async (orgId, tpl) => {
  const summary = {
    orgId: Number(orgId),
    key: String(tpl?.key || ""),
    totalLeads: 0,
    alreadySent: 0,
    sendable: 0,
    missingRecipient: 0,
  };
  const batchSize = 500;
  let offset = 0;
  while (true) {
    const leads = await CrmLead.findAll({
      where: { organisationId: Number(orgId), softDeleted: false },
      limit: batchSize,
      offset,
      order: [["createdAt", "DESC"]],
    });
    if (!leads.length) break;
    for (const lead of leads) {
      summary.totalLeads += 1;
      const raw = lead.rawData || {};
      const sentKey = tpl.key;
      const alreadySent = hasCrmSent(raw, sentKey);
      if (alreadySent) {
        summary.alreadySent += 1;
      }
      const type = String(tpl?.type || "Email").toLowerCase();
      const hasRecipient = type === "whatsapp" ? !!lead?.telephone : !!lead?.email;
      if (!hasRecipient) {
        summary.missingRecipient += 1;
        continue;
      }
      if (!alreadySent) summary.sendable += 1;
    }
    offset += leads.length;
    if (leads.length < batchSize) break;
  }
  return summary;
};

export const sendImmediateCrmAutomationsForLead = async (lead, options = {}) => {
  const includeSendNow = options?.includeSendNow === true;
  // forceImmediate skips the date check — use when explicitly activating a group for a lead
  const forceImmediate = options?.forceImmediate === true;
  const templates = await CrmAutomationTemplate.findAll({
    where: { organisationId: Number(lead.organisationId) },
  });
  if (!templates.length) return;
  const org = await Organisation.findByPk(Number(lead.organisationId));
  const waConfig = await resolveWhapiConfig(lead.organisationId);
  const templatesByOrg = buildCrmTemplatesByOrg(templates);
  const effectiveTemplates = buildEffectiveCrmTemplates(lead, templatesByOrg);
  const today = new Date();
  for (const tpl of effectiveTemplates) {
    if (!tpl?.enabled) continue;
    const trigger = resolveCrmTrigger(tpl);
    if (!trigger) continue;
    const isImmediate =
      (trigger.type === "inquiry_days" && trigger.days === 0) ||
      (includeSendNow && trigger.type === "send_now");
    if (!isImmediate) continue;
    const sentKey = tpl.key;
    if (hasCrmSent(lead.rawData || {}, sentKey)) continue;
    if (!forceImmediate) {
      const { due } = shouldSendCrmTemplate({ lead, tpl, trigger, today, org });
      if (!due) continue;
    }
    if (String(tpl?.type || "Email").toLowerCase() === "whatsapp") {
      if (!lead?.telephone) continue;
      const message = buildCrmWhatsAppMessage(lead, tpl, org);
      await sendCrmAutomationWhatsApp(lead, message, null, tpl?.name);
      await markCrmSent(lead, lead.rawData || {}, sentKey);
    } else {
      if (!lead?.email) continue;
      const { subject, html, renderMode } = await buildCrmEmail(lead, tpl, org);
      await sendCrmAutomationEmail(lead, subject, html, tpl?.name, renderMode);
      await markCrmSent(lead, lead.rawData || {}, sentKey);
    }
  }
};

