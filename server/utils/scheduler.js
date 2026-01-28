import cron from "node-cron";
import { Op } from "sequelize";
import { formatYmd, parseDayOffsetFromText, addDaysSafe } from "~/lib/misc";
import {
  OrganisationStatus,
  UserTask,
  User,
  Task,
  CrmLead,
  CrmAutomationTemplate,
  DiaryPatient,
  DiaryAppointment,
  PatientAutomationTemplate,
  Organisation,
  UserPreference,
  OnboardingEvent,
} from "../models/index.js";
import { ONBOARDING_EMAIL_TEMPLATES } from "@shared/defaults/onboardingCampaign.js";
import { buildOnboardingContext, sendOnboardingEmail } from "./onboardingCampaign.js";
import { renderPatientTokens } from "./templateTokens.js";
import {
  ensureOnboardingEventsTable,
  getDiffDaysFromStart,
  getOnboardingMetrics,
  recordOnboardingEvent,
} from "./onboardingService.js";

const frequencyMap = {
  Daily: "0 0 * * *", // every day at midnight
  Weekly: "0 0 * * 1", // every Monday
  Fortnightly: "0 0 */14 * *", // every 14 days
  Monthly: "0 0 1 * *", // first day of month
  "6 Monthly": "0 0 1 */6 *", // first day every 6 months
  Yearly: "0 0 1 1 *", // Jan 1st every year
};

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export const startTaskScheduler = () => {
  Object.keys(frequencyMap).forEach((frequency) => {
    if (!frequencyMap[frequency]) return;
    
    cron.schedule(frequencyMap[frequency], async () => {
      console.log(`Running scheduler for ${frequency} tasks...`);
      try {
        const tasks = await UserTask.findAll({
          where: {
            frequency,
            isArchieved: false,
          },
        });

        for (const task of tasks) {
          let nextDueDate = null;
          switch (frequency) {
            case "Daily":
              nextDueDate = addDays(new Date(), 1);
              break;
            case "Weekly":
              nextDueDate = addDays(new Date(), 7);
              break;
            case "Fortnightly":
              nextDueDate = addDays(new Date(), 14);
              break;
            case "Monthly":
              nextDueDate = addDays(new Date(), 30);
              break;
            case "6 Monthly":
              nextDueDate = addDays(new Date(), 180);
              break;
            case "Yearly":
              nextDueDate = addDays(new Date(), 365);
              break;
          }
          const statuses = await OrganisationStatus.findAll({
            where: { organisationId: task.organisationId },
          });
          await UserTask.create({
            userId: task.userId,
            taskId: task.taskId,
            organisationId: task.organisationId,
            statusId: statuses.find((x) => x.key === "progress").id,
            title: task.title,
            documentLink: "",
            priorityId: task.priorityId,
            frequency: task.frequency,
            dueDate: nextDueDate,
            template: task.template,
            comments: "",
            assignedBy: task.assignedBy,
          });
        }
      } catch (error) {
        console.error("Error in scheduler:", error);
      }
    });
  });
}

import {
  buildCrmTemplatesByOrg,
  buildEffectiveCrmTemplates,
  buildCrmEmail,
  sendCrmAutomationEmail,
  resolveCrmTrigger,
  shouldSendCrmTemplate,
  hasCrmSent,
  markCrmSent,
} from "./crmAutomation.js";

export const startLeadAutomationScheduler = () => {
  const pattern = process.env.CRM_LEAD_AUTOMATION_SCHEDULE || "0 0 * * *";
  if (!pattern) return;
  const batchSize = Number(process.env.CRM_LEAD_AUTOMATION_BATCH || 500)
  try { CrmAutomationTemplate.sync() } catch {}
  cron.schedule(pattern, async () => {
    try {
      const templates = await CrmAutomationTemplate.findAll({ order: [['createdAt','ASC']] })
      if (!templates.length) return
      const templatesByOrg = buildCrmTemplatesByOrg(templates)
      const today = new Date()

      let offset = 0
      while (true) {
        const leads = await CrmLead.findAll({
          where: { softDeleted: false },
          limit: batchSize,
          offset,
          order: [['createdAt','DESC']],
        })
        if (!leads.length) break
        for (const lead of leads) {
          if (!lead?.email) continue
          const raw = lead.rawData || {}
          const effectiveTemplates = buildEffectiveCrmTemplates(lead, templatesByOrg)
          for (const tpl of effectiveTemplates) {
            if (!tpl?.enabled) continue
            const trigger = resolveCrmTrigger(tpl)
            if (!trigger) continue
            const { subject, html } = buildCrmEmail(lead, tpl)
            try {
              const { due, sentKey } = shouldSendCrmTemplate({ lead, tpl, trigger, today })
              if (!due || !sentKey || hasCrmSent(raw, sentKey)) continue
              await sendCrmAutomationEmail(lead, subject, html)
              await markCrmSent(lead, raw, sentKey)
            } catch (e) {
              console.error('[CRM] automation email failed', e?.message)
            }
          }
        }
        offset += leads.length
        if (leads.length < batchSize) break
      }
    } catch (e) {
      console.error('[CRM] automation tick error', e?.message);
    }
  });
};

