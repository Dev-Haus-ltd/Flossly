import "../models";
import sequelize from "../utils/db";
import { seedCrmAutomationDictionary } from "../utils/seedCrmAutomationDictionary";
export default defineNitroPlugin(async (nitroApp) => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
    await seedCrmAutomationDictionary();
    console.log("CRM automation dictionary seeded.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  } finally {}
});
