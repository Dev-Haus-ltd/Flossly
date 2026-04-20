import { readBody, getRouterParam } from "h3";
import { success, error } from "../../../../utils/response";
import { CrmDmConversation } from "../../../../models";

export default defineEventHandler(async (event) => {
  const method = event.method;
  const conversationId = getRouterParam(event, "id");

  if (!conversationId) return error(400, "Conversation ID required");

  const { orgId } = event.context.user || {};
  if (!orgId) return error(401, "Unauthenticated");

  if (method === "PATCH") {
    try {
      const body = await readBody(event);
      const { autoReplyEnabled } = body || {};

      const conversation = await CrmDmConversation.findOne({
        where: { id: conversationId, organisationId: orgId },
      });

      if (!conversation) return error(404, "Conversation not found");

      if (typeof autoReplyEnabled === "boolean") {
        conversation.autoReplyEnabled = autoReplyEnabled;
        await conversation.save();
      }

      return success({
        id: conversation.id,
        autoReplyEnabled: conversation.autoReplyEnabled,
      });
    } catch (err) {
      return error(500, err.message || "Failed to update conversation");
    }
  }

  return error(405, "Method not allowed");
});