const PATIENT_JOURNEY_PRE_APPT_GROUPS = new Set([
  'new_patient_booking',
  'composite_bonding',
  'invisalign',
  'check_up',
  'implant',
  'teeth_whitening',
])
const PATIENT_JOURNEY_POST_APPT_GROUPS = new Set([
  'appointment_follow_up',
  'patient_cancelled_appointment',
  'patient_no_show_follow_up',
  'post_treatment_check_in',
  'referral_automation',
  'social_review_campaigns',
])
const TREATMENT_KEYWORDS_BY_GROUP = {
  composite_bonding: ['composite bonding', 'bonding'],
  invisalign: ['invisalign'],
  check_up: ['check', 'check-up', 'checkup', 'exam', 'examination'],
  implant: ['implant'],
  teeth_whitening: ['whitening', 'teeth whitening'],
}

const extractSubjectAndBody = (template) => {
  const raw = String(template || '')
  const subjectMatch = raw.match(/<strong>Subject:<\/strong>\s*([^<]+)<\/p>/i)
  const subject = subjectMatch ? subjectMatch[1].trim() : ''
  const body = subjectMatch
    ? raw.replace(subjectMatch[0], '').trim()
    : raw
  return { subject, body }
}


const matchesTreatment = (appointment, keywords = []) => {
  const hay = `${appointment?.treatmentName || ''} ${appointment?.notes || ''}`.toLowerCase()
  return keywords.length ? keywords.some((k) => hay.includes(k)) : true
}

const statusEquals = (status, targets = []) => {
  const s = String(status || '').toLowerCase()
  return targets.some((t) => s === String(t).toLowerCase())
}

const hasPatientSent = (patient, key) => {
  const raw = patient?.rawData || {}
  return !!(raw?.automationSentKeys && raw.automationSentKeys[key])
}

const markPatientSent = async (patient, key) => {
  const raw = patient?.rawData || {}
  const map = { ...(raw.automationSentKeys || {}) }
  map[key] = new Date().toISOString()
  patient.rawData = { ...raw, automationSentKeys: map }
  await patient.save()
}

