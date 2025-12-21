import cron from "node-cron";
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
} from "../models/index.js";

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

import { transporter } from "./nodeMailer.js";
import { template as EMAIL_TEMPLATE } from './emailTemplate.js'
import { buildLeadContext, renderTokens } from './tokenRenderer.js'

export const startLeadAutomationScheduler = () => {
  const minutes = Number(process.env.CRM_LEAD_AUTOMATION_MINUTES || 10);
  const pattern = minutes > 0 ? `*/${minutes} * * * *` : null;
  if (!pattern) return;
  cron.schedule(pattern, async () => {
    try {
      try { await CrmAutomationTemplate.sync() } catch {}
      // Load enabled templates for all orgs
      const templates = await CrmAutomationTemplate.findAll({ where: { enabled: true } })
      if (!templates.length) return
      const leads = await CrmLead.findAll({ where: { softDeleted: false }, limit: 200, order: [['createdAt','DESC']] });
      const today = new Date()
      const todayMD = `${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
      
      // Helpers for dedupe and timing
      const hasSent = (raw, key) => !!(raw?.automationSentKeys && raw.automationSentKeys[key])
      const markSent = async (lead, raw, key) => {
        const map = { ...(raw.automationSentKeys || {}) }
        map[key] = new Date().toISOString()
        lead.rawData = { ...raw, automationSentKeys: map }
        await lead.save()
      }
      const daysSince = (date) => {
        if (!date) return null
        const d = (date instanceof Date) ? date : new Date(date)
        return Math.floor((today - d) / (24*60*60*1000))
      }
      const treatmentMatches = (lead, keywords = []) => {
        const t = (lead?.treatment || '').toString().toLowerCase()
        if (!t) return false
        return keywords.some(k => t.includes(k.toLowerCase()))
      }
      const getBlackFriday = (year) => {
        // Black Friday: day after the fourth Thursday in November
        let thursdays = 0
        for (let d = 1; d <= 30; d++) {
          const dt = new Date(year, 10, d)
          if (dt.getDay() === 4) { // Thursday
            thursdays++
            if (thursdays === 4) {
              const thanksgiving = dt
              const bf = new Date(thanksgiving)
              bf.setDate(thanksgiving.getDate() + 1)
              return bf
            }
          }
        }
        // Fallback: 4th Friday
        let fridays = 0
        for (let d = 1; d <= 30; d++) {
          const dt = new Date(year, 10, d)
          if (dt.getDay() === 5) { // Friday
            fridays++
            if (fridays === 4) return dt
          }
        }
        return new Date(year, 10, 29)
      }
      
      for (const tpl of templates) {
        const orgLeads = leads.filter(l => Number(l.organisationId) === Number(tpl.organisationId))
        for (const lead of orgLeads) {
          if (!lead?.email) continue
          const raw = lead.rawData || {}
          const fullName = lead.name || 'there'
          const firstName = (fullName.split(' ')[0]) || 'there'
          const baseSubject = tpl.name || 'Message from Flossly'
          const ctx = buildLeadContext({ lead, userName: 'Team' })
          const subject = renderTokens(baseSubject, ctx)
          const html = renderTokens(tpl.template || '', ctx)
          const wrap = (inner) => EMAIL_TEMPLATE.replaceAll('{subject}', subject).replace('{content}', inner)
          try {
            if (tpl.key === 'welcome_email') {
              if (!raw.automationWelcomeSent) {
                await transporter.sendMail({ to: lead.email, from: process.env.MAIL_FROM || 'helloflossly@gmail.com', subject, html: wrap(html) })
                lead.rawData = { ...raw, automationWelcomeSent: true }
                await lead.save()
              }
            } else if (tpl.key === 'birthday') {
              if (lead.dob) {
                const dob = new Date(lead.dob)
                const md = `${String(dob.getMonth()+1).padStart(2,'0')}-${String(dob.getDate()).padStart(2,'0')}`
                const yearKey = String(today.getFullYear())
                if (md === todayMD && raw.automationBirthdaySentYear !== yearKey) {
                  await transporter.sendMail({ to: lead.email, from: process.env.MAIL_FROM || 'helloflossly@gmail.com', subject, html: wrap(html) })
                  lead.rawData = { ...raw, automationBirthdaySentYear: yearKey }
                  await lead.save()
                }
              }
            } else if (tpl.key === 'followup') {
              const inquiry = lead.inquiryDate ? new Date(lead.inquiryDate) : null
              if (inquiry && (today - inquiry) > 30*24*60*60*1000 && !raw.automationFollowupSent) {
                await transporter.sendMail({ to: lead.email, from: process.env.MAIL_FROM || 'helloflossly@gmail.com', subject, html: wrap(html) })
                lead.rawData = { ...raw, automationFollowupSent: true }
                await lead.save()
              }
            } else if (tpl.key === 'inactive_lead') {
              const updatedAt = new Date(lead.updatedAt)
              if ((today - updatedAt) > 14*24*60*60*1000 && !raw.automationInactiveSent) {
                await transporter.sendMail({ to: lead.email, from: process.env.MAIL_FROM || 'helloflossly@gmail.com', subject, html: wrap(html) })
                lead.rawData = { ...raw, automationInactiveSent: true }
                await lead.save()
              }
            // New Patient Enquiry
            } else if (['new_patient_enquiry_immediate','new_patient_enquiry_1_day','new_patient_enquiry_3_days'].includes(tpl.key)) {
              const inquiry = lead.inquiryDate ? new Date(lead.inquiryDate) : null
              if (!inquiry) { /* skip if no inquiry date */ }
              else {
                const d = daysSince(inquiry)
                const due = { new_patient_enquiry_immediate: 0, new_patient_enquiry_1_day: 1, new_patient_enquiry_3_days: 3 }[tpl.key]
                if (d !== null && d >= due && !hasSent(raw, tpl.key)) {
                await transporter.sendMail({ to: lead.email, from: process.env.MAIL_FROM || 'helloflossly@gmail.com', subject, html: wrap(html) })
                  await markSent(lead, raw, tpl.key)
                }
              }
            // Composite Bonding
            } else if (['bonding_immediate','bonding_3_days','bonding_7_days'].includes(tpl.key)) {
              if (!treatmentMatches(lead, ['composite bonding'])) { /* skip */ }
              else {
                const inquiry = lead.inquiryDate ? new Date(lead.inquiryDate) : null
                if (inquiry) {
                  const d = daysSince(inquiry)
                  const due = { bonding_immediate: 0, bonding_3_days: 3, bonding_7_days: 7 }[tpl.key]
                  if (d !== null && d >= due && !hasSent(raw, tpl.key)) {
                await transporter.sendMail({ to: lead.email, from: process.env.MAIL_FROM || 'helloflossly@gmail.com', subject, html: wrap(html) })
                    await markSent(lead, raw, tpl.key)
                  }
                }
              }
            // Teeth Whitening
            } else if (['whitening_immediate','whitening_2_days','whitening_5_days'].includes(tpl.key)) {
              if (!treatmentMatches(lead, ['whitening','teeth whitening'])) { /* skip */ }
              else {
                const inquiry = lead.inquiryDate ? new Date(lead.inquiryDate) : null
                if (inquiry) {
                  const d = daysSince(inquiry)
                  const due = { whitening_immediate: 0, whitening_2_days: 2, whitening_5_days: 5 }[tpl.key]
                  if (d !== null && d >= due && !hasSent(raw, tpl.key)) {
                    await transporter.sendMail({ to: lead.email, from: process.env.MAIL_FROM || 'helloflossly@gmail.com', subject, html: wrap(html) })
                    await markSent(lead, raw, tpl.key)
                  }
                }
              }
            // Dental Examination
            } else if (['exam_immediate','exam_3_days','exam_7_days'].includes(tpl.key)) {
              // Apply when treatment hints exam
              const isExam = treatmentMatches(lead, ['exam','examination','checkup','check-up','dental exam','dental examination'])
              if (isExam) {
                const inquiry = lead.inquiryDate ? new Date(lead.inquiryDate) : null
                if (inquiry) {
                  const d = daysSince(inquiry)
                  const due = { exam_immediate: 0, exam_3_days: 3, exam_7_days: 7 }[tpl.key]
                  if (d !== null && d >= due && !hasSent(raw, tpl.key)) {
                    await transporter.sendMail({ to: lead.email, from: process.env.MAIL_FROM || 'helloflossly@gmail.com', subject, html: wrap(html) })
                    await markSent(lead, raw, tpl.key)
                  }
                }
              }
            // Birthday Reminder 20 days after birthday
            } else if (tpl.key === 'birthday_reminder_20_days') {
              if (lead.dob) {
                const year = today.getFullYear()
                const dob = new Date(lead.dob)
                const thisYearDob = new Date(year, dob.getMonth(), dob.getDate())
                const reminder = new Date(thisYearDob)
                reminder.setDate(reminder.getDate() + 20)
                const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
                const key = `${tpl.key}_${year}`
                if (ymd(today) === ymd(reminder) && !hasSent(raw, key)) {
                  await transporter.sendMail({ to: lead.email, from: process.env.MAIL_FROM || 'helloflossly@gmail.com', subject, html: wrap(html) })
                  await markSent(lead, raw, key)
                }
              }
            // Black Friday Campaign
            } else if (['black_friday_7_days_before','black_friday_launch','black_friday_last_chance'].includes(tpl.key)) {
              const year = today.getFullYear()
              const bf = getBlackFriday(year)
              const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
              const todayYmd = ymd(today)
              const key = `${tpl.key}_${year}`
              if (tpl.key === 'black_friday_7_days_before') {
                const sevenBefore = new Date(bf); sevenBefore.setDate(bf.getDate() - 7)
                if (todayYmd === ymd(sevenBefore) && !hasSent(raw, key)) {
                  await transporter.sendMail({ to: lead.email, from: process.env.MAIL_FROM || 'helloflossly@gmail.com', subject, html: wrap(html) })
                  await markSent(lead, raw, key)
                }
              } else if (tpl.key === 'black_friday_launch') {
                if (todayYmd === ymd(bf) && !hasSent(raw, key)) {
                  await transporter.sendMail({ to: lead.email, from: process.env.MAIL_FROM || 'helloflossly@gmail.com', subject, html: wrap(html) })
                  await markSent(lead, raw, key)
                }
              } else if (tpl.key === 'black_friday_last_chance') {
                if (todayYmd === ymd(bf) && today.getHours() >= 18 && !hasSent(raw, key)) {
                  await transporter.sendMail({ to: lead.email, from: process.env.MAIL_FROM || 'helloflossly@gmail.com', subject, html: wrap(html) })
                  await markSent(lead, raw, key)
                }
              }
            }
          } catch (e) {
            console.error('[CRM] automation email failed', e?.message)
          }
        }
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

const parseDayOffset = (sending) => {
  const match = String(sending || '').match(/day\s*(\d+)/i)
  if (!match) return null
  const num = Number(match[1])
  return Number.isFinite(num) ? num : null
}

const toYmd = (value) => {
  if (!value) return null
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return null
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const addDaysSafe = (value, days) => {
  const base = value instanceof Date ? new Date(value) : new Date(value || Date.now())
  if (Number.isNaN(base.getTime())) return null
  base.setDate(base.getDate() + Number(days || 0))
  return base
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

const renderPatientTokens = (text, ctx) => {
  if (!text) return ''
  const tokens = {
    'First Name': ctx.firstName || 'there',
    'Practice Name': ctx.practiceName || 'your practice',
    'Practice Phone': ctx.practicePhone || '',
    'Practice Address': ctx.practiceAddress || '',
    'Date/Time': ctx.dateTime || '',
    'Appointment Date': ctx.appointmentDate || '',
    'Appointment Time': ctx.appointmentTime || '',
  }
  let out = String(text)
  Object.entries(tokens).forEach(([key, value]) => {
    const safe = value || ''
    const re = new RegExp(`\\[${key.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\]`, 'gi')
    out = out.replace(re, safe)
  })
  return out
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
      const todayYmd = toYmd(today)

      const maxOffset = Math.max(
        0,
        ...templates
          .map((t) => parseDayOffset(t.sending))
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
          const dayOffset = parseDayOffset(tpl.sending)
          if (!dayOffset) continue
          const offsetDays = Math.max(0, dayOffset - 1)
          const { subject: subjectRaw, body: bodyRaw } = extractSubjectAndBody(tpl.template || '')
          const baseSubject = subjectRaw || tpl.name || 'Patient update'

          if (PATIENT_JOURNEY_PRE_APPT_GROUPS.has(tpl.groupKey)) {
            const keywords = TREATMENT_KEYWORDS_BY_GROUP[tpl.groupKey] || []
            for (const appt of appointments) {
              if (!matchesTreatment(appt, keywords)) continue
              const triggerDate = addDaysSafe(appt.createdAt || appt.startTime, offsetDays)
              if (toYmd(triggerDate) !== todayYmd) continue
              const patient = patientMap.get(Number(appt.patientId))
              if (!patient?.email) continue
              const key = `${tpl.key}:${tpl.groupKey}:${appt.id || ''}:${todayYmd}`
              if (hasPatientSent(patient, key)) continue
              const ctx = {
                firstName: patient.firstName,
                practiceName: organisation?.name,
                practicePhone: organisation?.contact,
                practiceAddress: [organisation?.address, organisation?.postalCode].filter(Boolean).join(', '),
                dateTime: `${toYmd(appt.startTime)} ${appt.startTime ? appt.startTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''}`.trim(),
                appointmentDate: toYmd(appt.startTime),
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
            for (const patient of patients) {
              const recallDate = tpl.key.includes('hygiene')
                ? patient.nextHygienistRecall
                : patient.nextDentistRecall
              if (!recallDate) continue
              const triggerDate = addDaysSafe(recallDate, offsetDays)
              if (toYmd(triggerDate) !== todayYmd) continue
              const key = `${tpl.key}:${tpl.groupKey}::${todayYmd}`
              if (hasPatientSent(patient, key)) continue
              const ctx = {
                firstName: patient.firstName,
                practiceName: organisation?.name,
                practicePhone: organisation?.contact,
                practiceAddress: [organisation?.address, organisation?.postalCode].filter(Boolean).join(', '),
                appointmentDate: toYmd(recallDate),
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
            for (const patient of patients) {
              if (!patient.dob) continue
              const dob = new Date(patient.dob)
              if (Number.isNaN(dob.getTime())) continue
              const base = new Date(today.getFullYear(), dob.getMonth(), dob.getDate())
              const triggerDate = addDaysSafe(base, offsetDays)
              if (toYmd(triggerDate) !== todayYmd) continue
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
            for (const appt of appointments) {
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
              if (toYmd(triggerDate) !== todayYmd) continue
              const key = `${tpl.key}:${tpl.groupKey}:${appt.id || ''}:${todayYmd}`
              if (hasPatientSent(patient, key)) continue
              const ctx = {
                firstName: patient.firstName,
                practiceName: organisation?.name,
                practicePhone: organisation?.contact,
                practiceAddress: [organisation?.address, organisation?.postalCode].filter(Boolean).join(', '),
                dateTime: `${toYmd(appt.startTime)} ${appt.startTime ? appt.startTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''}`.trim(),
                appointmentDate: toYmd(appt.startTime),
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

import { Op } from 'sequelize'
import { sendTaskDueReminderEmail } from './emailNotifications.js'

export const startTaskOverDueScheduler = () => {
  // Run every night at 12 AM (server time)
  cron.schedule("0 0 * * *", async () => {
    try {
      const today = new Date();

      // Find the "overdue" status
      const overdueStatus = await OrganisationStatus.findOne({
        where: { key: "overdue", status: "Active" },
      });

      if (!overdueStatus) {
        console.error("❌ Overdue status not found in OrganisationStatuses table!");
        return;
      }

      // Find all overdue tasks (dueDate < today) that are not already overdue
      const overdueTasks = await UserTask.findAll({
        where: {
          dueDate: { [Op.lt]: today },
          statusId: { [Op.ne]: overdueStatus.id },
        },
      });

      if (overdueTasks.length === 0) {
        console.log("⏰ No overdue tasks found today.");
        return;
      }

      const taskIds = overdueTasks.map((t) => t.id);

      // Update tasks to "Overdue" status
      await UserTask.update(
        { statusId: overdueStatus.id },
        { where: { id: taskIds } }
      );

      console.log(`✅ ${taskIds.length} tasks marked as Overdue.`);

    } catch (err) {
      console.error("❌ Error in overdue scheduler:", err);
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
