import { listDmConversations, listDmMessages, sendDmMessage, markDmRead, processDmQueue } from "../../controllers/dms";

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, "name");
  switch (name) {
    case "conversations":
      return await listDmConversations(event);
    case "messages":
      return await listDmMessages(event);
    case "send":
      return await sendDmMessage(event);
    case "read":
      return await markDmRead(event);
    case "processQueue":
      return await processDmQueue(event);
    default:
      return { code: 0, error: "Not found" };
  }
});
