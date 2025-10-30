import cron from "node-cron";
import { OrganisationStatus, UserTask } from "../models/index.js";

const frequencyMap = {
  Daily: "0 0 * * *", // every day at midnight
  Weekly: "0 0 * * 1", // every Monday
  Fortnightly: "0 0 */14 * *", // every 14 days
  Monthly: "0 0 1 * *", // first day of month
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

import { CrmLead } from "../models/index.js";
import { transporter } from "./nodeMailer.js";

export const startLeadAutomationScheduler = () => {
  const minutes = Number(process.env.CRM_LEAD_AUTOMATION_MINUTES || 2);
  const pattern = minutes > 0 ? `*/${minutes} * * * *` : null;
  if (!pattern) return;
  cron.schedule(pattern, async () => {
    try {
      const leads = await CrmLead.findAll({ where: { softDeleted: false }, limit: 25, order: [['createdAt','DESC']] });
      for (const lead of leads) {
        if (!lead?.email) continue;
        const raw = lead.rawData || {};
        if (raw.automationWelcomeSent) continue; 
        try {
          await transporter.sendMail({
            to: lead.email,
            from: process.env.MAIL_FROM || 'helloflossly@gmail.com',
            subject: 'Welcome to Our Practice',
            html: `<p>Hi ${lead.name || 'there'},</p><p>Thanks for your interest. We will contact you soon.</p>`,
          });
          lead.rawData = { ...raw, automationWelcomeSent: true };
          await lead.save();
        } catch (e) {
          console.error('[CRM] automation email failed', e?.message);
        }
      }
    } catch (e) {
      console.error('[CRM] automation tick error', e?.message);
    }
  });
};
