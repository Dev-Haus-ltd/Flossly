import admin from 'firebase-admin';
import { FcmToken, UserNotification } from '../models';
import fs from 'fs';
import path from 'path';

let firebaseApp = null;

// Initialize Firebase Admin SDK
export const initializeFirebaseAdmin = () => {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    // Try to initialize from environment variables first (support full service account fields)
    const envServiceAccount = {
      type: process.env.FIREBASE_TYPE || 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'), // Handle escaped newlines
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI,
      token_uri: process.env.FIREBASE_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
      universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
    };

    // Minimal required fields check
    if (envServiceAccount.project_id && envServiceAccount.private_key && envServiceAccount.client_email) {
      console.log('Initializing Firebase from environment variables...');
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: envServiceAccount.project_id,
          privateKey: envServiceAccount.private_key,
          clientEmail: envServiceAccount.client_email,
          // Extra fields are passed for compatibility with some environments
          privateKeyId: envServiceAccount.private_key_id,
          clientId: envServiceAccount.client_id,
        }),
      });
      console.log('Firebase Admin SDK initialized successfully from environment variables');
      return firebaseApp;
    }

    // Fallback to service account file
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    
    if (!serviceAccountPath) {
      console.warn('Firebase not configured - neither environment variables nor service account path provided');
      return null;
    }

    const fullPath = path.resolve(serviceAccountPath);
    
    if (!fs.existsSync(fullPath)) {
      console.error('Firebase service account file not found:', fullPath);
      return null;
    }

    const serviceAccount = JSON.parse(fs.readFileSync(fullPath, 'utf8'));

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log('Firebase Admin SDK initialized successfully from service account file');
    return firebaseApp;
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    return null;
  }
};

