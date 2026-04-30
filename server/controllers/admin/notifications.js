import { success, error } from '../../utils/response';
import {
  User, UserOrganisation, Organisation, Role, LoginHistory, UserSubscription, UserPreference,
  UserDocument, UserDocumentFolder, CrmLead, UserTask, DiaryAppointment, UserNotification, Task, TaskCategory,
  CrmAutomationTemplate, CrmAutomationGroup, CrmAutomationGroupTemplate, FcmToken, UserPoint, UserPointsHistory, RewardPoint,
  CrmOption, DictionaryScript, Rota, RotaShift, RotaUser, UserLeaveHistory,
  CrmAutomationDictionaryGroup, CrmAutomationDictionaryTemplate,
  ClinicalNoteTemplate, ClinicalNoteTemplateVersion,
} from '../../models';
import { seedCrmAutomationDictionary as runSeedCrmAutomationDictionary } from '../../utils/seedCrmAutomationDictionary';
import { seedConsentFormTemplates as runSeedConsentFormTemplates } from '../../utils/seedConsentFormTemplates';
import { Op, fn, col } from 'sequelize';
import { getRouterParam, getQuery, readBody, setResponseHeader } from 'h3';
import sequelize from '../../utils/db';
import { sendInvitationEmail } from '../../utils/emailNotifications';
import { v4 as uuidv4 } from 'uuid';
import stripe from '../../utils/stripe';
import { getS3Object } from '../../utils/s3';
import { sendNotificationToMultipleUsers } from '../../utils/fcmNotification';
import { bulkUploadAutomations as crmBulkUploadAutomations, bulkUploadLeads as crmBulkUploadLeads } from '../crm';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import * as XLSX from 'xlsx';
import {
  createClinicalTemplateWithVersion,
  sanitizeClinicalNoteTemplatePayload,
  serializeClinicalTemplate,
  serializeClinicalTemplateVersion,
  updateClinicalTemplateWithVersion,
} from '../../utils/clinicalNoteTemplates';
import { parseJsonBody } from '../../utils/body';

export const broadcastNotification = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const body = await readBody(event);
  const { title, message, organisationId, roleId, priority = 'medium', data = {} } = body;

  if (!title || !message) {
    return error(400, "title and message are required");
  }

  try {
    // Build user filter - include Active users and users with NULL status
    const userWhere = { 
      [Op.or]: [
        { status: 'Active' },
        { status: null }
      ]
    };
    
    if (organisationId) {
      // Get users in specific organisation
      const userOrgs = await UserOrganisation.findAll({
        where: { organisationId: parseInt(organisationId) },
        attributes: ['userId']
      });
      userWhere.id = { [Op.in]: userOrgs.map(uo => uo.userId) };
    }
    
    if (roleId) {
      userWhere.roleId = parseInt(roleId);
    }

    // Get target users
    const targetUsers = await User.findAll({
      where: userWhere,
      attributes: ['id', 'fullName', 'email']
    });

    if (targetUsers.length === 0) {
      return error(400, "No users found matching the criteria");
    }

    const userIds = targetUsers.map(u => u.id);

    // Send FCM notifications (this will create notification records for each user)
    let sentCount = 0;
    let failedCount = 0;
    const fcmResults = [];

    if (userIds.length > 0) {
      try {
        const results = await sendNotificationToMultipleUsers({
          userIds,
          organisationId: organisationId || null,
          title,
          body: message,
          type: 'admin_broadcast',
          referenceType: null,
          referenceId: null,
          data: {
            ...data,
            broadcastBy: admin.userId,
            broadcastAt: new Date().toISOString()
          },
          priority
        });

        // Count successes and failures from results
        results.forEach(result => {
          if (result.success) {
            sentCount++;
          } else {
            failedCount++;
          }
        });

        fcmResults.push(...results);

        // Mark notifications as sent (only for users who received the notification successfully)
        const successfulNotificationIds = results
          .filter(r => r.success && r.notificationId)
          .map(r => r.notificationId);
        
        if (successfulNotificationIds.length > 0) {
          await UserNotification.update(
            { isSent: true, sentAt: new Date() },
            { where: { id: { [Op.in]: successfulNotificationIds } } }
          );
        }
      } catch (err) {
        console.error('FCM broadcast error:', err);
        failedCount = userIds.length;
      }
    }

    return success({
      message: 'Broadcast notification sent successfully',
      stats: {
        totalUsers: targetUsers.length,
        notificationsCreated: sentCount + failedCount,
        fcmSent: sentCount,
        fcmFailed: failedCount,
        usersWithoutFcmTokens: targetUsers.length - sentCount - failedCount
      },
      broadcast: {
        title,
        message,
        priority,
        organisationId: organisationId || 'All',
        roleId: roleId || 'All',
        broadcastBy: admin.userId,
        broadcastAt: new Date()
      }
    });
  } catch (err) {
    console.error('Broadcast notification error:', err);
    return error(500, err.message);
  }
};

