import { Op } from "sequelize";
import {
  UserTask,
  CrmLead,
  UserDocument,
  CrmAutomationTemplate,
  PatientAutomationTemplate,
  OnboardingEvent,
} from "../models/index.js";
import { ONBOARDING_EMAIL_TEMPLATES } from "@shared/defaults/onboardingCampaign.js";

const CLIENT_ONBOARDING_KEYS = new Set([
  "welcome_quiz_done",
  "welcome_video_done",
  "onboarding_inapp_day2_meta",
  "onboarding_inapp_day3_automation",
  "onboarding_inapp_day4_noshows",
  "onboarding_inapp_day5_recalls",
  "onboarding_inapp_day6_automation",
  "onboarding_inapp_day7_trial",
  "onboarding_inapp_day13_trial",
]);

const ONBOARDING_PRIVILEGED_ROLE_IDS = [1, 8];
export const isOnboardingRecipientRole = (roleId) =>
  ONBOARDING_PRIVILEGED_ROLE_IDS.includes(Number(roleId));

let onboardingEventsSynced = false;

export const ensureOnboardingEventsTable = async () => {
  if (onboardingEventsSynced) return;
  try {
    await OnboardingEvent.sync();
    onboardingEventsSynced = true;
  } catch (err) {
  }
};

export const ensureOnboardingStartEvent = async ({ userId, organisationId }) => {
  await ensureOnboardingEventsTable();
  const existing = await OnboardingEvent.findOne({
    where: { userId, organisationId, key: "onboarding_start" },
  });
  if (existing) return { event: existing, created: false };
  const created = await OnboardingEvent.create({
    userId,
    organisationId,
    key: "onboarding_start",
    payload: { startedAt: new Date().toISOString() },
  });
  return { event: created, created: true };
};

export const getOnboardingEventMap = async ({ userId, organisationId, keys }) => {
  await ensureOnboardingEventsTable();
  if (!keys?.length) return new Map();
  const events = await OnboardingEvent.findAll({
    where: {
      userId,
      organisationId,
      key: { [Op.in]: keys },
    },
  });
  return new Map(events.map((evt) => [evt.key, evt]));
};

export const getOnboardingKeys = () => {
  const emailKeys = ONBOARDING_EMAIL_TEMPLATES.map((t) => t.key);
  return [...new Set([...CLIENT_ONBOARDING_KEYS, ...emailKeys])];
};

export const isClientOnboardingKey = (key) => CLIENT_ONBOARDING_KEYS.has(key);

export const recordOnboardingEvent = async ({
  userId,
  organisationId,
  key,
  payload,
  allowList,
}) => {
  if (allowList && !allowList.has(key)) {
    return { created: false, allowed: false };
  }
  await ensureOnboardingEventsTable();
  const existing = await OnboardingEvent.findOne({
    where: { userId, organisationId, key },
  });
  if (existing) return { created: false, allowed: true };
  await OnboardingEvent.create({
    userId,
    organisationId,
    key,
    payload: payload || null,
  });
  return { created: true, allowed: true };
};

export const getOnboardingMetrics = async (organisationId) => {
  if (!organisationId) return null;
  const [tasksCount, leadsCount, documentsCount, crmAutomations, patientAutomations] =
    await Promise.all([
      UserTask.count({ where: { organisationId } }),
      CrmLead.count({ where: { organisationId, softDeleted: false } }),
      UserDocument.count({ where: { organisationId } }),
      CrmAutomationTemplate.count({ where: { organisationId } }),
      PatientAutomationTemplate.count({ where: { organisationId } }),
    ]);

  const automationsCount = Number(crmAutomations || 0) + Number(patientAutomations || 0);
  const hoursSaved = Math.max(1, Math.round(Number(tasksCount || 0) / 3));
  const valueCreated = Math.max(0, hoursSaved * 50);

  return {
    tasksCount: String(tasksCount || 0),
    leadsCount: String(leadsCount || 0),
    documentsCount: String(documentsCount || 0),
    automationsCount: String(automationsCount || 0),
    hoursSaved: String(hoursSaved || 0),
    valueCreated: String(valueCreated || 0),
  };
};

export const getDiffDaysFromStart = (startAt, now = new Date()) => {
  if (!startAt) return 0;
  const start = new Date(startAt);
  if (Number.isNaN(start.getTime())) return 0;
  const startDay = new Date(start);
  startDay.setHours(0, 0, 0, 0);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return Math.floor((today - startDay) / (24 * 60 * 60 * 1000));
};

export { CLIENT_ONBOARDING_KEYS, ONBOARDING_PRIVILEGED_ROLE_IDS };
