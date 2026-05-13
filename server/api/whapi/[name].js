import { webhook, connect, qr, status, disconnect, deleteChannel, extendChannel, listChannels, stream, editMessage, deleteMessage, reactToMessage, sendMessage } from "../../controllers/whapi";
import { requireFeature } from "../../utils/requireFeature";
import { requirePaidWhatsApp } from "../../utils/requirePaidWhatsApp";

const WHATSAPP_WRITE_CASES = new Set([
  'connect', 'disconnect', 'delete', 'extend', 'editMessage', 'deleteMessage', 'reactToMessage',
])

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, "name");

  if (WHATSAPP_WRITE_CASES.has(name)) {
    await requireFeature(event, 'whatsapp')
    await requirePaidWhatsApp(event)
  }

  switch (name) {
    case "webhook":
      return await webhook(event);
    case "connect":
      return await connect(event);
    case "qr":
      return await qr(event);
    case "status":
      return await status(event);
    case "channels":
      return await listChannels(event);
    case "disconnect":
      return await disconnect(event);
    case "delete":
      return await deleteChannel(event);
    case "extend":
      return await extendChannel(event);
    case "stream":
      return await stream(event);
    case "editMessage":
      return await editMessage(event);
    case "deleteMessage":
      return await deleteMessage(event);
    case "reactToMessage":
      return await reactToMessage(event);
    case "sendMessage":
      return await sendMessage(event);
    default:
      return { code: 0, error: "Not found" };
  }
});
