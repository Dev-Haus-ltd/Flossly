import { QueryTypes } from "sequelize";
import sequelize from "../utils/db";
import {
  startTaskScheduler,
  startLeadAutomationScheduler,
  startPatientJourneyAutomationScheduler,
  startTaskOverDueScheduler,
  startTaskDueReminderScheduler,
  startOnboardingScheduler,
  startShiftReminderScheduler,
} from "../utils/scheduler";

const SCHEDULER_LOCK_KEY = 3482173901;

const tryAcquireSchedulerLock = async () => {
  try {
    const res = await sequelize.query(
      "SELECT pg_try_advisory_lock(:key) AS locked",
      { replacements: { key: SCHEDULER_LOCK_KEY }, type: QueryTypes.SELECT }
    );
    return !!res?.[0]?.locked;
  } catch (error) {
    console.error("Scheduler lock error", error);
    return false;
  }
};

export default defineNitroPlugin(async (nitroApp) => {
  try {
    const hasLock = await tryAcquireSchedulerLock();
    if (!hasLock) {
      console.log("Scheduler lock not acquired; skipping cron startup.");
      return;
    }
    // startTaskScheduler();
    startLeadAutomationScheduler();
    startPatientJourneyAutomationScheduler();
    startTaskOverDueScheduler();
    startTaskDueReminderScheduler();
    startOnboardingScheduler();
    startShiftReminderScheduler();
    console.log("Scheduler Started");
  } catch (error) {
    console.error("Unable to start scheduler", error);
  } finally {
  }
});
