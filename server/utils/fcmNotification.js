import admin from 'firebase-admin';
import { FcmToken, UserNotification, Organisation } from '../models';
import { Op } from 'sequelize';
import fs from 'fs';
import path from 'path';

let firebaseApp = null;
let firebaseConfigWarningShown = false;

const warnFirebaseConfigOnce = (message) => {
  if (firebaseConfigWarningShown) return;
  firebaseConfigWarningShown = true;
  console.warn(message);
};

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
      warnFirebaseConfigOnce('Firebase not configured - neither environment variables nor service account path provided');
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
  organisationId = null,
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
      // Still create the notification record for in-app display
      const notification = await UserNotification.create({
        userId,
        organisationId,
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
      organisationId,
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
        icon: String(icon),
        organisationId: String(organisationId || ''),
      },
      webpush: {
        headers: {
          TTL: '86400',
          Urgency: priority === 'high' ? 'high' : 'normal'
        },
        fcmOptions: {
          link: String(stringifiedData.url || data?.url || '/')
        }
      },
      // Set Android priority for mobile devices
      android: priority === 'high' ? {
        priority: 'high'
      } : undefined,
      // Set APNS priority for iOS devices
      apns: priority === 'high' ? {
        headers: {
          'apns-priority': '10'
        },
        payload: {
          aps: {
            contentAvailable: true
          }
        }
      } : undefined
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
  organisationId = null,
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
      organisationId,
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
export const sendTaskAssignmentNotification = async ({ task, assignedUser, assignedBy, organisationId = null }) => {
  const taskTitle = task?.title || task?.name || 'Task';
  const assignedByName = assignedBy?.fullName || assignedBy?.name || 'Unknown';
  const resolvedOrganisationId = organisationId || task?.organisationId || null;

  return await sendNotificationToUser({
    userId: assignedUser.id,
    organisationId: resolvedOrganisationId,
    title: 'New Task Assigned',
    body: `You have been assigned a new task: ${taskTitle}`,
    type: 'task_assigned',
    referenceType: 'task',
    referenceId: task.id,
    data: {
      taskId: task.id,
      taskTitle,
      assignedBy: assignedByName,
      organisationId: resolvedOrganisationId,
      // Task notifications should go to My Tasks with taskId to open the dialog
      url: `/tasks/mytasks?taskId=${task.id}`
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
      // Task notifications should go to My Tasks with taskId to open the dialog
      url: tasks[0]?.id ? `/tasks/mytasks?taskId=${tasks[0].id}` : '/tasks/mytasks',
    },
    priority: 'medium',
  });
};

// Send task comment notification
export const sendTaskCommentNotification = async ({ task, comment, commentedBy, notifyUsers, organisationId = null }) => {
  const recipients = (notifyUsers || []).filter(Boolean);
  if (!recipients.length) return;

  const taskTitle = task?.title || 'Task';
  const commenterName = commentedBy?.fullName || commentedBy?.name || 'Someone';
  const resolvedOrganisationId = organisationId || task?.organisationId || null;

  return await sendNotificationToMultipleUsers({
    userIds: recipients.map(u => u.id),
    organisationId: resolvedOrganisationId,
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
      organisationId: resolvedOrganisationId,
      // Task notifications should go to My Tasks with taskId to open the dialog
      url: `/tasks/mytasks?taskId=${task.id}`,
    },
    priority: 'low',
  });
};

// Send task unassigned notification
export const sendTaskUnassignmentNotification = async ({ taskId, taskTitle, removedBy, removedUser, organisationId = null }) => {
  if (!removedUser?.id) return;
  const removedByName = removedBy?.fullName || removedBy?.name || 'Team';

  return await sendNotificationToUser({
    userId: removedUser.id,
    organisationId,
    title: 'Task Unassigned',
    body: `You were unassigned from: ${taskTitle || 'Task'} (by ${removedByName})`,
    type: 'task_unassigned',
    referenceType: 'task',
    referenceId: taskId,
    data: {
      taskId,
      taskTitle: taskTitle || 'Task',
      removedBy: removedByName,
      organisationId,
      // Task notifications should go to My Tasks with taskId to open the dialog
      url: taskId ? `/tasks/mytasks?taskId=${taskId}` : '/tasks/mytasks'
    },
    priority: 'low',
  });
};

