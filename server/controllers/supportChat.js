import { Op } from "sequelize";
import fs from 'fs';
import os from 'os';
import path from 'path';
import { readMultipartFormData } from 'h3';
import { readBody, getQuery, setResponseStatus, readRawBody } from 'h3';
import { $fetch } from 'ofetch';
import {
  ChatbotConversation,
  ChatbotMessage,
  ChatbotMessageAttachment,
  User,
  Organisation
} from "../models/index.js";

import { isSupportAgent, getSupportAgentUserIds } from '../utils/supportAgents.js';
import { parseJsonBody } from "../utils/body";
import { 
  sendNotificationToUser,
  sendSupportTicketSubmittedNotification,
  sendSupportReplyNotification
} from '../utils/fcmNotification.js';
import { uploadBufferFile } from '../utils/storage.js';

// Send FCM notification for new chatbot message
const notifyNewMessage = async (conversationId, message, recipientUserId) => {
  try {
    if (!recipientUserId) return;
    
    if (message.senderType === 'support' || message.senderType === 'admin') {
      await sendSupportReplyNotification({
        userId: recipientUserId,
        ticketId: conversationId,
        replyPreview: message.message?.substring(0, 100)
      });
    } else if (message.senderType === 'ai' || message.senderType === 'bot') {
      await sendNotificationToUser({
        userId: recipientUserId,
        title: 'Flossly Assistant',
        body: message.message?.substring(0, 100) || 'You have a new response',
        type: 'chatbot_message',
        referenceType: 'chatbot_conversation',
        referenceId: conversationId,
        data: {
          conversationId: String(conversationId),
          message: JSON.stringify(message),
          url: '/support-chat'
        },
        priority: 'high'
      });
    } else if (message.senderType === 'user') {
      await sendNotificationToUser({
        userId: recipientUserId,
        title: 'New User Message',
        body: message.message?.substring(0, 100) || 'New message received',
        type: 'chatbot_message',
        referenceType: 'chatbot_conversation',
        referenceId: conversationId,
        data: {
          conversationId: String(conversationId),
          message: JSON.stringify(message),
          url: '/support-chat'
        },
        priority: 'high'
      });
    }
  } catch (error) {
    console.error('Error sending chatbot message notification:', error);
  }
};

// Send FCM notification to all support agents
const notifySupportAgents = async (conversationId, message, conversation) => {
  try {
    const supportAgentIds = await getSupportAgentUserIds();
    
    if (!supportAgentIds || supportAgentIds.length === 0) {
    return;
    }
    
    const userName = conversation.user?.fullName || 'A user';
    const title = `New Message from ${userName}`;
    const body = message.message?.substring(0, 100) || 'New message in support chat';
    
    // Send notification to each support agent
    for (const agentUserId of supportAgentIds) {
      await sendNotificationToUser({
        userId: agentUserId,
        title,
        body,
        type: 'chatbot_message',
        referenceType: 'chatbot_conversation',
        referenceId: conversationId,
        data: {
          conversationId: String(conversationId),
          message: JSON.stringify(message),
          url: '/support-chat'
        },
        priority: 'high'
      });
    }

  } catch (error) {
    console.error('Error notifying support agents:', error);
  }
};

// Send FCM notification for conversation status update
const notifyStatusUpdate = async (conversationId, status, recipientUserId) => {
  try {
    if (!recipientUserId) return;
    
    const statusLabels = {
      'active': 'Submitted',
      'in-progress': 'In Progress',
      'resolved': 'Resolved',
      'closed': 'Closed'
    };
    
    const statusLabel = statusLabels[status] || status;
    
    await sendNotificationToUser({
      userId: recipientUserId,
      title: 'Conversation Status Updated',
      body: `Your conversation status has been updated to: ${statusLabel}`,
      type: 'chatbot_status_update',
      referenceType: 'chatbot_conversation',
      referenceId: conversationId,
      data: {
        conversationId: String(conversationId),
        status: status,
        url: '/support-chat'
      },
      priority: 'medium'
    });
  } catch (error) {
    console.error('Error sending status update notification:', error);
  }
};

// --------------------------
// Conversation Management
// --------------------------

