import { startTaskScheduler, startLeadAutomationScheduler, startPatientJourneyAutomationScheduler, startTaskOverDueScheduler, startTaskDueReminderScheduler } from "../utils/scheduler";

export default defineNitroPlugin(async (nitroApp) => {
  try {
    // startTaskScheduler();
    startLeadAutomationScheduler();
    startPatientJourneyAutomationScheduler();
    startTaskOverDueScheduler();
    startTaskDueReminderScheduler();
    console.log("Scheduler Started");
  } catch (error) {
    console.error("Unable to start scheduler", error);
  } finally {
  }
});