// Send bulk task unassigned summary
export const sendBulkTaskUnassignmentNotification = async ({ removedUser, removedBy, taskTitles = [], organisationId = null }) => {
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
    organisationId,
    title: `${count} Tasks Unassigned`,
    body,
    type: 'task_unassigned_bulk',
    referenceType: 'task',
    referenceId: null,
    data: {
      taskCount: count,
      taskTitles,
      removedBy: removedByName,
      organisationId,
      url: '/tasks/mytasks'
    },
    priority: 'low'
  });
};

// Send bulk task completion notification (summary)
export const sendBulkTaskCompletionNotification = async ({ tasks = [], completedBy, notifyUser, organisationId = null }) => {
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
    organisationId: organisationId || tasks[0]?.organisationId || null,
    title: `${count} Tasks Completed`,
    body,
    type: 'task_completed_bulk',
    referenceType: 'task',
    referenceId: tasks[0]?.id,
    data: {
      taskCount: count,
      taskTitles: titles,
      completedBy: completedByName,
      organisationId: organisationId || tasks[0]?.organisationId || null,
      // Task notifications should go to My Tasks with taskId to open the dialog
      url: tasks[0]?.id ? `/tasks/mytasks?taskId=${tasks[0].id}` : '/tasks/mytasks',
    },
    priority: 'low',
  });
};

// Send task completion notification
export const sendTaskCompletionNotification = async ({ task, completedBy, notifyUsers, organisationId = null }) => {
  if (!notifyUsers || notifyUsers.length === 0) return;

  const taskTitle = task?.title || task?.name || 'Task';
  const completedByName = completedBy?.fullName || completedBy?.name || 'Someone';
  const resolvedOrganisationId = organisationId || task?.organisationId || null;

  return await sendNotificationToMultipleUsers({
    userIds: notifyUsers.map(u => u.id),
    organisationId: resolvedOrganisationId,
    title: 'Task Completed',
    body: `Task "${taskTitle}" has been completed by ${completedByName}`,
    type: 'task_completed',
    referenceType: 'task',
    referenceId: task.id,
    data: {
      taskId: task.id,
      taskTitle,
      completedBy: completedByName,
      organisationId: resolvedOrganisationId,
      // Task notifications should go to My Tasks with taskId to open the dialog
      url: `/tasks/mytasks?taskId=${task.id}`
    },
    priority: 'medium'
  });
};

// Resolve org name for notification context
const resolveOrgName = async (organisationId) => {
  if (!organisationId) return null;
  try {
    const org = await Organisation.findOne({ where: { id: organisationId }, attributes: ['name'] });
    return org?.name || null;
  } catch {
    return null;
  }
};

// Send lead creation notification
export const sendLeadCreatedNotification = async ({ lead, assignedUsers, organisationId = null }) => {
  if (!assignedUsers || assignedUsers.length === 0) return;

  const resolvedOrganisationId = organisationId || lead?.organisationId || null;
  const orgName = await resolveOrgName(resolvedOrganisationId);
  const orgSuffix = orgName ? ` in ${orgName}` : '';

  return await sendNotificationToMultipleUsers({
    userIds: assignedUsers.map(u => u.id),
    organisationId: resolvedOrganisationId,
    title: `New Lead Arrived${orgSuffix}`,
    body: `"${lead.name || lead.email}" has been assigned to you${orgSuffix}`,
    type: 'lead_created',
    referenceType: 'lead',
    referenceId: lead.id,
    data: {
      leadId: lead.id,
      leadName: lead.name || lead.email,
      leadSource: lead.source || 'Unknown',
      organisationId: resolvedOrganisationId,
      url: `/crm/leads?leadId=${lead.id}`
    },
    priority: 'high'
  });
};

