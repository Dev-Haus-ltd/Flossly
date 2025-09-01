export default defineNitroPlugin(async (nitroApp) => {
  try {
    startTaskScheduler();
    console.log("Scheduler Started");
  } catch (error) {
    console.error("Unable to start scheduler", error);
  } finally {
  }
});
