import sequelize  from "../utils/db";
export default defineNitroPlugin(async (nitroApp) => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
     //await sequelize.sync({ alter: true });
     //console.log("Models synced successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  } finally {}
});