// Send lead assignment notification (when assignees are added on update)
export const sendLeadAssignedNotification = async ({ lead, assignedUsers, assignedBy, organisationId = null }) => {
  if (!assignedUsers || assignedUsers.length === 0) return;
  const assignedByName = assignedBy?.fullName || assignedBy?.name || 'Team';
  const resolvedOrganisationId = organisationId || lead?.organisationId || null;
  const orgName = await resolveOrgName(resolvedOrganisationId);
  const orgSuffix = orgName ? ` in ${orgName}` : '';

  return await sendNotificationToMultipleUsers({
    userIds: assignedUsers.map(u => u.id),
    organisationId: resolvedOrganisationId,
    title: `Lead Assigned${orgSuffix}`,
    body: `"${lead.name || lead.email}" was assigned to you by ${assignedByName}${orgSuffix}`,
    type: 'lead_assigned',
    referenceType: 'lead',
    referenceId: lead.id,
    data: {
      leadId: lead.id,
      leadName: lead.name || lead.email,
      assignedBy: assignedByName,
      organisationId: resolvedOrganisationId,
      url: `/crm/leads?leadId=${lead.id}`
    },
    priority: 'high'
  });
};

// Send lead unassignment notification (when assignees are removed on update)
export const sendLeadUnassignedNotification = async ({ lead, removedUsers, removedBy, organisationId = null }) => {
  if (!removedUsers || removedUsers.length === 0) return;
  const removedByName = removedBy?.fullName || removedBy?.name || 'Team';
  const resolvedOrganisationId = organisationId || lead?.organisationId || null;
  const orgName = await resolveOrgName(resolvedOrganisationId);
  const orgSuffix = orgName ? ` in ${orgName}` : '';

  return await sendNotificationToMultipleUsers({
    userIds: removedUsers.map(u => u.id),
    organisationId: resolvedOrganisationId,
    title: `Lead Unassigned${orgSuffix}`,
    body: `You were unassigned from "${lead.name || lead.email}" by ${removedByName}${orgSuffix}`,
    type: 'lead_unassigned',
    referenceType: 'lead',
    referenceId: lead.id,
    data: {
      leadId: lead.id,
      leadName: lead.name || lead.email,
      removedBy: removedByName,
      organisationId: resolvedOrganisationId,
      url: `/crm/leads?leadId=${lead.id}`
    },
    priority: 'low'
  });
};

// Send lead status changed notification
export const sendLeadStatusChangedNotification = async ({ lead, oldStatus, newStatus, assignedUsers = [], organisationId = null }) => {
  const userIds = assignedUsers.map(u => u.id).filter(Boolean);
  if (!userIds.length) return;
  const resolvedOrganisationId = organisationId || lead?.organisationId || null;
  
  return await sendNotificationToMultipleUsers({
    userIds,
    organisationId: resolvedOrganisationId,
    title: 'Lead updated 🔄',
    body: `${lead?.name || 'Lead'} moved to ${newStatus || 'new status'}`,
    type: 'lead_status_changed',
    referenceType: 'lead',
    referenceId: lead?.id,
    data: {
      leadId: lead?.id,
      leadName: lead?.name,
      oldStatus,
      newStatus,
      url: `/crm/leads?leadId=${lead?.id || ''}`
    },
    priority: 'medium'
  });
};

// Send WhatsApp message notification
export const sendWhatsAppMessageNotification = async ({ message, lead, userId, organisationId = null }) => {
  const senderLabel = lead.name || lead.phone || lead.telephone || 'Unknown';
  const preview = String(
    typeof message === 'string'
      ? message
      : (message?.text || message?.body || message?.caption || message?.content || '')
  ).trim();
  const body = preview.length > 80 ? `${preview.slice(0, 80)}...` : preview;
  return await sendNotificationToUser({
    userId,
    organisationId,
    title: `New WhatsApp message from ${senderLabel}`,
    body,
    type: 'whatsapp_message',
    referenceType: 'lead',
    referenceId: lead.id,
    data: {
      leadId: String(lead.id || ''),
      leadName: senderLabel,
      messagePreview: preview.slice(0, 100),
      url: `/crm/leads?leadId=${lead.id}&tab=communication`,
    },
    priority: 'high',
  });
};

// Send Meta DM notification
export const sendMetaDMNotification = async ({
  message,
  sender,
  userId,
  organisationId = null,
  conversationId = null,
  platform = null,
}) => {
  const preview = String(message || '').trim();
  const senderLabel = String(sender || 'Unknown');
  const q = new URLSearchParams();
  if (conversationId) q.set('conversationId', String(conversationId));
  if (organisationId) q.set('orgId', String(organisationId));
  const url = `/crm/dms${q.toString() ? `?${q.toString()}` : ''}`;

  return await sendNotificationToUser({
    userId,
    organisationId,
    title: 'New Meta Direct Message',
    body: `New message from ${senderLabel}: ${preview.slice(0, 50)}${preview.length > 50 ? '...' : ''}`,
    type: 'meta_dm',
    referenceType: 'dm_conversation',
    referenceId: conversationId || null,
    data: {
      sender: senderLabel,
      platform: platform ? String(platform) : '',
      conversationId: conversationId ? String(conversationId) : '',
      messagePreview: preview.slice(0, 100),
      url,
    },
    priority: 'high'
  });
};


