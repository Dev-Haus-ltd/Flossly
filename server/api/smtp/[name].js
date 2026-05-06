import {
  getSmtpSettings,
  saveSmtpSettings,
  testSmtpConnection,
  deleteSmtpSettings,
} from "~/server/controllers/smtp";

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, "name");
  switch (path) {
    case "get":
      return await getSmtpSettings(event);
    case "save":
      return await saveSmtpSettings(event);
    case "test":
      return await testSmtpConnection(event);
    case "delete":
      return await deleteSmtpSettings(event);
    default:
      return { code: 0, error: "Not found" };
  }
});
