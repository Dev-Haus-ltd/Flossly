import { webhook, connect, qr, status } from "../../controllers/whapi";

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, "name");
  switch (name) {
    case "webhook":
      return await webhook(event);
    case "connect":
      return await connect(event);
    case "qr":
      return await qr(event);
    case "status":
      return await status(event);
    default:
      return { code: 0, error: "Not found" };
  }
});
