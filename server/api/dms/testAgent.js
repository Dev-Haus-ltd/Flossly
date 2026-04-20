import { readBody } from "h3";
import { success, error } from "../../utils/response";
import { Organisation } from "../../models";
import { generateAutoReply } from "../../utils/aiWrapper";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { orgId, message, history = [] } = body || {};

    if (!orgId) return error(400, "Organisation ID is required");
    if (!message) return error(400, "Message is required");

    const org = await Organisation.findOne({
      where: { id: orgId },
      attributes: ['name', 'type', 'autoReplyEnabled', 'autoReplyConfig'],
    });

    if (!org) {
      return error(404, "Organisation not found");
    }

    const config = org.autoReplyConfig || {};

    const result = await generateAutoReply({
      organisationName: org.name,
      organisationType: org.type,
      message,
      history,
      autoReplyConfig: config,
    });

    return success({
      ...result,
      organisation: {
        name: org.name,
        type: org.type,
        autoReplyEnabled: org.autoReplyEnabled,
      },
    });
  } catch (err) {
    console.error('[TestAgent] Error:', err);
    return error(500, err.message || "Failed to generate reply");
  }
});