export const sendSystemSubscriptionConfirmedNotification = async ({ userId, stripeSubscriptionId = null, organisationId = null } = {}) => {
  if (!userId) return;
  return await sendNotificationToUser({
    userId,
    organisationId,
    title: 'Welcome to Flossly 🎉',
    body: 'Your subscription is active — tap to log in.',
    type: 'system_subscription_confirmed',
    referenceType: 'subscription',
    referenceId: null,
    data: {
      stripeSubscriptionId,
      url: '/'
    },
    priority: 'high'
  });
};

export const sendSystemPortalReadyNotification = async ({ userId, organisationId = null } = {}) => {
  if (!userId) return;
  return await sendNotificationToUser({
    userId,
    organisationId,
    title: 'Your portal is ready 🎉',
    body: 'Book your training session.',
    type: 'system_portal_ready',
    referenceType: 'user',
    referenceId: userId,
    data: {
      trainingUrl: 'https://calendly.com/helloflossly/flossly-training',
      url: '/dashboard'
    },
    priority: 'high'
  });
};

export const sendSupportTicketSubmittedNotification = async ({ userId, ticketId, ticketSubject, organisationId = null } = {}) => {
  if (!userId) return;
  return await sendNotificationToUser({
    userId,
    organisationId,
    title: 'Support request received ✅',
    body: "We'll get back to you shortly.",
    type: 'support_ticket_submitted',
    referenceType: 'support_ticket',
    referenceId: ticketId,
    data: {
      ticketId,
      ticketSubject,
      url: '/support-chat'
    },
    priority: 'medium'
  });
};

export const sendSupportReplyNotification = async ({ userId, ticketId, replyPreview, organisationId = null } = {}) => {
  if (!userId) return;
  return await sendNotificationToUser({
    userId,
    organisationId,
    title: 'New support message 💬',
    body: 'A reply is waiting for you.',
    type: 'support_reply',
    referenceType: 'support_ticket',
    referenceId: ticketId,
    data: {
      ticketId,
      replyPreview: replyPreview || '',
      url: '/support-chat'
    },
    priority: 'high'
  });
};

export const sendTaskDueReminderNotification = async ({ userId, taskId, taskTitle, dueDate, organisationId = null } = {}) => {
  if (!userId) return;
  return await sendNotificationToUser({
    userId,
    organisationId,
    title: 'Task reminder ⏰',
    body: `${taskTitle || 'Task'} is due ${dueDate || 'soon'}`,
    type: 'task_due_reminder',
    referenceType: 'task',
    referenceId: taskId,
    data: {
      taskId,
      taskTitle,
      dueDate,
      // Task notifications should go to My Tasks with taskId to open the dialog
      url: `/tasks/mytasks?taskId=${taskId}`
    },
    priority: 'medium'
  });
};

export const sendTaskOverdueReminderNotification = async ({ userId, taskIds = [], count = 0, organisationId = null } = {}) => {
  if (!userId) return;
  return await sendNotificationToUser({
    userId,
    organisationId,
    title: 'You have overdue tasks ⏰',
    body: 'Tap to review now.',
    type: 'task_overdue_reminder',
    referenceType: 'task',
    referenceId: taskIds.length === 1 ? taskIds[0] : null,
    data: {
      taskIds,
      count,
      // Task notifications should go to My Tasks with taskId to open the dialog
      url: taskIds.length > 0 ? `/tasks/mytasks?taskId=${taskIds[0]}` : '/tasks/mytasks'
    },
    priority: 'high'
  });
};

