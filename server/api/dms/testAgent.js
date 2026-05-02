import { readBody } from "h3";
import { success, error } from "../../utils/response";
import { Organisation } from "../../models";
import { generateAutoReply, generateAutoReplyWithTools } from "../../utils/aiWrapper";
import { executeBookAppointment } from "../../controllers/meta";

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

    if (!org) return error(404, "Organisation not found");

    const config = org.autoReplyConfig || {};

    let reply, toolCall = null, bookingResult = null;

    if (config.bookingEnabled) {
      const result = await generateAutoReplyWithTools({
        organisationName: org.name,
        organisationType: org.type,
        message,
        history,
        autoReplyConfig: config,
      });

      if (result.toolCall) {
        toolCall = result.toolCall;
        bookingResult = await executeBookAppointment({ orgId, input: result.toolCall.input, conversation: null });
        reply = bookingResult.success
          ? `Appointment booked for ${bookingResult.date} at ${bookingResult.time} with ${bookingResult.dentistName}.`
          : `Booking failed: ${bookingResult.reason}`;
      } else {
        reply = result.reply;
      }
    } else {
      const result = await generateAutoReply({
        organisationName: org.name,
        organisationType: org.type,
        message,
        history,
        autoReplyConfig: config,
      });
      reply = result.reply;
    }

    return success({
      reply,
      toolCall,
      bookingResult,
      organisation: {
        name: org.name,
        type: org.type,
        autoReplyEnabled: org.autoReplyEnabled,
        bookingEnabled: config.bookingEnabled,
      },
    });
  } catch (err) {
    console.error('[TestAgent] Error:', err);
    return error(500, err.message || "Failed to generate reply");
  }
});