export const startPatientJourneyAutomationScheduler = () => {
  const minutes = Number(process.env.PATIENT_JOURNEY_AUTOMATION_MINUTES || 60)
  const pattern = minutes > 0 ? `*/${minutes} * * * *` : null
  if (!pattern) return

  cron.schedule(pattern, async () => {
    try {
      try {
        await PatientAutomationTemplate.sync()
      } catch {}
      const templates = await PatientAutomationTemplate.findAll({ where: { enabled: true } })
      if (!templates.length) return

      const orgIds = [...new Set(templates.map((t) => Number(t.organisationId)).filter(Boolean))]
      if (!orgIds.length) return
      const organisations = await Organisation.findAll({ where: { id: orgIds } })
      const orgMap = new Map(organisations.map((o) => [Number(o.id), o]))

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayYmd = formatYmd(today)

      const maxOffset = Math.max(
        0,
        ...templates
          .map((t) => parseDayOffsetFromText(t.sending))
          .filter((n) => Number.isFinite(n))
      )
      const rangeStart = addDaysSafe(today, -(maxOffset + 7))
      const rangeEnd = addDaysSafe(today, maxOffset + 7)

      const templatesByOrg = new Map()
      templates.forEach((tpl) => {
        const key = Number(tpl.organisationId)
        const list = templatesByOrg.get(key) || []
        list.push(tpl)
        templatesByOrg.set(key, list)
      })

      for (const [orgId, orgTemplates] of templatesByOrg.entries()) {
        const organisation = orgMap.get(Number(orgId))
        const patients = await DiaryPatient.findAll({
          where: {
            organisationId: Number(orgId),
            email: { [Op.ne]: null },
            [Op.or]: [{ receiveEmail: true }, { receiveEmail: null }],
          },
        })
        const patientMap = new Map(patients.map((p) => [Number(p.id), p]))
        const appointments = await DiaryAppointment.findAll({
          where: {
            organisationId: Number(orgId),
            startTime: { [Op.between]: [rangeStart, rangeEnd] },
          },
        })
        for (const tpl of orgTemplates) {
          const targetPatients = tpl.patientId
            ? patients.filter((p) => Number(p.id) === Number(tpl.patientId))
            : patients
          if (tpl.patientId && !targetPatients.length) continue
          const targetAppointments = tpl.patientId
            ? appointments.filter((a) => Number(a.patientId) === Number(tpl.patientId))
            : appointments
          const dayOffset = parseDayOffsetFromText(tpl.sending)
          if (!dayOffset) continue
          const offsetDays = Math.max(0, dayOffset - 1)
          const { subject: subjectRaw, body: bodyRaw } = extractSubjectAndBody(tpl.template || '')
          const baseSubject = subjectRaw || tpl.name || 'Patient update'

          if (PATIENT_JOURNEY_PRE_APPT_GROUPS.has(tpl.groupKey)) {
            const keywords = TREATMENT_KEYWORDS_BY_GROUP[tpl.groupKey] || []
            for (const appt of targetAppointments) {
              if (!matchesTreatment(appt, keywords)) continue
              const triggerDate = addDaysSafe(appt.createdAt || appt.startTime, offsetDays)
              if (formatYmd(triggerDate) !== todayYmd) continue
              const patient = patientMap.get(Number(appt.patientId))
              if (!patient?.email) continue
              const key = `${tpl.key}:${tpl.groupKey}:${appt.id || ''}:${todayYmd}`
              if (hasPatientSent(patient, key)) continue
              const ctx = {
                firstName: patient.firstName,
                practiceName: organisation?.name,
                practicePhone: organisation?.contact,
                practiceAddress: [organisation?.address, organisation?.postalCode].filter(Boolean).join(', '),
                dateTime: `${formatYmd(appt.startTime)} ${appt.startTime ? appt.startTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''}`.trim(),
                appointmentDate: formatYmd(appt.startTime),
                appointmentTime: appt.startTime ? appt.startTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '',
              }
              const subject = renderPatientTokens(baseSubject, ctx)
              const html = renderPatientTokens(bodyRaw, ctx)
              const wrap = (inner) => EMAIL_TEMPLATE.replaceAll('{subject}', subject).replace('{content}', inner)
              await transporter.sendMail({
                to: patient.email,
                from: process.env.MAIL_FROM || 'helloflossly@gmail.com',
                subject,
                html: wrap(html),
              })
              await markPatientSent(patient, key)
            }
          } else if (tpl.groupKey === 'recalls_reactivation') {
            for (const patient of targetPatients) {
              const recallDate = tpl.key.includes('hygiene')
                ? patient.nextHygienistRecall
                : patient.nextDentistRecall
              if (!recallDate) continue
              const triggerDate = addDaysSafe(recallDate, offsetDays)
              if (formatYmd(triggerDate) !== todayYmd) continue
              const key = `${tpl.key}:${tpl.groupKey}::${todayYmd}`
              if (hasPatientSent(patient, key)) continue
              const ctx = {
                firstName: patient.firstName,
                practiceName: organisation?.name,
                practicePhone: organisation?.contact,
                practiceAddress: [organisation?.address, organisation?.postalCode].filter(Boolean).join(', '),
                appointmentDate: formatYmd(recallDate),
              }
              const subject = renderPatientTokens(baseSubject, ctx)
              const html = renderPatientTokens(bodyRaw, ctx)
              const wrap = (inner) => EMAIL_TEMPLATE.replaceAll('{subject}', subject).replace('{content}', inner)
              await transporter.sendMail({
                to: patient.email,
                from: process.env.MAIL_FROM || 'helloflossly@gmail.com',
                subject,
                html: wrap(html),
              })
              await markPatientSent(patient, key)
            }
          } else if (tpl.groupKey === 'birthday_anniversary') {
            for (const patient of targetPatients) {
              if (!patient.dob) continue
              const dob = new Date(patient.dob)
              if (Number.isNaN(dob.getTime())) continue
              const base = new Date(today.getFullYear(), dob.getMonth(), dob.getDate())
              const triggerDate = addDaysSafe(base, offsetDays)
              if (formatYmd(triggerDate) !== todayYmd) continue
              const key = `${tpl.key}:${tpl.groupKey}::${todayYmd}`
              if (hasPatientSent(patient, key)) continue
              const ctx = {
                firstName: patient.firstName,
                practiceName: organisation?.name,
                practicePhone: organisation?.contact,
                practiceAddress: [organisation?.address, organisation?.postalCode].filter(Boolean).join(', '),
              }
              const subject = renderPatientTokens(baseSubject, ctx)
              const html = renderPatientTokens(bodyRaw, ctx)
              const wrap = (inner) => EMAIL_TEMPLATE.replaceAll('{subject}', subject).replace('{content}', inner)
              await transporter.sendMail({
                to: patient.email,
                from: process.env.MAIL_FROM || 'helloflossly@gmail.com',
                subject,
                html: wrap(html),
              })
              await markPatientSent(patient, key)
            }
          } else if (PATIENT_JOURNEY_POST_APPT_GROUPS.has(tpl.groupKey)) {
            for (const appt of targetAppointments) {
              if (!appt?.patientId) continue
              const patient = patientMap.get(Number(appt.patientId))
              if (!patient?.email) continue
              const apptStatus = appt.status || ''
              if (tpl.groupKey === 'patient_cancelled_appointment' && !statusEquals(apptStatus, ['Cancelled'])) continue
              if (tpl.groupKey === 'patient_no_show_follow_up' && !statusEquals(apptStatus, ['Did not attend', 'No Show', 'No show'])) continue
              if (['appointment_follow_up', 'post_treatment_check_in', 'referral_automation', 'social_review_campaigns'].includes(tpl.groupKey)) {
                if (statusEquals(apptStatus, ['Cancelled'])) continue
              }
              const triggerDate = addDaysSafe(appt.startTime, offsetDays)
              if (formatYmd(triggerDate) !== todayYmd) continue
              const key = `${tpl.key}:${tpl.groupKey}:${appt.id || ''}:${todayYmd}`
              if (hasPatientSent(patient, key)) continue
              const ctx = {
                firstName: patient.firstName,
                practiceName: organisation?.name,
                practicePhone: organisation?.contact,
                practiceAddress: [organisation?.address, organisation?.postalCode].filter(Boolean).join(', '),
                dateTime: `${formatYmd(appt.startTime)} ${appt.startTime ? appt.startTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''}`.trim(),
                appointmentDate: formatYmd(appt.startTime),
                appointmentTime: appt.startTime ? appt.startTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '',
              }
              const subject = renderPatientTokens(baseSubject, ctx)
              const html = renderPatientTokens(bodyRaw, ctx)
              const wrap = (inner) => EMAIL_TEMPLATE.replaceAll('{subject}', subject).replace('{content}', inner)
              await transporter.sendMail({
                to: patient.email,
                from: process.env.MAIL_FROM || 'helloflossly@gmail.com',
                subject,
                html: wrap(html),
              })
              await markPatientSent(patient, key)
            }
          }
        }
      }
    } catch (e) {
      console.error('[PatientJourney] automation tick error', e?.message)
    }
  })
}