/**
 * Get notification delivery statistics
 * Track notification delivery success/failure rates
 */

export const getNotificationDeliveryStats = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const query = getQuery(event);
  const { organisationId, startDate, endDate, type } = query;

  try {
    // Build where clause
    const whereClause = {};
    
    if (organisationId) {
      whereClause.organisationId = parseInt(organisationId);
    }
    
    if (type) {
      whereClause.type = type;
    }
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate);
      if (endDate) whereClause.createdAt[Op.lte] = new Date(endDate);
    }

    // Get statistics
    const [
      totalNotifications,
      sentNotifications,
      failedNotifications,
      readNotifications,
      unreadNotifications
    ] = await Promise.all([
      UserNotification.count({ where: whereClause }),
      UserNotification.count({ where: { ...whereClause, isSent: true } }),
      UserNotification.count({ where: { ...whereClause, isSent: false, errorMessage: { [Op.ne]: null } } }),
      UserNotification.count({ where: { ...whereClause, isRead: true } }),
      UserNotification.count({ where: { ...whereClause, isRead: false } })
    ]);

    // Get stats by type
    const notificationsByType = await UserNotification.findAll({
      where: whereClause,
      attributes: [
        'type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN "isSent" = true THEN 1 ELSE 0 END')), 'sent'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN "isRead" = true THEN 1 ELSE 0 END')), 'read']
      ],
      group: ['type'],
      raw: true
    });

    // Get stats by priority
    const notificationsByPriority = await UserNotification.findAll({
      where: whereClause,
      attributes: [
        'priority',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN "isRead" = true THEN 1 ELSE 0 END')), 'read']
      ],
      group: ['priority'],
      raw: true
    });

    // Calculate rates
    const deliveryRate = totalNotifications > 0 ? ((sentNotifications / totalNotifications) * 100).toFixed(2) + '%' : '0%';
    const readRate = totalNotifications > 0 ? ((readNotifications / totalNotifications) * 100).toFixed(2) + '%' : '0%';
    const failureRate = totalNotifications > 0 ? ((failedNotifications / totalNotifications) * 100).toFixed(2) + '%' : '0%';

    return success({
      summary: {
        totalNotifications,
        sent: sentNotifications,
        failed: failedNotifications,
        read: readNotifications,
        unread: unreadNotifications,
        deliveryRate,
        readRate,
        failureRate
      },
      byType: notificationsByType.map(item => ({
        type: item.type,
        total: parseInt(item.count),
        sent: parseInt(item.sent || 0),
        read: parseInt(item.read || 0),
        readRate: item.count > 0 ? ((parseInt(item.read || 0) / parseInt(item.count)) * 100).toFixed(2) + '%' : '0%'
      })),
      byPriority: notificationsByPriority.map(item => ({
        priority: item.priority,
        total: parseInt(item.count),
        read: parseInt(item.read || 0),
        readRate: item.count > 0 ? ((parseInt(item.read || 0) / parseInt(item.count)) * 100).toFixed(2) + '%' : '0%'
      })),
      filters: {
        organisationId: organisationId || 'All',
        type: type || 'All',
        startDate: startDate || null,
        endDate: endDate || null
      }
    });
  } catch (err) {
    console.error('Get notification delivery stats error:', err);
    return error(500, err.message);
  }
};

/**
 * Admin-assisted resend invite
 * Resends invitation email to users with status "Invited"
 */