export const createConversation = async (event) => {
  try {
    const user = event.context.user;
    
    // Read the request body - check if already parsed
    let body = event._requestBody || await readBody(event);
    
    // If body is a string, parse it
    const parsed = typeof body === 'string' ? JSON.parse(body || '{}') : body || {};
    
    const { conversationType, subject, metadata } = parsed;
    
    if (!user) {
      setResponseStatus(event, 401);
      return {
        success: false,
        message: 'Unauthorized'
      };
    }

    // The JWT token stores userId and orgId
    const userId = user.userId;
    const organisationId = user.orgId;

    // Check if user exists
    const userExists = await User.findByPk(userId);

    const conversation = await ChatbotConversation.create({
      userId,
      organisationId,
      conversationType,
      subject,
      metadata,
      status: 'active',
      lastMessageAt: new Date()
    });

    // Skip notification for ask-question flow
    if (conversationType !== 'ask-question') {
      await sendSupportTicketSubmittedNotification({
        userId,
        ticketId: conversation.id,
        ticketSubject: subject || 'Support Request'
      });
    }

    setResponseStatus(event, 201);
    return {
      success: true,
      data: conversation
    };
  } catch (error) {
    console.error('Create conversation error:', error);
    setResponseStatus(event, 500);
    return {
      success: false,
      message: 'Failed to create conversation',
      error: error.message
    };
  }
};

export const getConversations = async (event) => {
  try {
    const query = getQuery(event);
    const { status, conversationType, limit = 50, offset = 0 } = query;
    const user = event.context.user;
    
    if (!user) {
      setResponseStatus(event, 401);
      return { success: false, message: 'Unauthorized' };
    }

    const supportAgent = await isSupportAgent(user);

    const organisationId = user.orgId;
    const where = supportAgent ? {} : { organisationId };
    
    if (status) where.status = status;

    // Support agents don't need AI 'ask-question' conversations in the support inbox.
    // If a conversationType filter is explicitly provided, honor it.
    if (conversationType) {
      where.conversationType = conversationType;
    } else if (supportAgent) {
      // Default inbox view: exclude AI Q&A conversations
      where.conversationType = { [Op.ne]: 'ask-question' };
    }

    const conversations = await ChatbotConversation.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: ChatbotMessage,
          as: 'messages',
          limit: 1,
          order: [['createdAt', 'DESC']],
          attributes: ['id', 'message', 'senderType', 'createdAt', 'isRead']
        }
      ],
      order: [['lastMessageAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return {
      success: true,
      data: conversations.rows,
      total: conversations.count
    };
  } catch (error) {
    console.error('Get conversations error:', error);
    setResponseStatus(event, 500);
    return {
      success: false,
      message: 'Failed to fetch conversations',
      error: error.message
    };
  }
};

export const getConversationById = async (event) => {
  try {
    const query = getQuery(event);
    const { id } = query;

    const user = event.context.user;
    if (!user) {
      setResponseStatus(event, 401);
      return { success: false, message: 'Unauthorized' };
    }

    const supportAgent = await isSupportAgent(user);

    const where = supportAgent ? { id } : { id, organisationId: user.orgId };

    const conversation = await ChatbotConversation.findOne({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: ChatbotMessage,
          as: 'messages',
          include: [
            {
              model: User,
              as: 'sender',
              attributes: ['id', 'fullName']
            },
            {
              model: ChatbotMessageAttachment,
              as: 'attachments'
            }
          ],
          order: [['createdAt', 'ASC']]
        }
      ]
    });

    if (!conversation) {
      setResponseStatus(event, 404);
      return {
        success: false,
        message: 'Conversation not found'
      };
    }

    return {
      success: true,
      data: conversation
    };
  } catch (error) {
    console.error('Get conversation error:', error);
    setResponseStatus(event, 500);
    return {
      success: false,
      message: 'Failed to fetch conversation',
      error: error.message
    };
  }
};

export const updateConversationStatus = async (event) => {
  try {
    const query = getQuery(event);
    let body = await readBody(event);
    const { id } = query;
    
    // If body is a string, parse it
    if (typeof body === 'string') {
      try {
        body = parseJsonBody(body);
      } catch (e) {
        console.error('Failed to parse body:', e);
      }
    }
    
    // Extract status from body
    const status = body?.status;
    
    const user = event.context.user;
    
    if (!user) {
      setResponseStatus(event, 401);
      return { success: false, message: 'Unauthorized' };
    }

    if (!status) {
      setResponseStatus(event, 400);
      return { 
        success: false, 
        message: 'Status is required',
        received: { id, status, body }
      };
    }

    const conversation = await ChatbotConversation.findByPk(id);
    
    if (!conversation) {
      setResponseStatus(event, 404);
      return {
        success: false,
        message: 'Conversation not found'
      };
    }

    conversation.status = status;
    
    if (status === 'resolved') {
      conversation.resolvedAt = new Date();
      conversation.resolvedBy = user.userId;
    }

    await conversation.save();

    // Send FCM notification to user about status change
    await notifyStatusUpdate(id, status, conversation.userId);

    return {
      success: true,
      data: conversation
    };
  } catch (error) {
    console.error('Update conversation status error:', error);
    setResponseStatus(event, 500);
    return {
      success: false,
      message: 'Failed to update conversation',
      error: error.message
    };
  }
};

