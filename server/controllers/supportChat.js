import { Op } from "sequelize";
import fs from 'fs';
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

import { isSupportAgent } from '../utils/supportAgents.js';
import { parseJsonBody } from "../utils/body";

const emitConversationMessage = (conversationId, payload) => {
  const io = globalThis.__flossly_io__;
  if (!io) return;
  io.to(`conversation:${conversationId}`).emit('message:new', payload);
};

// --------------------------
// Conversation Management
// --------------------------

export const createConversation = async (event) => {
  try {
    const user = event.context.user;
    
    // Read the request body - check if already parsed
    let body = event._requestBody || await readBody(event);
    
    console.log('User from context:', user);
    console.log('Request body:', body);
    console.log('Body type:', typeof body);
    
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

    console.log('Creating conversation with:', { userId, organisationId, conversationType, subject });
    console.log('User object:', user);
    
    // Check if user exists
    const userExists = await User.findByPk(userId);
    console.log('User exists in DB?', !!userExists, userExists?.id);

    const conversation = await ChatbotConversation.create({
      userId,
      organisationId,
      conversationType,
      subject,
      metadata,
      status: 'active',
      lastMessageAt: new Date()
    });

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
    
    console.log('Raw body type:', typeof body, 'Body:', body);
    
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
    
    console.log('After parsing - Status:', status, 'Body:', body);
    
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

    console.log('Current conversation status:', conversation.status, 'New status:', status);
    conversation.status = status;
    
    if (status === 'resolved') {
      conversation.resolvedAt = new Date();
      conversation.resolvedBy = user.userId;
    }

    await conversation.save();

    // Emit socket event to notify user in real-time
    const io = globalThis.__flossly_io__;
    if (io) {
      io.to(`conversation:${id}`).emit('conversation:status-updated', {
        conversationId: id,
        status: status
      });
    }

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

    // Realtime push
    emitConversationMessage(conversationId, {
      conversationId,
      message: newMessage.toJSON()
    });

    // Update conversation lastMessageAt
    conversation.lastMessageAt = new Date();
    await conversation.save();

    console.log('=== WEBHOOK CHECK ===');
    console.log('Conversation type:', conversation.conversationType);
    console.log('Sender type:', senderType);
    console.log('Should trigger webhook?', conversation.conversationType === 'ask-question' && senderType === 'user');

    // Send to webhook if conversation type is 'ask-question' and wait for response
    if (conversation.conversationType === 'ask-question' && senderType === 'user') {
      console.log('>>> Webhook condition met! Sending to n8n...');
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

        console.log('>>> Webhook payload:', JSON.stringify(webhookPayload, null, 2));

        // Send to webhook and WAIT for response
        const webhookResponse = await $fetch(webhookUrl, {
          method: 'POST',
          body: webhookPayload
        });

        console.log('>>> Webhook response received:', webhookResponse);

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

          // Realtime push
          emitConversationMessage(conversationId, {
            conversationId,
            message: botMessage.toJSON()
          });

          console.log('>>> Bot response message created:', botMessage.id);
          console.log('>>> Bot message text:', messageText);
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

        // Realtime push
        emitConversationMessage(conversationId, {
          conversationId,
          message: errMsg.toJSON()
        });
      }
    } else {
      console.log('>>> Webhook NOT triggered (condition not met)');
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

    // Create uploads directory if it doesn't exist
    const uploadsDir = 'public/chatbot-attachments';
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const originalName = fileData.filename || 'file';
    const fileExt = originalName.substring(originalName.lastIndexOf('.'));
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExt}`;
    const filePath = `${uploadsDir}/${uniqueFileName}`;

    // Write file to disk
    fs.writeFileSync(filePath, fileData.data);

    // Determine file category
    const mimeType = fileData.type || 'application/octet-stream';
    let fileCategory = 'other';
    if (mimeType.startsWith('image/')) fileCategory = 'image';
    else if (mimeType.startsWith('video/')) fileCategory = 'video';
    else if (mimeType.startsWith('audio/')) fileCategory = 'audio';
    else if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) fileCategory = 'document';

    // Save to database
    // Store path without 'public/' prefix since Nuxt serves public folder from root
    const publicPath = `/${filePath.replace('public/', '')}`;
    
    const attachment = await ChatbotMessageAttachment.create({
      messageId: parseInt(messageId),
      conversationId: parseInt(conversationId),
      uploadedBy: user.userId,
      fileName: uniqueFileName,
      originalFileName: originalName,
      filePath: publicPath,
      fileSize: fileData.data.length,
      mimeType: mimeType,
      fileExtension: fileExt,
      fileCategory: fileCategory
    });

    // Emit socket event for real-time update
    emitConversationMessage(conversationId, {
      conversationId,
      attachmentAdded: attachment.toJSON()
    });

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

