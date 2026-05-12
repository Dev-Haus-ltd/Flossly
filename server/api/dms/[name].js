import { listDmConversations, listDmMessages, sendDmMessage, markDmRead, processDmQueue, uploadDmAttachment, refreshDmProfile, refreshAllDmProfiles, getDmConnectionStatus } from "../../controllers/dms";

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