// --------------------------
// Message Management
// --------------------------

export const createMessage = async (event) => {
  try {
    const body = await readBody(event);
    const parsed = typeof body === "string" ? JSON.parse(body || "{}") : body || {};
    const { conversationId, message, senderType = 'user', clientTempId } = parsed;

    const normalizedMessage = String(message ?? '').replace(/\s+$/g, '');
    const metadata = clientTempId ? { clientTempId } : null;
    const user = event.context.user;
    
    if (!user) {
      setResponseStatus(event, 401);
      return { success: false, message: 'Unauthorized' };
    }

    const supportAgent = await isSupportAgent(user);

    const conversation = await ChatbotConversation.findByPk(conversationId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });
    
    if (!conversation) {
      setResponseStatus(event, 404);
      return {
        success: false,
        message: 'Conversation not found'
      };
    }

    // Authorization:
    // - Support agents can message any conversation
    // - Normal users can only message their own conversation
    if (!supportAgent && conversation.userId !== user.userId) {
      setResponseStatus(event, 403);
      return { success: false, message: 'Forbidden' };
    }

    // Only support agents can send support messages
    if (senderType === 'support' && !supportAgent) {
      setResponseStatus(event, 403);
      return { success: false, message: 'Forbidden' };
    }

    const newMessage = await ChatbotMessage.create({
      conversationId,
      senderId: user.userId,
      senderType,
      message: normalizedMessage,
      metadata,
      isRead: false
    });

    // Send FCM notification to the conversation participant
    // Skip FCM for ask-question flow (response is returned directly in API)
    // If message is from support, notify the user. If from user, notify support agents.
    if (conversation.conversationType !== 'ask-question') {
      if (senderType === 'support' || senderType === 'admin') {
        // Notify the user who created the conversation
        await notifyNewMessage(conversationId, newMessage.toJSON(), conversation.userId);
      } else if (senderType === 'user') {
        // Notify all support agents about the new user message
        await notifySupportAgents(conversationId, newMessage.toJSON(), conversation);
      }
    }

    // Update conversation lastMessageAt
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Send to webhook if conversation type is 'ask-question' and wait for response
    if (conversation.conversationType === 'ask-question' && senderType === 'user') {
      try {
        const webhookUrl = 'https://n8n.flossly.ai/webhook/27c316ad-0504-4357-bb8d-f7193472d3a0';
        
        const webhookPayload = {
          conversationId: conversation.id,
          messageId: newMessage.id,
          message: message,
          user: {
            id: user.userId,
            name: conversation.user?.fullName,
            email: conversation.user?.email
          },
          conversationType: conversation.conversationType,
          subject: conversation.subject,
          timestamp: new Date().toISOString()
        };

        // Send to webhook and WAIT for response
        const webhookResponse = await $fetch(webhookUrl, {
          method: 'POST',
          body: webhookPayload
        });

        // Create bot response message with the webhook response
        if (webhookResponse) {
          // Extract the actual message from various possible response formats
          let messageText = '';
          
          if (typeof webhookResponse === 'string') {
            messageText = webhookResponse;
          } else if (webhookResponse.output) {
            messageText = webhookResponse.output;
          } else if (webhookResponse.message) {
            messageText = webhookResponse.message;
          } else if (webhookResponse.response) {
            messageText = webhookResponse.response;
          } else if (webhookResponse.text) {
            messageText = webhookResponse.text;
          } else {
            // Fallback to JSON string if no recognized field
            messageText = JSON.stringify(webhookResponse, null, 2);
          }
          
          const botMessage = await ChatbotMessage.create({
            conversationId,
            senderId: null, // Bot message, no specific sender
            senderType: 'ai',
            message: messageText,
            isRead: false
          });

          // Return BOTH user message and bot response for ask-question flow
          setResponseStatus(event, 201);
          return {
            success: true,
            data: newMessage,
            botResponse: botMessage.toJSON() // Include bot response in the API response
          };
        }

      } catch (webhookError) {
        // Log webhook errors but don't fail the message creation
        console.error('>>> Failed to send webhook:', webhookError);
        
        // Create error message for user
        const errMsg = await ChatbotMessage.create({
          conversationId,
          senderId: null,
          senderType: 'ai',
          message: 'Sorry, I encountered an error processing your request. Please try again later.',
          isRead: false
        });

        // Return error response
        setResponseStatus(event, 201);
        return {
          success: true,
          data: newMessage,
          botResponse: errMsg.toJSON() // Include error message in the API response
        };
      }
    }

    setResponseStatus(event, 201);
    return {
      success: true,
      data: newMessage
    };
  } catch (error) {
    console.error('Create message error:', error);
    setResponseStatus(event, 500);
    return {
      success: false,
      message: 'Failed to create message',
      error: error.message
    };
  }
};

