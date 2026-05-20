import { listDmConversations, listDmMessages, sendDmMessage, markDmRead, processDmQueue, uploadDmAttachment, refreshDmProfile, refreshAllDmProfiles, getDmConnectionStatus, deleteDmConversation } from "../../controllers/dms";

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, "name");
  // Meta DMs (Messenger + Instagram) are available on all plans — no feature gate here.
  // WhatsApp Business messaging is gated separately in server/api/whapi/[name].js.

  switch (name) {
    case "conversations":
      return await listDmConversations(event);
    case "messages":
      return await listDmMessages(event);
    case "send":
      return await sendDmMessage(event);
    case "read":
      return await markDmRead(event);
    case "deleteConversation":
      return await deleteDmConversation(event);
    case "processQueue":
      return await processDmQueue(event);
    case "status":
      return await getDmConnectionStatus(event);
    case "uploadAttachment":
      return await uploadDmAttachment(event);
    case "refreshProfile":
      return await refreshDmProfile(event);
    case "refreshAllProfiles":
      return await refreshAllDmProfiles(event);
    default:
      return { code: 0, error: "Not found" };
  }
});
