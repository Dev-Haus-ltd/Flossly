import {
  createConversation,
  getConversations,
  getConversationById,
  updateConversationStatus,
  createMessage,
  markMessagesAsRead,
  uploadAttachment
} from "../../controllers/supportChat.js";
import { setResponseStatus } from 'h3';

export default defineEventHandler(async (event) => {
  const name = event.context.params.name;
  const method = event.node.req.method;

  try {
    // Conversations
    if (name === "conversations" && method === "POST") {
      return await createConversation(event);
    }

    if (name === "conversations" && method === "GET") {
      return await getConversations(event);
    }

    if (name === "conversation" && method === "GET") {
      return await getConversationById(event);
    }

    if (name === "conversation-status" && (method === "PATCH" || method === "POST")) {
      return await updateConversationStatus(event);
    }

    // Messages
    if (name === "messages" && method === "POST") {
      return await createMessage(event);
    }

    if (name === "messages-read" && (method === "PATCH" || method === "POST")) {
      return await markMessagesAsRead(event);
    }

    // Attachments
    if (name === "upload-attachment" && method === "POST") {
      return await uploadAttachment(event);
    }

    // Bug reports and feature requests removed - use conversation metadata instead

    // Not found
    setResponseStatus(event, 404);
    return { success: false, message: "Endpoint not found" };
  } catch (error) {
    console.error("Support Chat API Error:", error);
    setResponseStatus(event, 500);
    return { success: false, message: error.message };
  }
});