// Send notification to a single user
export const sendNotificationToUser = async ({
  userId,
  title,
  body,
  type,
  referenceType = null,
  referenceId = null,
  data = {},
  priority = 'medium',
  icon = '/pwa-192x192.png'
}) => {
  try {
    // Initialize Firebase Admin if not already done
    if (!firebaseApp) {
      initializeFirebaseAdmin();
    }

    if (!firebaseApp) {
      console.warn('Firebase Admin SDK not initialized - skipping push notification');
      // Still create the notification record for in-app display
      const notification = await UserNotification.create({
        userId,
        title,
        body,
        type,
        referenceType,
        referenceId,
        data,
        priority,
        isRead: false,
        isSent: false,
        errorMessage: 'Firebase not configured'
      });
      
      return {
        success: false,
        message: 'Firebase not configured',
        notificationId: notification.id,
      };
    }

    // Create notification record in database (store in-app history even if push can't be delivered)
    const notification = await UserNotification.create({
      userId,
      title,
      body,
      type,
      referenceType,
      referenceId,
      data,
      priority,
      isRead: false,
      isSent: false,
    });

    // Get all active FCM tokens for the user
    const fcmTokens = await FcmToken.findAll({
      where: {
        userId: userId,
        isActive: true,
      },
    });

    if (!fcmTokens || fcmTokens.length === 0) {
      console.log(`No active FCM tokens found for user ${userId}`);
      return {
        success: false,
        message: 'No active tokens found',
        notificationId: notification.id,
      };
    }

    // Prepare FCM message - ALL data values MUST be strings
    const stringifiedData = {};
    if (data && typeof data === 'object') {
      for (const [key, value] of Object.entries(data)) {
        if (value === null || value === undefined) {
          stringifiedData[key] = '';
        } else if (typeof value === 'string') {
          stringifiedData[key] = value;
        } else {
          stringifiedData[key] = JSON.stringify(value);
        }
      }
    }

    // Include both notification and data for better compatibility
    const message = {
      notification: {
        title,
        body
      },
      data: {
        ...stringifiedData,
        title: String(title),
        body: String(body),
        type: String(type || 'notification'),
        notificationId: String(notification.id),
        referenceType: String(referenceType || ''),
        referenceId: String(referenceId || ''),
        priority: String(priority || 'medium'),
        clickAction: String(stringifiedData.url || data?.url || '/'),
        icon: String(icon)
      },
      webpush: {
        headers: {
          TTL: '86400'
        }
      }
    };

    // Send to all user's devices
    const tokens = fcmTokens.map(t => t.token);
    const results = {
      success: 0,
      failed: 0,
      invalidTokens: []
    };

    // Send using multicast
    
    try {
      const response = await admin.messaging().sendEachForMulticast({
        tokens,
        ...message
      });
      
      console.log(`✅ [FCM] Push sent! Success: ${response.successCount}, Failed: ${response.failureCount}`);

      // Process responses
      response.responses.forEach((resp, idx) => {
        if (resp.success) {
          results.success++;
          // Update last_used_at for successful token
          FcmToken.update(
            { lastUsedAt: new Date() },
            { where: { token: tokens[idx] } }
          );
        } else {
          results.failed++;
          console.error(`Failed to send to token ${tokens[idx]}:`, resp.error);
          
          // Handle invalid tokens
          if (resp.error?.code === 'messaging/invalid-registration-token' ||
              resp.error?.code === 'messaging/registration-token-not-registered') {
            results.invalidTokens.push(tokens[idx]);
            // Mark token as inactive
            FcmToken.update(
              { isActive: false },
              { where: { token: tokens[idx] } }
            );
          }
        }
      });

      // Update notification record
      await notification.update({
        isSent: results.success > 0,
        sentAt: new Date(),
        fcmMessageId: response.responses[0]?.messageId || null,
        errorMessage: results.failed > 0 ? `${results.failed} failures` : null
      });

      return {
        success: true,
        notificationId: notification.id,
        results
      };
    } catch (error) {
      console.error('Error sending FCM message:', error);
      await notification.update({
        errorMessage: error.message
      });
      throw error;
    }
  } catch (error) {
    console.error('Error in sendNotificationToUser:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Send notification to multiple users
export const sendNotificationToMultipleUsers = async ({
  userIds,
  title,
  body,
  type,
  referenceType = null,
  referenceId = null,
  data = {},
  priority = 'medium',
  icon = '/pwa-192x192.png'
}) => {
  const results = [];
  
  for (const userId of userIds) {
    const result = await sendNotificationToUser({
      userId,
      title,
      body,
      type,
      referenceType,
      referenceId,
      data,
      priority,
      icon
    });
    results.push({ userId, ...result });
  }

  return results;
};

// Send task assignment notification
export const sendTaskAssignmentNotification = async ({ task, assignedUser, assignedBy }) => {
  const taskTitle = task?.title || task?.name || 'Task';
  const assignedByName = assignedBy?.fullName || assignedBy?.name || 'Unknown';

  return await sendNotificationToUser({
    userId: assignedUser.id,
    title: 'New Task Assigned',
    body: `You have been assigned a new task: ${taskTitle}`,
    type: 'task_assigned',
    referenceType: 'task',
    referenceId: task.id,
    data: {
      taskId: task.id,
      taskTitle,
      assignedBy: assignedByName,
      url: `/tasks/${task.id}`
    },
    priority: task.priority || 'medium'
  });
};

// Send summary notification for bulk task assignment (avoid spamming users)
export const sendBulkTaskAssignmentNotification = async ({ assignedUser, assignedBy, tasks = [] }) => {
  const count = Array.isArray(tasks) ? tasks.length : 0;
  if (!assignedUser?.id || count === 0) return;

  if (count === 1) {
    return await sendTaskAssignmentNotification({
      task: tasks[0],
      assignedUser,
      assignedBy,
    });
  }

  const assignedByName = assignedBy?.fullName || assignedBy?.name || 'Unknown';
  const titles = tasks.map(t => t?.title).filter(Boolean);
  const topTitles = titles.slice(0, 3);
  const moreCount = Math.max(0, titles.length - topTitles.length);

  const body = topTitles.length
    ? `You have been assigned ${count} new tasks: ${topTitles.join(', ')}${moreCount ? ` +${moreCount} more` : ''}`
    : `You have been assigned ${count} new tasks.`;

  return await sendNotificationToUser({
    userId: assignedUser.id,
    title: `${count} New Tasks Assigned`,
    body,
    type: 'task_assigned_bulk',
    referenceType: 'task',
    referenceId: tasks[0]?.id,
    data: {
      taskCount: count,
      taskTitles: titles,
      assignedBy: assignedByName,
      url: '/tasks/mytasks',
    },
    priority: 'medium',
  });
};

// Send task comment notification
export const sendTaskCommentNotification = async ({ task, comment, commentedBy, notifyUsers }) => {
  const recipients = (notifyUsers || []).filter(Boolean);
  if (!recipients.length) return;

  const taskTitle = task?.title || 'Task';
  const commenterName = commentedBy?.fullName || commentedBy?.name || 'Someone';

  return await sendNotificationToMultipleUsers({
    userIds: recipients.map(u => u.id),
    title: 'New Comment',
    body: `${commenterName} commented on "${taskTitle}"`,
    type: 'task_comment',
    referenceType: 'task',
    referenceId: task.id,
    data: {
      taskId: task.id,
      taskTitle,
      comment: comment || '',
      commentedBy: commenterName,
      url: `/tasks/${task.id}`,
    },
    priority: 'low',
  });
};

// Send task unassigned notification
export const sendTaskUnassignmentNotification = async ({ taskTitle, removedBy, removedUser }) => {
  if (!removedUser?.id) return;
  const removedByName = removedBy?.fullName || removedBy?.name || 'Team';

  return await sendNotificationToUser({
    userId: removedUser.id,
    title: 'Task Unassigned',
    body: `You were unassigned from: ${taskTitle || 'Task'} (by ${removedByName})`,
    type: 'task_unassigned',
    referenceType: 'task',
    referenceId: null,
    data: {
      taskTitle: taskTitle || 'Task',
      removedBy: removedByName,
      url: '/tasks/mytasks'
    },
    priority: 'low',
  });
};

// Send bulk task unassigned summary
export const sendBulkTaskUnassignmentNotification = async ({ removedUser, removedBy, taskTitles = [] }) => {
  const count = Array.isArray(taskTitles) ? taskTitles.length : 0;
  if (!removedUser?.id || count === 0) return;
  if (count === 1) {
    return await sendTaskUnassignmentNotification({
      taskTitle: taskTitles[0],
      removedBy,
      removedUser,
    });
  }

  const removedByName = removedBy?.fullName || removedBy?.name || 'Team';
  const topTitles = taskTitles.slice(0, 3);
  const moreCount = Math.max(0, count - topTitles.length);
  const body = `You were unassigned from ${count} tasks: ${topTitles.join(', ')}${moreCount ? ` +${moreCount} more` : ''}`;

  return await sendNotificationToUser({
    userId: removedUser.id,
    title: `${count} Tasks Unassigned`,
    body,
    type: 'task_unassigned_bulk',
    referenceType: 'task',
    referenceId: null,
    data: {
      taskCount: count,
      taskTitles,
      removedBy: removedByName,
      url: '/tasks/mytasks'
    },
    priority: 'low'
  });
};

// Send bulk task completion notification (summary)
export const sendBulkTaskCompletionNotification = async ({ tasks = [], completedBy, notifyUser }) => {
  const count = Array.isArray(tasks) ? tasks.length : 0;
  if (!notifyUser?.id || count === 0) return;

  const completedByName = completedBy?.fullName || completedBy?.name || 'Someone';
  const titles = tasks.map(t => t?.title).filter(Boolean);
  const topTitles = titles.slice(0, 3);
  const moreCount = Math.max(0, titles.length - topTitles.length);
  const body = topTitles.length
    ? `${completedByName} completed ${count} tasks: ${topTitles.join(', ')}${moreCount ? ` +${moreCount} more` : ''}`
    : `${completedByName} completed ${count} tasks.`;

  return await sendNotificationToUser({
    userId: notifyUser.id,
    title: `${count} Tasks Completed`,
    body,
    type: 'task_completed_bulk',
    referenceType: 'task',
    referenceId: tasks[0]?.id,
    data: {
      taskCount: count,
      taskTitles: titles,
      completedBy: completedByName,
      url: '/tasks',
    },
    priority: 'low',
  });
};

// Send task completion notification
export const sendTaskCompletionNotification = async ({ task, completedBy, notifyUsers }) => {
  if (!notifyUsers || notifyUsers.length === 0) return;

  const taskTitle = task?.title || task?.name || 'Task';
  const completedByName = completedBy?.fullName || completedBy?.name || 'Someone';

  return await sendNotificationToMultipleUsers({
    userIds: notifyUsers.map(u => u.id),
    title: 'Task Completed',
    body: `Task "${taskTitle}" has been completed by ${completedByName}`,
    type: 'task_completed',
    referenceType: 'task',
    referenceId: task.id,
    data: {
      taskId: task.id,
      taskTitle,
      completedBy: completedByName,
      url: `/tasks/${task.id}`
    },
    priority: 'medium'
  });
};

// Send lead creation notification
export const sendLeadCreatedNotification = async ({ lead, assignedUsers }) => {
  if (!assignedUsers || assignedUsers.length === 0) return;

  return await sendNotificationToMultipleUsers({
    userIds: assignedUsers.map(u => u.id),
    title: 'New Lead Assigned',
    body: `A new lead "${lead.name || lead.email}" has been assigned to you`,
    type: 'lead_created',
    referenceType: 'lead',
    referenceId: lead.id,
    data: {
      leadId: lead.id,
      leadName: lead.name || lead.email,
      leadSource: lead.source || 'Unknown',
      url: `/crm?leadId=${lead.id}`
    },
    priority: 'high'
  });
};

// Send lead assignment notification (when assignees are added on update)
export const sendLeadAssignedNotification = async ({ lead, assignedUsers, assignedBy }) => {
  if (!assignedUsers || assignedUsers.length === 0) return;
  const assignedByName = assignedBy?.fullName || assignedBy?.name || 'Team';

  return await sendNotificationToMultipleUsers({
    userIds: assignedUsers.map(u => u.id),
    title: 'Lead Assigned',
    body: `Lead "${lead.name || lead.email}" has been assigned to you by ${assignedByName}`,
    type: 'lead_assigned',
    referenceType: 'lead',
    referenceId: lead.id,
    data: {
      leadId: lead.id,
      leadName: lead.name || lead.email,
      assignedBy: assignedByName,
      url: `/crm?leadId=${lead.id}`
    },
    priority: 'high'
  });
};

// Send lead unassignment notification (when assignees are removed on update)
export const sendLeadUnassignedNotification = async ({ lead, removedUsers, removedBy }) => {
  if (!removedUsers || removedUsers.length === 0) return;
  const removedByName = removedBy?.fullName || removedBy?.name || 'Team';

  return await sendNotificationToMultipleUsers({
    userIds: removedUsers.map(u => u.id),
    title: 'Lead Unassigned',
    body: `You were unassigned from lead "${lead.name || lead.email}" by ${removedByName}`,
    type: 'lead_unassigned',
    referenceType: 'lead',
    referenceId: lead.id,
    data: {
      leadId: lead.id,
      leadName: lead.name || lead.email,
      removedBy: removedByName,
      url: `/crm?leadId=${lead.id}`
    },
    priority: 'low'
  });
};

// Send WhatsApp message notification
export const sendWhatsAppMessageNotification = async ({ message, lead, userId }) => {
  return await sendNotificationToUser({
    userId,
    title: 'New WhatsApp Message',
    body: `New message from ${lead.name || lead.phone}: ${message.substring(0, 50)}...`,
    type: 'whatsapp_message',
    referenceType: 'lead',
    referenceId: lead.id,
    data: {
      leadId: lead.id,
      leadName: lead.name || lead.phone,
      messagePreview: message.substring(0, 100),
      url: `/crm?leadId=${lead.id}&tab=communication`
    },
    priority: 'high'
  });
};

// Send Meta DM notification
export const sendMetaDMNotification = async ({ message, sender, userId }) => {
  return await sendNotificationToUser({
    userId,
    title: 'New Meta Direct Message',
    body: `New message from ${sender}: ${message.substring(0, 50)}...`,
    type: 'meta_dm',
    referenceType: 'message',
    referenceId: null,
    data: {
      sender,
      messagePreview: message.substring(0, 100),
      url: '/crm/analytics'
    },
    priority: 'high'
  });
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId, userId) => {
  try {
    const notification = await UserNotification.findOne({
      where: {
        id: notificationId,
        userId
      }
    });

    if (!notification) {
      return { success: false, message: 'Notification not found' };
    }

    await notification.update({
      isRead: true,
      readAt: new Date()
    });

    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: error.message };
  }
};

// Get user notifications
export const getUserNotifications = async (userId, { limit = 50, offset = 0, unreadOnly = false } = {}) => {
  try {
    const where = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const notifications = await UserNotification.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    return {
      success: true,
      notifications: notifications.rows,
      total: notifications.count,
      unreadCount: unreadOnly ? notifications.count : await UserNotification.count({
        where: { userId, isRead: false }
      })
    };
  } catch (error) {
    console.error('Error getting user notifications:', error);
    return { success: false, error: error.message };
  }
};
