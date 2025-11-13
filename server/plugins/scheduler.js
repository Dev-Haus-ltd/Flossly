import { startTaskScheduler, startLeadAutomationScheduler, startTaskOverDueScheduler } from "../utils/scheduler";

export default defineNitroPlugin(async (nitroApp) => {
  try {
    startTaskScheduler();
    startLeadAutomationScheduler();
    startTaskOverDueScheduler();
    console.log("Scheduler Started");
  } catch (error) {
    console.error("Unable to start scheduler", error);
  } finally {
  }
});