import { sendTaskDueReminderEmail } from './emailNotifications.js'

export const startTaskOverDueScheduler = () => {
  // Run every night at 12 AM (server time)
  cron.schedule("0 0 * * *", async () => {
    try {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const statuses = await OrganisationStatus.findAll({
        where: {
          key: { [Op.in]: ["overdue", "completed"] },
          status: "Active",
        },
        attributes: ["id", "key", "organisationId"],
      });

      const statusByOrg = new Map();
      statuses.forEach((status) => {
        const orgId = Number(status.organisationId);
        if (!orgId) return;
        const entry = statusByOrg.get(orgId) || {};
        if (status.key === "overdue" && !entry.overdueId) entry.overdueId = status.id;
        if (status.key === "completed" && !entry.completedId) entry.completedId = status.id;
        statusByOrg.set(orgId, entry);
      });

      if (!statusByOrg.size) {
        console.error("Overdue status not found in OrganisationStatuses table.");
        return;
      }

      let totalUpdated = 0;
      for (const [orgId, ids] of statusByOrg.entries()) {
        if (!ids?.overdueId) continue;
        const excludedStatusIds = [ids.overdueId, ids.completedId].filter(Boolean);
        const [updated] = await UserTask.update(
          { statusId: ids.overdueId },
          {
            where: {
              organisationId: orgId,
              isArchieved: false,
              dueDate: { [Op.lt]: startOfToday },
              statusId: { [Op.notIn]: excludedStatusIds },
            },
          }
        );
        totalUpdated += Number(updated) || 0;
      }

      if (totalUpdated === 0) {
        console.log("No overdue tasks found today.");
        return;
      }

      console.log(`${totalUpdated} tasks marked as overdue.`);
    } catch (err) {
      console.error("Error in overdue scheduler:", err);
    }
  });
};

