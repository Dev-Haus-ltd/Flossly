import { template } from "./emailTemplate";
import { getOrgTransporter, getFromAddress } from "./nodeMailer";
import { formatDateDDMMYYYY } from "~/lib/dateFormatter.js";
import { ONBOARDING_EMAIL_TEMPLATES, ONBOARDING_INAPP_MESSAGES } from '@shared/defaults/onboardingCampaign.js';
import { renderOnboardingTokens } from "./templateTokens.js";

export { ONBOARDING_EMAIL_TEMPLATES, ONBOARDING_INAPP_MESSAGES };

const DEFAULT_FROM = "Flossly <helloflossly@gmail.com>";
const DEFAULT_PRICING = { lite: 0, crm: 199, pro: 499, currency: "£" };
const DEFAULT_IMPACT = {
  adminHours: 12,
  hoursSaved: 10,
  enquiryLoss: 15,
  revenueRecovered: 18000,
  noShowRate: 18,
  noShowRateAfter: 7,
  noShowSavings: 22000,
  searchHours: 2,
  totalAnnual: 47280,
  hoursReturned: 520,
};

const formatDate = (date) => formatDateDDMMYYYY(date);




export const getOnboardingEmailTemplate = (key) =>
  ONBOARDING_EMAIL_TEMPLATES.find((tpl) => tpl.key === key);

export const buildOnboardingEmail = ({ key, ctx }) => {
  const tpl = getOnboardingEmailTemplate(key);
  if (!tpl) return null;
  const subject = renderOnboardingTokens(tpl.subject, ctx);
  const body = renderOnboardingTokens(tpl.body, ctx);
  const html = template.replaceAll("{subject}", subject).replace("{content}", body);
  return { subject, html };
};

export const sendOnboardingEmail = async ({ key, to, ctx, from, orgId }) => {
  const built = buildOnboardingEmail({ key, ctx });
  if (!built) return false;
  const orgTransporter = await getOrgTransporter(orgId);
  const orgFrom = from || getFromAddress(orgId);
  await orgTransporter.sendMail({
    from: orgFrom,
    to,
    subject: built.subject,
    html: built.html,
  });
  return true;
};

export const buildOnboardingInAppMessages = ({
  startAt,
  now = new Date(),
  ctx,
  seenKeys = new Set(),
  pendingEventKeys = new Set(),
}) => {
  if (!startAt) return [];
  const startDate = new Date(startAt);
  if (Number.isNaN(startDate.getTime())) return [];
  const startDay = new Date(startDate);
  startDay.setHours(0, 0, 0, 0);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today - startDay) / (24 * 60 * 60 * 1000));
  if (!Number.isFinite(diffDays)) return [];

  const isTrialPlan = ['Trial', 'CRM', 'Pro'].includes(String(ctx?.planName || ''));
  const trialDaysRemaining = Number(ctx?.trialDaysRemaining || 0);
  const trialOnlyKeys = new Set([
    "onboarding_inapp_day7_trial",
    "onboarding_inapp_day13_trial",
  ]);

  return ONBOARDING_INAPP_MESSAGES
    .filter((msg) => {
      if (msg.triggerType === 'event') return pendingEventKeys.has(msg.key);
      return msg.offsetDays === diffDays;
    })
    .filter((msg) => {
      if (!trialOnlyKeys.has(msg.key)) return true;
      if (!isTrialPlan) return false;
      if (!Number.isFinite(trialDaysRemaining) || trialDaysRemaining <= 0) return false;
      return true;
    })
    .filter((msg) => !seenKeys.has(msg.key))
    .map((msg) => ({
      ...msg,
      title: renderOnboardingTokens(msg.title, ctx),
      message: renderOnboardingTokens(msg.message, ctx),
      primaryLabel: renderOnboardingTokens(msg.primaryLabel, ctx),
      primaryLink: renderOnboardingTokens(msg.primaryLink, ctx),
      secondaryLabel: msg.secondaryLabel ? renderOnboardingTokens(msg.secondaryLabel, ctx) : "",
      secondaryLink: msg.secondaryLink ? renderOnboardingTokens(msg.secondaryLink, ctx) : "",
    }));
};