// Rota/Shift/Leave notifications
export const sendRotaPublishedNotification = async ({ userId, rotaId, weekStartDate, organisationId = null } = {}) => {
  if (!userId) return;
  return await sendNotificationToUser({
    userId,
    organisationId,
    title: 'New rota available 📅',
    body: 'Check your upcoming shifts.',
    type: 'rota_published',
    referenceType: 'rota',
    referenceId: rotaId,
    data: {
      rotaId,
      weekStartDate,
      url: '/teams/rota'
    },
    priority: 'medium'
  });
};

export const sendShiftReminderNotification = async ({ userId, shiftDate, shiftTime, organisationId = null } = {}) => {
  if (!userId) return;
  return await sendNotificationToUser({
    userId,
    organisationId,
    title: 'Shift reminder ⏳',
    body: `You're scheduled on ${shiftDate || 'your shift date'}.`,
    type: 'shift_reminder',
    referenceType: 'shift',
    referenceId: null,
    data: {
      shiftDate,
      shiftTime,
      url: '/teams/rota'
    },
    priority: 'medium'
  });
};

export const sendLeaveApprovedNotification = async ({ userId, startDate, endDate, organisationId = null } = {}) => {
  if (!userId) return;
  return await sendNotificationToUser({
    userId,
    organisationId,
    title: 'Leave approved ✅',
    body: 'Your schedule has been updated.',
    type: 'leave_approved',
    referenceType: 'leave',
    referenceId: null,
    data: {
      startDate,
      endDate,
      url: '/teams/rota'
    },
    priority: 'high'
  });
};

export const sendLeaveDeniedNotification = async ({ userId, startDate, endDate, reason = null, organisationId = null } = {}) => {
  if (!userId) return;
  return await sendNotificationToUser({
    userId,
    organisationId,
    title: 'Leave request update ❌',
    body: 'Please review the decision.',
    type: 'leave_denied',
    referenceType: 'leave',
    referenceId: null,
    data: {
      startDate,
      endDate,
      reason,
      url: '/teams/rota'
    },
    priority: 'high'
  });
};

// CRM Automation notifications
export const sendCrmAutomationSentNotification = async ({ userId, lead, automationName, channel = 'Email', organisationId = null }) => {
  if (!userId) return;
  return await sendNotificationToUser({
    userId,
    organisationId,
    title: 'Automation sent ✅',
    body: `${channel} sent to ${lead?.name || lead?.email || 'lead'} via ${automationName || 'automation'}`,
    type: 'crm_automation_sent',
    referenceType: 'lead',
    referenceId: lead?.id,
    data: {
      leadId: lead?.id,
      leadName: lead?.name || lead?.email,
      automationName,
      channel,
      url: `/crm/leads?leadId=${lead?.id}`
    },
    priority: 'low'
  });
};

export const sendCrmAutomationFailedNotification = async ({ userId, lead, automationName, channel = 'Email', errorMessage = 'Unknown error', organisationId = null }) => {
  if (!userId) return;
  return await sendNotificationToUser({
    userId,
    organisationId,
    title: 'Automation failed ❌',
    body: `${channel} to ${lead?.name || lead?.email || 'lead'} failed: ${errorMessage}`,
    type: 'crm_automation_failed',
    referenceType: 'lead',
    referenceId: lead?.id,
    data: {
      leadId: lead?.id,
      leadName: lead?.name || lead?.email,
      automationName,
      channel,
      errorMessage,
      url: `/crm/leads?leadId=${lead?.id}`
    },
    priority: 'medium'
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
export const getUserNotifications = async (userId, { limit = 50, offset = 0, unreadOnly = false, organisationId = null } = {}) => {
  try {
    const where = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    // Filter by organisation: show current org + null org (global notifications)
    if (organisationId !== null && organisationId !== undefined) {
      where[Op.or] = [
        { organisationId: Number(organisationId) },
        { organisationId: null }
      ];
    }

    const notifications = await UserNotification.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    // Unread count should also respect org filter
    const unreadWhere = { userId, isRead: false };
    if (organisationId !== null && organisationId !== undefined) {
      unreadWhere[Op.or] = [
        { organisationId: Number(organisationId) },
        { organisationId: null }
      ];
    }

    return {
      success: true,
      notifications: notifications.rows,
      total: notifications.count,
      unreadCount: unreadOnly ? notifications.count : await UserNotification.count({
        where: unreadWhere
      })
    };
  } catch (error) {
    console.error('Error getting user notifications:', error);
    return { success: false, error: error.message };
  }
};