export const startTaskDueReminderScheduler = () => {
  // Run every night at 12 AM server time (same as overdue scheduler window)
  cron.schedule("0 0 * * *", async () => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const startOfTomorrow = new Date(tomorrow);
      startOfTomorrow.setHours(0, 0, 0, 0);
      const endOfTomorrow = new Date(tomorrow);
      endOfTomorrow.setHours(23, 59, 59, 999);

      const dueTomorrowTasks = await UserTask.findAll({
        where: {
          dueDate: { [Op.between]: [startOfTomorrow, endOfTomorrow] },
        },
        include: [
          {
            model: User,
            as: "assignedUser",
            attributes: ["id", "fullName", "email"],
          },
          {
            model: Task,
            as: "taskDetails",
            attributes: ["title"],
          },
        ],
      });

      for (const ut of dueTomorrowTasks) {
        const assignee = ut.assignedUser;
        if (assignee?.email) {
          const formattedDue = ut.dueDate
            ? new Date(ut.dueDate).toLocaleDateString("en-GB")
            : "";
          await sendTaskDueReminderEmail({
            email: assignee.email,
            name: assignee.fullName,
            taskTitle: ut.taskDetails?.title || ut.title || "Task",
            dueDate: formattedDue,
          });
        }
      }
    } catch (err) {
      console.error("Error in due reminder scheduler:", err);
    }
  });
};

export const startOnboardingScheduler = () => {
  const pattern = process.env.ONBOARDING_EMAIL_SCHEDULE || "0 6 * * *";
  if (!pattern) return;
  cron.schedule(pattern, async () => {
    try {
      await ensureOnboardingEventsTable();
      const startEvents = await OnboardingEvent.findAll({
        where: { key: "onboarding_start" },
      });
      if (!startEvents.length) return;

      const userIds = [...new Set(startEvents.map((evt) => evt.userId))];
      const orgIds = [...new Set(startEvents.map((evt) => evt.organisationId))];

      const [users, organisations, preferences] = await Promise.all([
        User.findAll({
          where: { id: userIds },
          attributes: ["id", "fullName", "email", "status"],
        }),
        Organisation.findAll({ where: { id: orgIds } }),
        UserPreference.findAll({ where: { userId: userIds, organisationId: orgIds } }),
      ]);

      const usersById = new Map(users.map((u) => [Number(u.id), u]));
      const orgById = new Map(organisations.map((o) => [Number(o.id), o]));
      const prefByKey = new Map(
        preferences.map((p) => [`${p.userId}:${p.organisationId}`, p])
      );

      const emailKeys = ONBOARDING_EMAIL_TEMPLATES.map((t) => t.key);
      const existing = await OnboardingEvent.findAll({
        where: {
          userId: userIds,
          organisationId: orgIds,
          key: { [Op.in]: emailKeys },
        },
      });
      const sentKeys = new Set(
        existing.map((evt) => `${evt.userId}:${evt.organisationId}:${evt.key}`)
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const runtimeConfig = useRuntimeConfig();

      for (const evt of startEvents) {
        const user = usersById.get(Number(evt.userId));
        if (!user?.email) continue;
        if (user.status && user.status !== "Active") continue;
        const org = orgById.get(Number(evt.organisationId));
        const pref = prefByKey.get(`${evt.userId}:${evt.organisationId}`);

        const diffDays = getDiffDaysFromStart(evt.createdAt, today);
        if (!Number.isFinite(diffDays) || diffDays < 0) continue;

        let metrics = null;
        if (diffDays === 7 || diffDays === 13) {
          metrics = await getOnboardingMetrics(evt.organisationId);
        }

        const ctx = buildOnboardingContext({
          user,
          organisation: org,
          userPreference: pref,
          metrics,
          config: runtimeConfig,
          startAt: evt.createdAt,
        });

        for (const tpl of ONBOARDING_EMAIL_TEMPLATES) {
          if (tpl.offsetDays !== diffDays) continue;
          const sentKey = `${evt.userId}:${evt.organisationId}:${tpl.key}`;
          if (sentKeys.has(sentKey)) continue;

          try {
            await sendOnboardingEmail({
              key: tpl.key,
              to: user.email,
              ctx,
            });
            await recordOnboardingEvent({
              userId: evt.userId,
              organisationId: evt.organisationId,
              key: tpl.key,
              payload: { sentAt: new Date().toISOString() },
            });
            sentKeys.add(sentKey);
          } catch (err) {
            console.error("[Onboarding] email send failed", err?.message);
          }
        }
      }
    } catch (err) {
      console.error("[Onboarding] scheduler error", err?.message);
    }
  });
};

