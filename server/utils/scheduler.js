import cron from "node-cron";
import { OrganisationStatus, UserTask } from "../models/index.js";

const frequencyMap = {
  Daily: "0 0 * * *", // every day at midnight
  Weekly: "0 0 * * 1", // every Monday
  Biweekly: "0 0 */14 * *", // every 14 days
  Monthly: "0 0 1 * *", // first day of month
  Quarterly: "0 0 1 */3 *", // first day every 3 months
  Yearly: "0 0 1 1 *", // Jan 1st every year
  "Ad Hoc": null, // Ad Hoc tasks are not scheduled
};

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export const startTaskScheduler = () => {
  Object.keys(frequencyMap).forEach((frequency) => {
    // Skip scheduling for Ad Hoc tasks
    if (frequency === "Ad Hoc" || !frequencyMap[frequency]) return;
    
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
            case "Biweekly":
              nextDueDate = addDays(new Date(), 14);
              break;
            case "Monthly":
              nextDueDate = addDays(new Date(), 30);
              break;
            case "Quarterly":
              nextDueDate = addDays(new Date(), 90);
              break;
            case "Yearly":
              nextDueDate = addDays(new Date(), 365);
              break;
            case "Ad Hoc":
              // Ad Hoc tasks are not scheduled
              continue;
          }
          const statuses = await OrganisationStatus.findAll({
            where: { organisationId: task.organisationId },
          });
          await UserTask.create({
            userId: task.userId,
            taskId: task.taskId,
            organisationId: task.organisationId,
            statusId: statuses.find((x) => x.key === "panding").id,
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

import { CrmLead, CrmAutomationTemplate } from "../models/index.js";
import { transporter } from "./nodeMailer.js";
import { template as EMAIL_TEMPLATE } from './emailTemplate.js'
import { buildLeadContext, renderTokens } from './tokenRenderer.js'

export const startLeadAutomationScheduler = () => {
  const minutes = Number(process.env.CRM_LEAD_AUTOMATION_MINUTES || 2);
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
                    await transporter.sendMail({ to: lead.email, from: process.env.MAIL_FROM || 'helloflossly@gmail.com', subject, html })
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
                    await transporter.sendMail({ to: lead.email, from: process.env.MAIL_FROM || 'helloflossly@gmail.com', subject, html })
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
