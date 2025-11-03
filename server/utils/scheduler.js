import cron from "node-cron";
import { OrganisationStatus, UserTask } from "../models/index.js";

const frequencyMap = {
  Daily: "0 0 * * *", // every day at midnight
  Weekly: "0 0 * * 1", // every Monday
  Fortnightly: "0 0 */14 * *", // every 14 days
  Monthly: "0 0 1 * *", // first day of month
  "6 Monthly": "0 0 1 */6 *", // first day every 6 months
  Annualy: "0 0 1 1 *", // Jan 1st every year
  "Every 24 Months": "0 0 1 1 */2", // Jan 1st every 2 years
};

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export const startTaskScheduler = () => {
  Object.keys(frequencyMap).forEach((frequency) => {
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
            case "Annualy":
              nextDueDate = addDays(new Date(), 365);
              break;
            case "Every 24 Months":
              nextDueDate = addDays(new Date(), 730);
              break;
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
      
      for (const tpl of templates) {
        const orgLeads = leads.filter(l => Number(l.organisationId) === Number(tpl.organisationId))
        for (const lead of orgLeads) {
          if (!lead?.email) continue
          const raw = lead.rawData || {}
          const name = lead.name || 'there'
          const subject = tpl.name || 'Message from Flossly'
          const html = (tpl.template || '').replaceAll('{{name}}', name).replaceAll('{{email}}', lead.email)
          try {
            if (tpl.key === 'welcome_email') {
              if (!raw.automationWelcomeSent) {
                await transporter.sendMail({ to: lead.email, from: process.env.MAIL_FROM || 'helloflossly@gmail.com', subject, html })
                lead.rawData = { ...raw, automationWelcomeSent: true }
                await lead.save()
              }
            } else if (tpl.key === 'birthday') {
              if (lead.dob) {
                const dob = new Date(lead.dob)
                const md = `${String(dob.getMonth()+1).padStart(2,'0')}-${String(dob.getDate()).padStart(2,'0')}`
                const yearKey = String(today.getFullYear())
                if (md === todayMD && raw.automationBirthdaySentYear !== yearKey) {
                  await transporter.sendMail({ to: lead.email, from: process.env.MAIL_FROM || 'helloflossly@gmail.com', subject, html })
                  lead.rawData = { ...raw, automationBirthdaySentYear: yearKey }
                  await lead.save()
                }
              }
            } else if (tpl.key === 'followup') {
              const inquiry = lead.inquiryDate ? new Date(lead.inquiryDate) : null
              if (inquiry && (today - inquiry) > 30*24*60*60*1000 && !raw.automationFollowupSent) {
                await transporter.sendMail({ to: lead.email, from: process.env.MAIL_FROM || 'helloflossly@gmail.com', subject, html })
                lead.rawData = { ...raw, automationFollowupSent: true }
                await lead.save()
              }
            } else if (tpl.key === 'inactive_lead') {
              const updatedAt = new Date(lead.updatedAt)
              if ((today - updatedAt) > 14*24*60*60*1000 && !raw.automationInactiveSent) {
                await transporter.sendMail({ to: lead.email, from: process.env.MAIL_FROM || 'helloflossly@gmail.com', subject, html })
                lead.rawData = { ...raw, automationInactiveSent: true }
                await lead.save()
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
