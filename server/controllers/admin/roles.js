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

export const getAllRoles = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const roles = await Role.findAll({
      order: [['id', 'ASC']]
    });

    return success(roles);
  } catch (err) {
    console.error('Get all roles error:', err);
    return error(500, err.message);
  }
};

/**
 * Update user status (activate/deactivate)
 */

export const searchRoles = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const query = getQuery(event);
    const { search = '', page = 1, limit = 20 } = query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const whereClause = {};
    
    // Add title search if provided
    if (search.trim()) {
      whereClause.title = {
        [Op.iLike]: `%${search.trim()}%`
      };
    }

    // Get roles with pagination
    const { count, rows: roles } = await Role.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'title', 'roleType', 'description', 'icon', 'color', 'createdAt'],
      order: [['title', 'ASC']],
      limit: parseInt(limit),
      offset
    });

    // Get user count for each role
    const rolesWithCounts = await Promise.all(
      roles.map(async (role) => {
        const userCount = await User.count({
          where: { roleId: role.id }
        });
        
        return {
          id: role.id,
          title: role.title,
          roleType: role.roleType,
          description: role.description,
          icon: role.icon,
          color: role.color,
          userCount,
          createdAt: role.createdAt
        };
      })
    );

    return success({
      roles: rolesWithCounts,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });

  } catch (err) {
    console.error('Search roles error:', err);
    return error(500, err.message || "Failed to search roles");
  }
};