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
