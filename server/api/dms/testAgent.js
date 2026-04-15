import { readBody } from "h3";
import { success, error } from "../../utils/response";
import { Organisation, OrganisationTreatment } from "../../models";
import { generateAutoReply } from "../../utils/aiWrapper";

export default defineEventHandler(async (event) => {
  try {
    const { userId, orgId } = event.context.user || {};
    if (!orgId) return error(401, "Unauthenticated");

    const body = await readBody(event);
    const { message, history = [] } = body || {};

    if (!message) {
      return error(400, "Message is required");
    }

    const org = await Organisation.findOne({
      where: { id: orgId },
      attributes: ['name', 'type', 'autoReplyEnabled'],
    });

    if (!org) {
      return error(404, "Organisation not found");
    }

    const treatments = await OrganisationTreatment.findAll({
      where: { organisationId: orgId, active: true },
      attributes: ['name', 'category'],
      limit: 20,
    });

    const result = await generateAutoReply({
      organisationName: org.name,
      organisationType: org.type,
      message,
      treatments,
      history,
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