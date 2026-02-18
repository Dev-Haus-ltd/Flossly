import { Get, Post, PostFormData } from "./apiWrapper";

const supportChatService = {
  // --------------------------
  // Conversation APIs
  // --------------------------
  createConversation: async (data) => {
    return await Post("/supportChat/conversations", data);
  },

  getConversations: async (params) => {
    const queryString = new URLSearchParams(params).toString();
    return await Get(`/supportChat/conversations?${queryString}`);
  },

  getConversationById: async (id) => {
    return await Get(`/supportChat/conversation?id=${id}`);
  },

  updateConversationStatus: async (id, status) => {
    return await Post(`/supportChat/conversation-status?id=${id}`, { status });
  },

  // --------------------------
  // Message APIs
  // --------------------------
  createMessage: async (data) => {
    return await Post("/supportChat/messages", data);
  },

  markMessagesAsRead: async (conversationId) => {
    return await Post(`/supportChat/messages-read?conversationId=${conversationId}`, {});
  },

  uploadAttachment: async (formData) => {
    return await PostFormData("/supportChat/upload-attachment", formData);
  },

  // Bug reports and feature requests now use conversation metadata

  // --------------------------
  // Helper Functions
  // --------------------------
  startConversation: async (type, initialMessage, metadata = {}) => {
    try {
      // Create conversation
      const conversationResponse = await supportChatService.createConversation({
        conversationType: type,
        subject: initialMessage.substring(0, 100),
        metadata
      });

      if (!conversationResponse.success) {
        throw new Error('Failed to create conversation');
      }

      const conversationId = conversationResponse.data.id;

      // Create initial message
      const messageResponse = await supportChatService.createMessage({
        conversationId,
        message: initialMessage,
        senderType: 'user'
      });

      if (!messageResponse.success) {
        throw new Error('Failed to create message');
      }

      return {
        success: true,
        conversationId,
        conversation: conversationResponse.data,
        message: messageResponse.data
      };
    } catch (error) {
      console.error('Start conversation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Helper functions for bug reports and feature requests removed
  // Use conversation metadata to store type-specific information
};

export default supportChatService;
