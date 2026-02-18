import { webhook, connect, qr, status, disconnect, deleteChannel, extendChannel } from "../../controllers/whapi";

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
    case "disconnect":
      return await disconnect(event);
    case "delete":
      return await deleteChannel(event);
    case "extend":
      return await extendChannel(event);
    default:
      return { code: 0, error: "Not found" };
  }
});
