import { startTaskScheduler, startLeadAutomationScheduler } from "../utils/scheduler";

export default defineNitroPlugin(async (nitroApp) => {
  try {
    startTaskScheduler();
    startLeadAutomationScheduler();
    console.log("Scheduler Started");
  } catch (error) {
    console.error("Unable to start scheduler", error);
  } finally {
  }
});
