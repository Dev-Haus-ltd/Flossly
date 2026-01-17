import { crmAutomationDefaults } from "~/lib/crmAutomationDefaults";
import { formatYmd, parseDayOffsetFromText } from "~/lib/misc";
import { template as EMAIL_TEMPLATE } from "./emailTemplate.js";
import { transporter } from "./nodeMailer.js";
import { buildLeadContext, renderTokens } from "./tokenRenderer.js";
import { CrmAutomationTemplate } from "../models/index.js";

const crmTriggersByKey = new Map(
  crmAutomationDefaults
    .map((def) => [def.key, def.trigger])
    .filter((entry) => entry[1])
);

export const resolveCrmTrigger = (tpl) => {
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

const cleanCrmSubject = (subject = "") =>
  String(subject)
    .replace(/\([^)]*\)/g, "")
    .replace(/\bday\s*\d+\b/gi, "")
    .replace(/\b\d+\s*days?\s*(before|after)\b/gi, "")
    .replace(/\b(morning|evening|afternoon|immediate(ly)?)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+-\s+-/g, " - ")
    .replace(/\s+-\s*$/g, "")
    .trim();

export const buildCrmEmail = (lead, tpl) => {
  const baseSubject = tpl.name || "Message from Flossly";
  const ctx = buildLeadContext({ lead, userName: "Team" });
  const subject = cleanCrmSubject(renderTokens(baseSubject, ctx));
  const html = renderTokens(tpl.template || "", ctx);
  return { subject, html };
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
  if (!lead?.email) return;
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
    const { subject, html } = buildCrmEmail(lead, tpl);
    await sendCrmAutomationEmail(lead, subject, html);
    await markCrmSent(lead, raw, sentKey);
  }
};