export const markMessagesAsRead = async (event) => {
  try {
    const query = getQuery(event);
    const { conversationId } = query;

    await ChatbotMessage.update(
      { isRead: true, readAt: new Date() },
      { where: { conversationId, isRead: false } }
    );

    return {
      success: true,
      message: 'Messages marked as read'
    };
  } catch (error) {
    console.error('Mark messages as read error:', error);
    setResponseStatus(event, 500);
    return {
      success: false,
      message: 'Failed to mark messages as read',
      error: error.message
    };
  }
};

// Upload attachment for chatbot message
export const uploadAttachment = async (event) => {
  try {
    const user = event.context.user;
    
    if (!user) {
      setResponseStatus(event, 401);
      return { success: false, message: 'Unauthorized' };
    }

    const formData = await readMultipartFormData(event);
    
    if (!formData || formData.length === 0) {
      setResponseStatus(event, 400);
      return { success: false, message: 'No file uploaded' };
    }

    const fileData = formData.find(item => item.name === 'file');
    const messageId = formData.find(item => item.name === 'messageId')?.data?.toString();
    const conversationId = formData.find(item => item.name === 'conversationId')?.data?.toString();

    if (!fileData || !messageId || !conversationId) {
      setResponseStatus(event, 400);
      return { success: false, message: 'Missing required fields' };
    }

    // Verify message exists and user has access
    const message = await ChatbotMessage.findOne({
      where: { id: messageId, conversationId: conversationId },
      include: [{
        model: ChatbotConversation,
        as: 'conversation'
      }]
    });

    if (!message) {
      setResponseStatus(event, 404);
      return { success: false, message: 'Message not found' };
    }

    // Generate unique filename
    const originalName = fileData.filename || 'file';
    const fileExt = originalName.substring(originalName.lastIndexOf('.'));
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExt}`;

    // Determine file category
    const mimeType = fileData.type || 'application/octet-stream';
    let fileCategory = 'other';
    if (mimeType.startsWith('image/')) fileCategory = 'image';
    else if (mimeType.startsWith('video/')) fileCategory = 'video';
    else if (mimeType.startsWith('audio/')) fileCategory = 'audio';
    else if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) fileCategory = 'document';

    // Upload to S3 using the storage utility
    const s3Path = await uploadBufferFile({
      data: fileData.data,
      filename: uniqueFileName,
      contentType: mimeType,
      baseDir: 'chatbot-attachments'
    });
    
    const attachment = await ChatbotMessageAttachment.create({
      messageId: parseInt(messageId),
      conversationId: parseInt(conversationId),
      uploadedBy: user.userId,
      fileName: uniqueFileName,
      originalFileName: originalName,
      filePath: s3Path,
      fileSize: fileData.data.length,
      mimeType: mimeType,
      fileExtension: fileExt,
      fileCategory: fileCategory
    });

    // Get conversation to notify user
    const conversation = await ChatbotConversation.findByPk(conversationId);
    if (conversation) {
      // Send notification about new attachment
      await notifyNewMessage(conversationId, {
        id: attachment.id,
        message: `📎 Attachment: ${attachment.originalFileName}`,
        senderType: 'support',
        createdAt: new Date(),
        attachments: [attachment]
      }, conversation.userId);
    }

    setResponseStatus(event, 201);
    return {
      success: true,
      data: {
        id: attachment.id,
        fileName: attachment.originalFileName,
        fileSize: attachment.fileSize,
        mimeType: attachment.mimeType,
        fileCategory: attachment.fileCategory,
        url: attachment.filePath
      }
    };
  } catch (error) {
    console.error('Upload attachment error:', error);
    setResponseStatus(event, 500);
    return {
      success: false,
      message: 'Failed to upload attachment',
      error: error.message
    };
  }
};