export const buildOnboardingContext = ({
  user,
  organisation,
  userPreference,
  metrics,
  config,
  startAt,
  now = new Date(),
}) => {
  const baseUrlRaw = config?.public?.BASE_URL || "";
  const baseUrl = baseUrlRaw.endsWith("/") ? baseUrlRaw.slice(0, -1) : baseUrlRaw;
  const renewalDate = organisation?.licenseRenewalDate ?? userPreference?.licenseRenewalDate;
  const trialEndDate = formatDate(renewalDate);
  const watchVideoUrl =
    config?.public?.ONBOARDING_WELCOME_VIDEO_URL ||
    "https://youtu.be/gEuICxXisnw?si=1L-7jdiwwnr_VpDC";
  const licenseType = String(organisation?.licenseType || userPreference?.licenseType || "").trim();
  const planName = licenseType || "Lite";

  const normalizeDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const msPerDay = 24 * 60 * 60 * 1000;
  const today = normalizeDate(now);
  const startDay = normalizeDate(startAt || userPreference?.createdAt || user?.createdAt);
  const endDay = normalizeDate(organisation?.licenseRenewalDate ?? userPreference?.licenseRenewalDate);

  let trialDaysRemaining = "";
  let trialDaysUsed = "";
  let trialTotalDays = "";

  if (endDay && today) {
    trialDaysRemaining = Math.max(0, Math.ceil((endDay - today) / msPerDay));
  }
  if (startDay && today) {
    trialDaysUsed = Math.max(0, Math.floor((today - startDay) / msPerDay));
  }
  if (startDay && endDay) {
    trialTotalDays = Math.max(0, Math.ceil((endDay - startDay) / msPerDay));
  }

  const unitLabel = (value) => (Number(value) === 1 ? "day" : "days");
  const trialDaysRemainingUnit = trialDaysRemaining !== "" ? unitLabel(trialDaysRemaining) : "";
  const trialDaysUsedUnit = trialDaysUsed !== "" ? unitLabel(trialDaysUsed) : "";
  const trialTotalDaysUnit = trialTotalDays !== "" ? unitLabel(trialTotalDays) : "";

  const toNumber = (value, fallback) => {
    if (value === null || value === undefined) return fallback;
    const num = Number(value);
    if (Number.isFinite(num)) return num;
    if (typeof value === "string") {
      const cleaned = value.replace(/[^0-9.]/g, "");
      const parsed = Number(cleaned);
      if (Number.isFinite(parsed)) return parsed;
    }
    return fallback;
  };

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const formatNumber = (value) =>
    Number.isFinite(Number(value)) ? Number(value).toLocaleString("en-GB") : "";

  const teamCountRaw = toNumber(organisation?.teamCount, null);
  const chairCountRaw = toNumber(organisation?.surgeryCount, null);
  const baseTeam = 8;
  const baseChairs = 3;
  const scale =
    teamCountRaw || chairCountRaw
      ? clamp(
          (teamCountRaw ? teamCountRaw / baseTeam : 1) *
            (chairCountRaw ? chairCountRaw / baseChairs : 1),
          0.6,
          2.5
        )
      : 1;

  const impactDefaults = DEFAULT_IMPACT;

  const impactAdminHours = Math.round(impactDefaults.adminHours * scale);
  const impactHoursSaved = Math.round(impactDefaults.hoursSaved * scale);
  const impactRevenueRecovered = Math.round(impactDefaults.revenueRecovered * scale);
  const impactNoShowSavings = Math.round(impactDefaults.noShowSavings * scale);
  const impactSearchHours = Math.round(impactDefaults.searchHours);
  const impactTotalAnnual = Math.round(
    (impactDefaults.totalAnnual * scale + impactRevenueRecovered + impactNoShowSavings) / 2
  );
  const impactHoursReturned = Math.round(impactDefaults.hoursReturned * scale);
  const practiceSnapshot = chairCountRaw || teamCountRaw
    ? `${chairCountRaw || baseChairs} chairs, ${teamCountRaw || baseTeam} staff`
    : "your practice";

  const planLitePrice = formatNumber(DEFAULT_PRICING.lite);
  const planCrmPrice = formatNumber(DEFAULT_PRICING.crm);
  const planProPrice = formatNumber(DEFAULT_PRICING.pro);
  // Legacy aliases kept to avoid broken token render in old email bodies
  const planDriftPrice = "";
  const planGlidePrice = "";
  const planSoarPrice = "";
  const pricingCurrency = DEFAULT_PRICING.currency;
  const pricingFromLabel = `From ${pricingCurrency}${DEFAULT_PRICING.crm}/month`;

  return {
    name: user?.fullName || "there",
    practiceName: organisation?.name || "your practice",
    email: user?.email || "",
    founderName: config?.public?.ONBOARDING_FOUNDER_NAME || "The Flossy Team",
    successManagerName: config?.public?.ONBOARDING_SUCCESS_MANAGER_NAME || "Flossy Team",
    trialEndDate,
    planName,
    trialDaysRemaining,
    trialDaysRemainingUnit,
    trialDaysUsed,
    trialDaysUsedUnit,
    trialTotalDays,
    trialTotalDaysUnit,
    planLitePrice,
    planCrmPrice,
    planProPrice,
    planDriftPrice,
    planGlidePrice,
    planSoarPrice,
    pricingCurrency,
    pricingFromLabel,
    practiceSnapshot,
    impactAdminHours: formatNumber(impactAdminHours),
    impactHoursSaved: formatNumber(impactHoursSaved),
    impactEnquiryLoss: formatNumber(impactDefaults.enquiryLoss),
    impactRevenueRecovered: formatNumber(impactRevenueRecovered),
    impactNoShowRate: formatNumber(impactDefaults.noShowRate),
    impactNoShowRateAfter: formatNumber(impactDefaults.noShowRateAfter),
    impactNoShowSavings: formatNumber(impactNoShowSavings),
    impactSearchHours: formatNumber(impactSearchHours),
    impactTotalAnnual: formatNumber(impactTotalAnnual),
    impactHoursReturned: formatNumber(impactHoursReturned),
    tasksCount: metrics?.tasksCount ?? "0",
    leadsCount: metrics?.leadsCount ?? "0",
    automationsCount: metrics?.automationsCount ?? "0",
    documentsCount: metrics?.documentsCount ?? "0",
    hoursSaved: metrics?.hoursSaved ?? "0",
    valueCreated: metrics?.valueCreated ?? "0",
    baseUrl,
    watchVideoUrl,
    startSetupUrl: `${baseUrl}/setup`,
    completeSetupUrl: `${baseUrl}/setup`,
    scheduleCallUrl: "https://calendly.com/helloflossly/flossly-training",
    connectMetaAdsUrl: `${baseUrl}/crm`,
    automationBuilderUrl: `${baseUrl}/crm`,
    setUpDiaryUrl: `${baseUrl}/diary`,
    recallSetupUrl: `${baseUrl}/diary`,
    activateAutomationUrl: `${baseUrl}/crm`,
    subscribeUrl: `${baseUrl}/subscription`,
    exportDataUrl: `${baseUrl}/settings`,
  };
};

