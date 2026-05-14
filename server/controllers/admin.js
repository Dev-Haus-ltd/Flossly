import { success, error } from '../utils/response';
import {
  User, UserOrganisation, Organisation, Role, LoginHistory, UserSubscription, UserPreference,
  UserDocument, UserDocumentFolder, CrmLead, UserTask, DiaryAppointment, UserNotification, Task, TaskCategory,
  CrmAutomationTemplate, CrmAutomationGroup, CrmAutomationGroupTemplate, FcmToken, UserPoint, UserPointsHistory, RewardPoint,
  CrmOption, DictionaryScript, Rota, RotaShift, RotaUser, UserLeaveHistory,
  CrmAutomationDictionaryGroup, CrmAutomationDictionaryTemplate,
} from '../models';
import { seedCrmAutomationDictionary as runSeedCrmAutomationDictionary } from '../utils/seedCrmAutomationDictionary';
import { Op, fn, col } from 'sequelize';
import sequelize from '../utils/db';
import { sendInvitationEmail } from '../utils/emailNotifications';
import { v4 as uuidv4 } from 'uuid';
import stripe from '../utils/stripe';
import { getS3Object } from '../utils/s3';
import { sendNotificationToMultipleUsers } from '../utils/fcmNotification';
import { bulkUploadAutomations as crmBulkUploadAutomations, bulkUploadLeads as crmBulkUploadLeads } from './crm';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import * as XLSX from 'xlsx';

const CRM_OPTION_CATEGORY_LABELS = {
  treatment: 'Treatment',
  lead_source: 'Lead source',
};
const DEFAULT_ADMIN_ALERT_OPTIONS = [
  { key: 'hot', label: 'Hot lead alerts', emoji: '🔥', color: 'error' },
  { key: 'time', label: 'Time-sensitive deadlines', emoji: '⏰', color: 'warning' },
  { key: 'value', label: 'High-value opportunity', emoji: '💸', color: 'tertiary' },
  { key: 'follow', label: 'Follow-up reminders', emoji: '🔄', color: 'info' },
  { key: 'callback', label: 'Callback scheduled', emoji: '📞', color: 'success' },
  { key: 'none', label: 'No response warnings', emoji: '🚨', color: 'on-surface' },
];
const DEFAULT_CRM_FEATURE_ACCESS = {
  meta: true,
  whatsapp: true,
  chatbot: true,
};
const ADMIN_UPLOAD_ALLOWED_EXTENSIONS = new Set(['csv', 'xls', 'xlsx']);
const ADMIN_AUTOMATION_ALLOWED_EXTENSIONS = ADMIN_UPLOAD_ALLOWED_EXTENSIONS;
const ADMIN_LEAD_REQUIRED_COLUMNS = ['name', 'email', 'telephone'];
const ADMIN_AUTOMATION_REQUIRED_COLUMNS = ['group_name', 'type', 'name', 'content'];
const ADMIN_AUTOMATION_COLUMN_ALIASES = {
  group_name: ['group', 'group name', 'automation group', 'category', 'automation category', 'group_name', 'groupname'],
  type: ['type', 'automation type'],
  name: ['name', 'automation name', 'title'],
  subject: ['subject', 'email subject'],
  content: ['content', 'message', 'body', 'template', 'automation content'],
};

const normalizeAdminAutomationHeaderKey = (key) =>
  String(key || '')
    .toLowerCase()
    .replace(/[\u200B\uFEFF]/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const resolveAdminAutomationHeaderKey = (header) => {
  const normalized = normalizeAdminAutomationHeaderKey(header);
  for (const [canonical, aliases] of Object.entries(ADMIN_AUTOMATION_COLUMN_ALIASES)) {
    if (aliases.includes(normalized)) return canonical;
  }
  return normalized;
};

const normalizeAdminAutomationType = (value) => {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return 'Email';
  if (raw.includes('whatsapp') || raw === 'wa' || raw === 'whats app') return 'WhatsApp';
  return 'Email';
};

const adminAutomationHasHtml = (value) => /<\s*\/?[^>]+>/.test(String(value || ''));

const normalizeAdminAutomationUploadRow = (row = {}) => {
  const normalized = {};
  Object.entries(row || {}).forEach(([key, value]) => {
    const canonical = resolveAdminAutomationHeaderKey(key);
    if (!canonical) return;
    normalized[canonical] = value ?? '';
  });

  const groupName = String(normalized.group_name || '').trim();
  const type = normalizeAdminAutomationType(normalized.type);
  const name = String(normalized.name || '').trim();
  const subject = String(normalized.subject || '').trim();
  const content = String(normalized.content || '').trim();

  return {
    groupName,
    type,
    name,
    subject: type === 'Email' ? (subject || name) : '',
    content,
  };
};

const validateAdminAutomationUploadRow = (row, rowNum) => {
  const errors = [];

  if (!row.groupName?.trim()) errors.push(`Row ${rowNum}: Group name is required`);
  if (!row.name?.trim()) errors.push(`Row ${rowNum}: Name is required`);
  if (!row.content?.trim()) errors.push(`Row ${rowNum}: Content is required`);
  if (adminAutomationHasHtml(row.content)) errors.push(`Row ${rowNum}: Content must be plain text (no HTML)`);
  if (!['Email', 'WhatsApp'].includes(row.type)) errors.push(`Row ${rowNum}: Invalid type`);

  return errors;
};

const parseAdminAutomationUploadFile = (filePart) => {
  if (!filePart?.data?.length) {
    throw new Error('No file uploaded');
  }

  const originalName = filePart.filename || 'automation-upload.csv';
  const extension = extname(originalName).replace('.', '').toLowerCase();

  if (!ADMIN_AUTOMATION_ALLOWED_EXTENSIONS.has(extension)) {
    throw new Error('Unsupported file format. Please upload a CSV, XLS, or XLSX file');
  }

  const workbook = extension === 'csv'
    ? XLSX.read(filePart.data.toString('utf8'), { type: 'string' })
    : XLSX.read(filePart.data, { type: 'buffer' });

  if (!workbook.SheetNames?.length) {
    throw new Error('Invalid file - no sheets found');
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const sheetRows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    raw: false,
  });

  if (!sheetRows.length) {
    throw new Error('No rows found in the file');
  }

  const headers = (sheetRows[0] || []).map((header) => String(header || '').trim());
  if (!headers.some((header) => header)) {
    throw new Error('Invalid file - header row is empty');
  }

  const normalizedKeys = headers.map((header) => resolveAdminAutomationHeaderKey(header));
  const missingColumns = ADMIN_AUTOMATION_REQUIRED_COLUMNS.filter((column) => !normalizedKeys.includes(column));
  if (missingColumns.length) {
    throw new Error(`Invalid file structure - missing required columns: ${missingColumns.join(', ')}`);
  }

  const rawRows = sheetRows.slice(1).map((row) => {
    const record = {};
    headers.forEach((header, index) => {
      if (!header) return;
      record[header] = row?.[index] ?? '';
    });
    return record;
  }).filter((row) => Object.values(row).some((value) => String(value || '').trim() !== ''));

  if (!rawRows.length) {
    throw new Error('No rows found in the file');
  }

  const items = [];
  const validationErrors = [];

  rawRows.forEach((row, index) => {
    const rowNum = index + 2;
    const normalizedRow = normalizeAdminAutomationUploadRow(row);
    validationErrors.push(...validateAdminAutomationUploadRow(normalizedRow, rowNum));
    items.push(normalizedRow);
  });

  if (validationErrors.length) {
    throw new Error(validationErrors.join('; '));
  }

  return items;
};

const normalizeAdminLeadHeaderKey = (key) =>
  String(key || '')
    .toLowerCase()
    .replace(/[\u200B\uFEFF]/g, '')
    .replace(/[_-]+/g, '')
    .replace(/[^\w]/g, '')
    .trim();

const parseAdminLeadUploadFile = async ({ filePart, organisationId }) => {
  if (!filePart?.data?.length) {
    throw new Error('No file uploaded');
  }

  const originalName = filePart.filename || 'lead-upload.csv';
  const extension = extname(originalName).replace('.', '').toLowerCase();

  if (!ADMIN_UPLOAD_ALLOWED_EXTENSIONS.has(extension)) {
    throw new Error('Unsupported file format. Please upload a CSV, XLS, or XLSX file');
  }

  const workbook = extension === 'csv'
    ? XLSX.read(filePart.data.toString('utf8'), { type: 'string' })
    : XLSX.read(filePart.data, { type: 'buffer' });

  if (!workbook.SheetNames?.length) {
    throw new Error('Invalid file - no sheets found');
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const sheetRows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    raw: false,
  });

  if (!sheetRows.length) {
    throw new Error('No rows found in the file');
  }

  const headers = (sheetRows[0] || []).map((header) => String(header || '').trim());
  if (!headers.some((header) => header)) {
    throw new Error('Invalid file - header row is empty');
  }

  const normalizedKeys = headers.map((header) => normalizeAdminLeadHeaderKey(header));
  const missingColumns = ADMIN_LEAD_REQUIRED_COLUMNS.filter((column) => !normalizedKeys.includes(column));
  if (missingColumns.length) {
    throw new Error(`Invalid file structure - missing required columns: ${missingColumns.join(', ')}`);
  }

  const users = await User.findAll({
    attributes: ['id', 'fullName', 'email'],
    include: [{
      model: UserOrganisation,
      as: 'userOrganisations',
      where: { organisationId: Number(organisationId) },
      attributes: ['status'],
      required: true,
    }],
  });

  const activeUsers = users.filter((user) => {
    const membership = Array.isArray(user.userOrganisations) ? user.userOrganisations[0] : null;
    return membership?.status === 'Active';
  });

  const findAssignedUserId = (value) => {
    const assigned = String(value || '').trim().toLowerCase();
    if (!assigned) return null;
    const match = activeUsers.find((user) => {
      const fullName = String(user.fullName || '').trim().toLowerCase();
      const email = String(user.email || '').trim().toLowerCase();
      return fullName === assigned || email === assigned;
    });
    return match?.id || null;
  };

  const rawRows = sheetRows.slice(1).map((row) => {
    const record = {};
    headers.forEach((header, index) => {
      if (!header) return;
      record[header] = row?.[index] ?? '';
    });
    return record;
  }).filter((row) => Object.values(row).some((value) => String(value || '').trim() !== ''));

  if (!rawRows.length) {
    throw new Error('No rows found in the file');
  }

  const leads = [];
  const validationErrors = [];
  const seenEmails = new Set();

  rawRows.forEach((row, index) => {
    const rowNum = index + 2;
    const normalized = {};
    Object.entries(row || {}).forEach(([key, value]) => {
      normalized[normalizeAdminLeadHeaderKey(key)] = value ?? '';
    });

    const lead = {
      name: String(normalized.name || '').trim(),
      email: String(normalized.email || '').trim(),
      telephone: String(normalized.telephone || '').trim(),
      leadSource: String(normalized.leadsource || '').trim() || 'Manual',
      leadStatus: String(normalized.leadstatus || '').trim() || 'New',
      treatment: String(normalized.treatment || '').trim() || null,
      assignedUserId: findAssignedUserId(normalized.assigned),
      inquiryDate: String(normalized.inquirydate || '').trim() || null,
      followUpDate: String(normalized.followupdate || '').trim() || null,
      comments: String(normalized.comments || '').trim() || '',
    };

    if (!lead.name) validationErrors.push(`Row ${rowNum}: Name is required`);
    if (!lead.email) validationErrors.push(`Row ${rowNum}: Email is required`);
    if (!lead.telephone) validationErrors.push(`Row ${rowNum}: Telephone is required`);
    if (lead.email) {
      const emailKey = lead.email.toLowerCase();
      if (seenEmails.has(emailKey)) validationErrors.push(`Row ${rowNum}: Duplicate email in upload`);
      seenEmails.add(emailKey);
    }

    leads.push(lead);
  });

  if (validationErrors.length) {
    throw new Error(validationErrors.join('; '));
  }

  return leads;
};

const requireAdmin = (event) => {
  const admin = event.context.admin;
  if (!admin) error(403, 'Admin access required');
  return admin;
};

const parseRequestPayload = async (event) => {
  const body = await readBody(event);
  return typeof body === 'string' ? parseJsonBody(body) : body;
};

const readOrganisationId = async (event, payload = null) => {
  const query = getQuery(event) || {};
  const source = payload || query || {};
  const organisationId = Number(source.organisationId || source.orgId || 0);
  if (!organisationId) error(400, 'organisationId is required');
  const organisation = await Organisation.findByPk(organisationId, { attributes: ['id', 'automationPlaceholders'] });
  if (!organisation) error(404, 'Organisation not found');
  return organisation;
};

const validateCrmOptionCategory = (category) => {
  if (!CRM_OPTION_CATEGORY_LABELS[category]) error(400, 'Unsupported CRM option category');
  return category;
};

const normalizeCrmOptionName = (value) => String(value || '').trim();

const listAdminCrmOptionsByCategory = async (organisationId, category) => {
  return await CrmOption.findAll({
    where: { organisationId: Number(organisationId), category },
    order: [['ordering', 'ASC'], ['name', 'ASC'], ['id', 'ASC']],
  });
};

const getAdminCrmOptionById = async ({ organisationId, category, id }) => {
  const row = await CrmOption.findOne({
    where: { id: Number(id), organisationId: Number(organisationId), category },
  });
  if (!row) error(404, `${CRM_OPTION_CATEGORY_LABELS[category]} not found`);
  return row;
};

const ensureUniqueAdminCrmOptionName = async ({ organisationId, category, name, excludeId = null }) => {
  const where = {
    organisationId: Number(organisationId),
    category,
  };

  if (excludeId) {
    where.id = { [Op.ne]: Number(excludeId) };
  }

  const existing = await CrmOption.findOne({
    where: {
      ...where,
      [Op.and]: [
        sequelize.where(
          sequelize.fn('LOWER', sequelize.col('name')),
          String(name || '').trim().toLowerCase()
        ),
      ],
    },
  });

  if (existing) error(409, `${CRM_OPTION_CATEGORY_LABELS[category]} already exists`);
};

const sanitizeAlertOptionInput = (payload = {}, existingKey = null) => {
  const key = String(payload.key || existingKey || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 50);
  const label = String(payload.label || '').trim();
  const emoji = payload.emoji == null ? '' : String(payload.emoji).trim();
  const color = payload.color == null ? '' : String(payload.color).trim();

  if (!key) error(400, 'key is required');
  if (!label) error(400, 'label is required');
  if (label.length > 100) error(400, 'label cannot exceed 100 characters');

  return { key, label, emoji, color };
};

const sanitizeDictionaryScriptPayload = (payload = {}, existingKey = null) => {
  const key = String(payload.key || existingKey || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 100);
  const title = String(payload.title || '').trim();
  const content = String(payload.content || '').trim();
  const sortOrder = payload.sortOrder == null || payload.sortOrder === '' ? 0 : Number(payload.sortOrder);

  if (!key) error(400, 'key is required');
  if (!title) error(400, 'title is required');
  if (!content) error(400, 'content is required');
  if (!Number.isFinite(sortOrder)) error(400, 'sortOrder must be a valid number');

  return { key, title, content, sortOrder };
};

const getOrganisationAlertOptions = (organisation) => {
  const stored = organisation?.automationPlaceholders?.alertOptions;
  return Array.isArray(stored) && stored.length ? [...stored] : [...DEFAULT_ADMIN_ALERT_OPTIONS];
};

const saveOrganisationAlertOptions = async (organisation, options) => {
  organisation.automationPlaceholders = {
    ...(organisation.automationPlaceholders || {}),
    alertOptions: options,
  };
  await organisation.save();
  return options;
};

const getOrganisationCrmFeatureAccess = (organisation) => {
  const stored = organisation?.automationPlaceholders?.crmFeatureAccess;
  return {
    ...DEFAULT_CRM_FEATURE_ACCESS,
    ...(stored && typeof stored === 'object' ? stored : {}),
  };
};

const sanitizeCrmFeatureAccessInput = (payload = {}) => ({
  meta: payload.meta !== undefined ? Boolean(payload.meta) : undefined,
  whatsapp: payload.whatsapp !== undefined ? Boolean(payload.whatsapp) : undefined,
  chatbot: payload.chatbot !== undefined ? Boolean(payload.chatbot) : undefined,
});

const saveOrganisationCrmFeatureAccess = async (organisation, updates = {}) => {
  const next = {
    ...getOrganisationCrmFeatureAccess(organisation),
    ...Object.fromEntries(Object.entries(updates).filter(([, value]) => value !== undefined)),
  };
  organisation.automationPlaceholders = {
    ...(organisation.automationPlaceholders || {}),
    crmFeatureAccess: next,
  };
  await organisation.save();
  return next;
};

/**
 * Search users with advanced filters
 * Returns users with their roles, organizations, and last login info
 */
export const searchUsers = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const query = getQuery(event);
  const {
    search,
    roleId,
    status,
    organisationId,
    limit = 50,
    offset = 0,
    sortBy = 'createdAt',
    sortOrder = 'DESC'
  } = query;

  try {
    const whereClause = {};

    // Search by name or email
    if (search) {
      whereClause[Op.or] = [
        { fullName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Filter by role
    if (roleId) {
      whereClause.roleId = roleId;
    }

    // Filter by status
    if (status) {
      whereClause.status = status;
    }

    const users = await User.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'title', 'roleType']
        },
        {
          model: UserOrganisation,
          as: 'userOrganisations',
          ...(organisationId && { where: { organisationId } }),
          include: [
            {
              model: Organisation,
              as: 'organisation',
              attributes: ['id', 'name', 'status']
            }
          ]
        },
        {
          model: LoginHistory,
          limit: 1,
          order: [['createdAt', 'DESC']],
          required: false,
          attributes: ['id', 'createdAt', 'browserAgent']
        }
      ],
      attributes: {
        exclude: ['password']
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder]],
      distinct: true
    });

    return success({
      users: users.rows,
      total: users.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    console.error('Search users error:', err);
    return error(500, err.message);
  }
};

/**
 * Get detailed user information by ID
 * Includes all organizations, roles, and login history
 */
export const getUserById = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const query = getQuery(event);
  const { userId } = query;

  if (!userId) {
    return error(400, "userId is required");
  }

  try {
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Role,
          as: 'role'
        },
        {
          model: UserOrganisation,
          as: 'userOrganisations',
          include: [
            {
              model: Organisation,
              as: 'organisation'
            }
          ]
        },
        {
          model: LoginHistory,
          limit: 20,
          order: [['createdAt', 'DESC']],
          attributes: ['id', 'createdAt', 'browserAgent']
        }
      ],
      attributes: {
        exclude: ['password']
      }
    });

    if (!user) {
      return error(404, "User not found");
    }

    return success(user);
  } catch (err) {
    console.error('Get user by ID error:', err);
    return error(500, err.message);
  }
};

/**
 * Get all roles in the system
 */
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
export const updateUserStatus = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const body = await readBody(event);
  const { userId, organisationId, status } = body;

  if (!userId || !organisationId || !status) {
    return error(400, "userId, organisationId, and status are required");
  }

  // Valid status values matching the UserOrganisation model enum
  if (!['Active', 'Disabled', 'Invited', 'Expired'].includes(status)) {
    return error(400, "Invalid status. Must be Active, Disabled, Invited, or Expired");
  }

  try {
    const { UserOrganisation } = await import('../models/index.js');
    
    // Find the UserOrganisation record
    const userOrg = await UserOrganisation.findOne({
      where: {
        userId,
        organisationId
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'fullName']
        },
        {
          model: Organisation,
          as: 'organisation',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!userOrg) {
      return error(404, "User not found in the specified organisation");
    }

    userOrg.status = status;
    await userOrg.save();

    return success({
      message: `User status updated to ${status} for organisation ${userOrg.organisation.name}`,
      userOrganisation: {
        userId: userOrg.userId,
        organisationId: userOrg.organisationId,
        status: userOrg.status,
        user: userOrg.user,
        organisation: userOrg.organisation
      }
    });
  } catch (err) {
    console.error('Update user organisation status error:', err);
    return error(500, err.message);
  }
};

/**
 * Get login history for a specific user
 */
export const getUserLoginHistory = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const query = getQuery(event);
  const { userId, limit = 50, offset = 0 } = query;

  if (!userId) {
    return error(400, "userId is required");
  }

  try {
    const loginHistory = await LoginHistory.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return success({
      loginHistory: loginHistory.rows,
      total: loginHistory.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    console.error('Get user login history error:', err);
    return error(500, err.message);
  }
};

/**
 * Admin-assisted reset password
 * Allows admins to reset a user's password without OTP verification
 */
export const resetUserPassword = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const body = await readBody(event);
  const { userId, newPassword } = body;

  if (!userId || !newPassword) {
    return error(400, "userId and newPassword are required");
  }

  // Validate password strength
  if (newPassword.length < 8) {
    return error(400, "Password must be at least 8 characters long");
  }

  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return error(404, "User not found");
    }

    // Hash the new password
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    user.password = hashedPassword;
    await user.save();

    // Get admin user details for logging
    const adminUser = await User.findByPk(admin.userId);

    return success({
      message: `Password reset successfully for ${user.email}`,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName
      },
      resetBy: adminUser ? adminUser.fullName : 'Admin'
    });
  } catch (err) {
    console.error('Reset user password error:', err);
    return error(500, err.message);
  }
};

/**
 * Get organisations with trials expiring in X days
 * Monitors organizations with trial periods ending soon (uses UserPreferences)
 */
export const getOrgsTrialsExpiringInXDays = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const query = getQuery(event);
  const { days = 7, limit = 50, offset = 0 } = query;

  try {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + parseInt(days));
    
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    // Get all trial licenses from UserPreferences
    const trialPreferences = await UserPreference.findAll({
      where: {
        licenseType: 'Trial',
        licenseRenewalDate: {
          [Op.lte]: endDate,
          [Op.gte]: new Date()
        }
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });

    // Fetch organisations separately
    const orgIds = [...new Set(trialPreferences.map(p => p.organisationId).filter(Boolean))];
    const organisations = await Organisation.findAll({
      where: { id: { [Op.in]: orgIds } },
      attributes: ['id', 'name']
    });
    const orgMap = Object.fromEntries(organisations.map(o => [o.id, o.name]));

    const expiringTrials = trialPreferences.map(pref => {
      const daysRemaining = Math.ceil((new Date(pref.licenseRenewalDate) - new Date()) / (1000 * 60 * 60 * 24));
      
      return {
        organisationId: pref.organisationId,
        organisationName: orgMap[pref.organisationId] || 'Unknown',
        userId: pref.userId,
        userName: pref.user?.fullName,
        userEmail: pref.user?.email,
        licenseType: pref.licenseType,
        licenseBillingCycle: pref.licenseBillingCycle,
        licenseRenewalDate: pref.licenseRenewalDate,
        daysRemaining: daysRemaining
      };
    });

    // Sort by days remaining (ascending)
    expiringTrials.sort((a, b) => a.daysRemaining - b.daysRemaining);

    // Apply pagination
    const paginatedResults = expiringTrials.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    return success({
      trials: paginatedResults,
      total: expiringTrials.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
      daysFilter: parseInt(days)
    });
  } catch (err) {
    console.error('Get trials expiring error:', err);
    return error(500, err.message);
  }
};

/**
 * Get past-due organisations
 * Organizations with overdue payments (uses UserSubscriptions.stripeSubscriptionStatus)
 */
export const getPastDueOrgs = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const query = getQuery(event);
  const { limit = 50, offset = 0 } = query;

  try {
    // Query subscriptions with past_due status from local DB
    const subscriptions = await UserSubscription.findAll({
      where: {
        stripeSubscriptionStatus: {
          [Op.in]: ['past_due', 'unpaid']
        }
      },
      include: [
        {
          model: Organisation,
          as: 'organisation',
          required: true
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });

    const pastDueOrgs = subscriptions.map(sub => ({
      organisationId: sub.organisationId,
      organisationName: sub.organisation?.name,
      userId: sub.userId,
      userName: sub.user?.fullName,
      userEmail: sub.user?.email,
      stripeSubscriptionId: sub.stripeSubscriptionId,
      stripeCustomerId: sub.stripeCustomerId,
      status: sub.stripeSubscriptionStatus,
      packagePriceId: sub.packagePriceId
    }));

    // Apply pagination
    const paginatedResults = pastDueOrgs.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    return success({
      organisations: paginatedResults,
      total: pastDueOrgs.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    console.error('Get past due orgs error:', err);
    return error(500, err.message);
  }
};

/**
 * Get organisations above seat limit
 * Organizations exceeding their subscription user limit
 */
export const getOrgsAboveSeatLimit = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const query = getQuery(event);
  const { limit = 50, offset = 0 } = query;

  try {
    const organisations = await Organisation.findAll({
      include: [
        {
          model: UserOrganisation,
          as: 'userOrganisations',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'fullName', 'email', 'status']
            }
          ]
        }
      ]
    });

    const orgsAboveLimit = [];

    for (const org of organisations) {
      // Count active users in organization
      const activeUserCount = org.userOrganisations?.filter(
        uo => uo.user?.status === 'Active'
      ).length || 0;

      // Get subscription for this org
      const subscription = await UserSubscription.findOne({
        where: { organisationId: org.id }
      });

      if (subscription?.stripeSubscriptionId) {
        try {
          const stripeSub = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId, {
            expand: ['items.data.price']
          });

          // Get quantity (seat limit) from subscription
          const seatLimit = stripeSub.items?.data?.[0]?.quantity || 0;

          if (activeUserCount > seatLimit) {
            orgsAboveLimit.push({
              organisationId: org.id,
              organisationName: org.name,
              seatLimit: seatLimit,
              activeUsers: activeUserCount,
              overage: activeUserCount - seatLimit,
              stripeSubscriptionId: subscription.stripeSubscriptionId,
              status: stripeSub.status
            });
          }
        } catch (err) {
          console.error(`Error fetching subscription for org ${org.id}:`, err.message);
        }
      }
    }

    // Sort by overage (descending)
    orgsAboveLimit.sort((a, b) => b.overage - a.overage);

    // Apply pagination
    const paginatedResults = orgsAboveLimit.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    return success({
      organisations: paginatedResults,
      total: orgsAboveLimit.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    console.error('Get clinics above seat limit error:', err);
    return error(500, err.message);
  }
};

/**
 * Get organisations by plan type
 * Group organizations by their subscription plan (uses UserPreferences.licenseType)
 */
export const getOrgsByPlanType = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const query = getQuery(event);
  const { planType, limit = 50, offset = 0 } = query;

  try {
    // Get all user preferences with license info
    const preferences = await UserPreference.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });

    // Fetch organisations separately
    const orgIds = [...new Set(preferences.map(p => p.organisationId).filter(Boolean))];
    const organisations = await Organisation.findAll({
      where: { id: { [Op.in]: orgIds } },
      attributes: ['id', 'name']
    });
    const orgMap = Object.fromEntries(organisations.map(o => [o.id, o.name]));

    const orgsByPlan = {};
    const filteredOrgs = [];

    for (const pref of preferences) {
      const planName = pref.licenseType || 'Unknown'; // Trial, Drift, Glide, Soar, System
      
      const orgInfo = {
        organisationId: pref.organisationId,
        organisationName: orgMap[pref.organisationId] || 'Unknown',
        userId: pref.userId,
        userName: pref.user?.fullName,
        userEmail: pref.user?.email,
        licenseType: pref.licenseType,
        licenseBillingCycle: pref.licenseBillingCycle,
        licenseRenewalDate: pref.licenseRenewalDate
      };

      // Group by plan
      if (!orgsByPlan[planName]) {
        orgsByPlan[planName] = [];
      }
      orgsByPlan[planName].push(orgInfo);

      // Filter if planType specified
      if (planType) {
        if (planName.toLowerCase().includes(planType.toLowerCase())) {
          filteredOrgs.push(orgInfo);
        }
      }
    }

    // If filtering by plan type
    if (planType) {
      const paginatedResults = filteredOrgs.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
      
      return success({
        organisations: paginatedResults,
        total: filteredOrgs.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        planTypeFilter: planType
      });
    }

    // Return summary by plan type
    const summary = Object.keys(orgsByPlan).map(plan => ({
      planName: plan,
      count: orgsByPlan[plan].length,
      organisations: orgsByPlan[plan]
    }));

    return success({
      summary: summary,
      totalPlans: summary.length,
      totalOrganisations: preferences.length
    });
  } catch (err) {
    console.error('Get orgs by plan type error:', err);
    return error(500, err.message);
  }
};

/**
 * Get usage metrics across the entire system
 * Tracks users, storage, docs, leads, tasks, diary, notifications
 */
export const getUsageMetrics = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const query = getQuery(event);
  const { organisationId, startDate, endDate } = query;

  try {
    const whereClause = {};
    const dateFilter = {};

    // Filter by organisation if specified
    if (organisationId) {
      whereClause.organisationId = parseInt(organisationId);
    }

    // Date range filter for created records
    if (startDate || endDate) {
      if (startDate) dateFilter[Op.gte] = new Date(startDate);
      if (endDate) dateFilter[Op.lte] = new Date(endDate);
    }

    // Build user query with organisation filter
    let userQuery = {};
    if (organisationId) {
      // Get user IDs for this organisation
      const userOrgs = await UserOrganisation.findAll({
        where: { organisationId: parseInt(organisationId) },
        attributes: ['userId']
      });
      const userIds = userOrgs.map(uo => uo.userId);
      userQuery = { id: { [Op.in]: userIds } };
    }

    // Run all queries in parallel for performance
    const [
      // User metrics
      totalUsers,
      activeUsers,
      invitedUsers,
      disabledUsers,
      expiredUsers,
      
      // Documents
      totalDocuments,
      
      // CRM Leads
      totalLeads,
      newLeads,
      contactedLeads,
      convertedLeads,
      
      // Tasks
      totalTasks,
      overdueTasks,
      
      // Diary/Appointments
      totalAppointments,
      upcomingAppointments,
      completedAppointments,
      
      // Notifications
      totalNotifications,
      unreadNotifications
    ] = await Promise.all([
      // Users (with org filter if specified)
      User.count({ where: userQuery }),
      User.count({ where: { ...userQuery, status: 'Active' } }),
      User.count({ where: { ...userQuery, status: 'Invited' } }),
      User.count({ where: { ...userQuery, status: 'Disabled' } }),
      User.count({ where: { ...userQuery, status: 'Expired' } }),
      
      // Documents
      UserDocument.count({ where: { ...whereClause, ...(startDate || endDate ? { createdAt: dateFilter } : {}) } }),
      
      // Leads
      CrmLead.count({ where: { ...whereClause, ...(startDate || endDate ? { createdAt: dateFilter } : {}) } }),
      CrmLead.count({ where: { ...whereClause, leadStatus: 'New', ...(startDate || endDate ? { createdAt: dateFilter } : {}) } }),
      CrmLead.count({ where: { ...whereClause, leadStatus: 'Contacted', ...(startDate || endDate ? { createdAt: dateFilter } : {}) } }),
      CrmLead.count({ where: { ...whereClause, leadStatus: 'Converted', ...(startDate || endDate ? { createdAt: dateFilter } : {}) } }),
      
      // Tasks
      UserTask.count({ where: { ...whereClause, ...(startDate || endDate ? { createdAt: dateFilter } : {}) } }),
      UserTask.count({ 
        where: { 
          ...whereClause, 
          dueDate: { [Op.lt]: new Date() }
        } 
      }),
      
      // Appointments
      DiaryAppointment.count({ where: { ...whereClause, ...(startDate || endDate ? { createdAt: dateFilter } : {}) } }),
      DiaryAppointment.count({ 
        where: { 
          ...whereClause, 
          startTime: { [Op.gte]: new Date() }
        } 
      }),
      DiaryAppointment.count({ 
        where: { 
          ...whereClause, 
          status: 'Completed'
        } 
      }),
      
      // Notifications
      UserNotification.count({ where: { ...whereClause, ...(startDate || endDate ? { createdAt: dateFilter } : {}) } }),
      UserNotification.count({ where: { ...whereClause, isRead: false } })
    ]);

    // Get organisation name if filtering
    let organisationName = null;
    if (organisationId) {
      const org = await Organisation.findByPk(organisationId, { attributes: ['name'] });
      organisationName = org?.name || 'Unknown';
    }

    return success({
      filters: {
        organisationId: organisationId || 'All',
        organisationName: organisationName || 'All Organisations',
        startDate: startDate || null,
        endDate: endDate || null
      },
      metrics: {
        users: {
          total: totalUsers,
          active: activeUsers,
          invited: invitedUsers,
          disabled: disabledUsers,
          expired: expiredUsers
        },
        documents: {
          total: totalDocuments
        },
        leads: {
          total: totalLeads,
          new: newLeads,
          contacted: contactedLeads,
          converted: convertedLeads,
          conversionRate: totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(2) + '%' : '0%'
        },
        tasks: {
          total: totalTasks,
          overdue: overdueTasks
        },
        diary: {
          totalAppointments: totalAppointments,
          upcoming: upcomingAppointments,
          completed: completedAppointments,
          completionRate: totalAppointments > 0 ? ((completedAppointments / totalAppointments) * 100).toFixed(2) + '%' : '0%'
        },
        notifications: {
          total: totalNotifications,
          unread: unreadNotifications,
          read: totalNotifications - unreadNotifications,
          readRate: totalNotifications > 0 ? (((totalNotifications - unreadNotifications) / totalNotifications) * 100).toFixed(2) + '%' : '0%'
        }
      },
      generatedAt: new Date()
    });
  } catch (err) {
    console.error('Get usage metrics error:', err);
    return error(500, err.message);
  }
};

/**
 * Export tasks for a specific organisation
 * Returns CSV file for download
 */
export const exportOrgTasks = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const query = getQuery(event);
  const { organisationId, format = 'csv' } = query;

  if (!organisationId) {
    return error(400, "organisationId is required");
  }

  try {
    // Get organisation details
    const organisation = await Organisation.findByPk(organisationId, {
      attributes: ['id', 'name']
    });

    if (!organisation) {
      return error(404, "Organisation not found");
    }

    // Get all tasks for this organisation with related data
    const tasks = await UserTask.findAll({
      where: { organisationId: parseInt(organisationId) },
      include: [
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: User,
          as: 'assigner',
          attributes: ['id', 'fullName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Format tasks for CSV export
    const csvData = tasks.map(task => ({
      'Task ID': task.id,
      'Title': task.title || '',
      'Description': task.description || '',
      'Assigned To': task.assignedUser?.fullName || '',
      'Assigned To Email': task.assignedUser?.email || '',
      'Assigned By': task.assigner?.fullName || '',
      'Due Date': task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      'Status ID': task.statusId || '',
      'Priority ID': task.priorityId || '',
      'Organisation ID': task.organisationId,
      'Created At': new Date(task.createdAt).toISOString(),
      'Updated At': new Date(task.updatedAt).toISOString()
    }));

    // If format is JSON, return JSON response
    if (format === 'json') {
      return success({
        organisationId: organisation.id,
        organisationName: organisation.name,
        totalTasks: tasks.length,
        tasks: csvData,
        exportedAt: new Date(),
        exportedBy: admin.userId
      });
    }

    // Convert to CSV
    const csvHeaders = Object.keys(csvData[0] || {});
    const csvRows = csvData.map(row => 
      csvHeaders.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma or quote
        const stringValue = String(value || '');
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    );
    
    const csv = [csvHeaders.join(','), ...csvRows].join('\n');
    
    // Set headers for file download
    const filename = `tasks_org_${organisationId}_${organisation.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    
    setResponseHeader(event, 'Content-Type', 'text/csv');
    setResponseHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`);
    
    return csv;
  } catch (err) {
    console.error('Export org tasks error:', err);
    return error(500, err.message);
  }
};

/**
 * Export all tasks from all organisations (Super Admin only)
 * Returns CSV file for download
 */
export const exportAllTasks = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const query = getQuery(event);
  const { format = 'csv' } = query;

  try {
    // Get all tasks with organisation and user data
    const tasks = await UserTask.findAll({
      include: [
        {
          model: Organisation,
          as: 'organisation',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: User,
          as: 'assigner',
          attributes: ['id', 'fullName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Format tasks for CSV export
    const csvData = tasks.map(task => ({
      'Task ID': task.id,
      'Organisation ID': task.organisationId,
      'Organisation Name': task.organisation?.name || '',
      'Title': task.title || '',
      'Description': task.description || '',
      'Assigned To': task.assignedUser?.fullName || '',
      'Assigned To Email': task.assignedUser?.email || '',
      'Assigned By': task.assigner?.fullName || '',
      'Due Date': task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      'Status ID': task.statusId || '',
      'Priority ID': task.priorityId || '',
      'Created At': new Date(task.createdAt).toISOString(),
      'Updated At': new Date(task.updatedAt).toISOString()
    }));

    // Get organisation summary
    const orgSummary = {};
    tasks.forEach(task => {
      const orgName = task.organisation?.name || 'Unknown';
      orgSummary[orgName] = (orgSummary[orgName] || 0) + 1;
    });

    // If format is JSON, return JSON response
    if (format === 'json') {
      return success({
        totalTasks: tasks.length,
        totalOrganisations: Object.keys(orgSummary).length,
        organisationSummary: orgSummary,
        tasks: csvData,
        exportedAt: new Date(),
        exportedBy: admin.userId
      });
    }

    // Convert to CSV
    const csvHeaders = Object.keys(csvData[0] || {});
    const csvRows = csvData.map(row => 
      csvHeaders.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma or quote
        const stringValue = String(value || '');
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    );
    
    const csv = [csvHeaders.join(','), ...csvRows].join('\n');
    
    // Set headers for file download
    const filename = `tasks_all_organisations_${new Date().toISOString().split('T')[0]}.csv`;
    
    setResponseHeader(event, 'Content-Type', 'text/csv');
    setResponseHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`);
    
    return csv;
  } catch (err) {
    console.error('Export all tasks error:', err);
    return error(500, err.message);
  }
};

/**
 * Get task pool (Super Admin)
 * View all system template tasks that can be assigned to users
 * Only shows system tasks (not org-specific tasks)
 */
export const getTaskPool = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const query = getQuery(event);
  const { categoryId, roleId, limit = 100, offset = 0 } = query;

  try {
    // Build where clause - always filter for system tasks only
    const whereClause = {
      isSystemTask: true  // Only show system tasks
    };
    
    if (categoryId) {
      whereClause.categoryId = parseInt(categoryId);
    }
    
    if (roleId) {
      whereClause.roleId = parseInt(roleId);
    }

    // Get all tasks
    const tasks = await Task.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: TaskCategory,
          as: 'category',
          attributes: ['id', 'name', 'description', 'color', 'organisationId'],
          required: false
        },
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'title', 'roleType'],
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['isSystemTask', 'DESC'], ['title', 'ASC']],
      distinct: true
    });

    // Get category summary
    const categorySummary = {};
    tasks.rows.forEach(task => {
      const catName = task.category?.name || 'Uncategorized';
      categorySummary[catName] = (categorySummary[catName] || 0) + 1;
    });

    return success({
      totalTasks: tasks.count,
      categorySummary: categorySummary,
      limit: parseInt(limit),
      offset: parseInt(offset),
      tasks: tasks.rows.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        categoryId: task.categoryId,
        category: task.category ? {
          id: task.category.id,
          name: task.category.name,
          description: task.category.description,
          color: task.category.color
        } : null,
        roleId: task.roleId,
        role: task.role ? {
          id: task.role.id,
          title: task.role.title,
          roleType: task.role.roleType
        } : null,
        defaultFrequency: task.defaultFrequency,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      }))
    });
  } catch (err) {
    console.error('Get all task pools error:', err);
    return error(500, err.message);
  }
};

export const getTaskById = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const query = getQuery(event);
  const { id } = query;

  if (!id) {
    return error(400, "Task ID is required");
  }

  try {
    const task = await Task.findOne({
      where: { id: parseInt(id) },
      include: [
        {
          model: TaskCategory,
          as: 'category',
          attributes: ['id', 'name', 'description', 'color', 'organisationId'],
          required: false
        },
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'title', 'roleType'],
          required: false
        }
      ]
    });

    if (!task) {
      return error(404, "Task not found");
    }

    return success({
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        categoryId: task.categoryId,
        category: task.category ? {
          id: task.category.id,
          name: task.category.name,
          description: task.category.description,
          color: task.category.color
        } : null,
        roleId: task.roleId,
        role: task.role ? {
          id: task.role.id,
          title: task.role.title,
          roleType: task.role.roleType
        } : null,
        defaultFrequency: task.defaultFrequency,
        isSystemTask: task.isSystemTask,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      }
    });
  } catch (err) {
    console.error('Get task by ID error:', err);
    return error(500, err.message);
  }
};

/**
 * Get global default CRM automation library
 * View all system automation templates available to all practices
 */
export const getGlobalAutomationLibrary = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const query = getQuery(event);
  const { type, enabled, limit = 100, offset = 0 } = query;

  try {
    // Build where clause - get templates that are system defaults (source = 'system')
    const whereClause = {};
    
    if (type) {
      whereClause.type = type; // Email, SMS, WhatsApp
    }
    
    if (enabled !== undefined) {
      whereClause.enabled = enabled === 'true';
    }

    // Get automation groups with source = 'system'
    const groups = await CrmAutomationGroup.findAll({
      where: { source: 'system' },
      include: [
        {
          model: CrmAutomationGroupTemplate,
          as: 'templates',
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['ordering', 'ASC'], ['title', 'ASC']]
    });

    // For each group, get the actual templates by templateKey
    const groupsWithTemplates = await Promise.all(groups.map(async (group) => {
      const templateKeys = group.templates?.map(t => t.templateKey) || [];
      
      const templates = templateKeys.length > 0 ? await CrmAutomationTemplate.findAll({
        where: {
          key: { [Op.in]: templateKeys },
          ...whereClause
        }
      }) : [];

      return {
        id: group.id,
        key: group.key,
        title: group.title,
        description: group.description,
        enabled: group.enabled,
        ordering: group.ordering,
        source: group.source,
        templateCount: templates.length,
        templates: templates.map(template => ({
          id: template.id,
          key: template.key,
          type: template.type,
          name: template.name,
          subject: template.subject,
          sending: template.sending,
          enabled: template.enabled,
          whatsappTemplateName: template.whatsappTemplateName,
          trigger: template.trigger
        }))
      };
    }));

    // Get statistics
    const totalTemplates = await CrmAutomationTemplate.count();
    const enabledTemplates = await CrmAutomationTemplate.count({ where: { enabled: true } });

    return success({
      totalGroups: groupsWithTemplates.length,
      totalTemplates: totalTemplates,
      enabledTemplates: enabledTemplates,
      disabledTemplates: totalTemplates - enabledTemplates,
      limit: parseInt(limit),
      offset: parseInt(offset),
      groups: groupsWithTemplates
    });
  } catch (err) {
    console.error('Get global automation library error:', err);
    return error(500, err.message);
  }
};

/**
 * Get practice-specific CRM automation library
 * View automation templates for a specific organisation
 */
export const getPracticeAutomationLibrary = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const query = getQuery(event);
  const { organisationId, type, enabled, limit = 100, offset = 0 } = query;

  if (!organisationId) {
    return error(400, "organisationId is required");
  }

  try {
    // Get organisation details
    const organisation = await Organisation.findByPk(organisationId, {
      attributes: ['id', 'name']
    });

    if (!organisation) {
      return error(404, "Organisation not found");
    }

    // Build where clause for templates
    const templateWhere = {};
    
    if (type) {
      templateWhere.type = type;
    }
    
    if (enabled !== undefined) {
      templateWhere.enabled = enabled === 'true';
    }

    // Get automation groups for this organisation
    const groups = await CrmAutomationGroup.findAll({
      where: { organisationId: parseInt(organisationId) },
      include: [
        {
          model: CrmAutomationGroupTemplate,
          as: 'templates',
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['ordering', 'ASC'], ['title', 'ASC']]
    });

    // For each group, get the actual templates by templateKey
    const groupsWithTemplates = await Promise.all(groups.map(async (group) => {
      const templateKeys = group.templates?.map(t => t.templateKey) || [];
      
      const templates = templateKeys.length > 0 ? await CrmAutomationTemplate.findAll({
        where: {
          key: { [Op.in]: templateKeys },
          organisationId: parseInt(organisationId),
          ...templateWhere
        }
      }) : [];

      return {
        id: group.id,
        key: group.key,
        title: group.title,
        description: group.description,
        enabled: group.enabled,
        ordering: group.ordering,
        source: group.source,
        templateCount: templates.length,
        templates: templates.map(template => ({
          id: template.id,
          key: template.key,
          type: template.type,
          name: template.name,
          subject: template.subject,
          sending: template.sending,
          enabled: template.enabled,
          whatsappTemplateName: template.whatsappTemplateName,
          trigger: template.trigger
        }))
      };
    }));

    // Get statistics for this org
    const totalTemplates = await CrmAutomationTemplate.count({ 
      where: { organisationId: parseInt(organisationId) } 
    });
    const enabledTemplates = await CrmAutomationTemplate.count({ 
      where: { organisationId: parseInt(organisationId), enabled: true } 
    });

    return success({
      organisationId: organisation.id,
      organisationName: organisation.name,
      totalGroups: groupsWithTemplates.length,
      totalTemplates: totalTemplates,
      enabledTemplates: enabledTemplates,
      disabledTemplates: totalTemplates - enabledTemplates,
      limit: parseInt(limit),
      offset: parseInt(offset),
      groups: groupsWithTemplates
    });
  } catch (err) {
    console.error('Get practice automation library error:', err);
    return error(500, err.message);
  }
};

/**
 * Activate or deactivate a CRM automation template
 * Controls whether an automation template is active
 */
export const toggleAutomationTemplate = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const body = await readBody(event);
  const { templateId, enabled } = body;

  if (!templateId) {
    return error(400, "templateId is required");
  }

  if (enabled === undefined) {
    return error(400, "enabled is required (true or false)");
  }

  try {
    const template = await CrmAutomationTemplate.findByPk(templateId);

    if (!template) {
      return error(404, "Automation template not found");
    }

    // Update enabled status
    template.enabled = enabled;
    await template.save();

    return success({
      message: `Automation template ${enabled ? 'activated' : 'deactivated'} successfully`,
      template: {
        id: template.id,
        key: template.key,
        name: template.name,
        type: template.type,
        enabled: template.enabled,
        updatedBy: admin.userId,
        updatedAt: template.updatedAt
      }
    });
  } catch (err) {
    console.error('Toggle automation template error:', err);
    return error(500, err.message);
  }
};

/**
 * Bulk upload CRM automations into a target organisation as superadmin
 */
export const adminBulkUploadAutomations = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const contentType = String(getHeader(event, 'content-type') || '').toLowerCase();

    if (contentType.includes('multipart/form-data')) {
      const formData = await readMultipartFormData(event);
      if (!formData?.length) {
        return error(400, 'No file uploaded');
      }

      const filePart = formData.find((part) => part.name === 'file');
      if (!filePart?.data?.length) {
        return error(400, 'Missing file');
      }

      const organisationPart = formData.find((part) => part.name === 'organisationId' || part.name === 'orgId');
      const organisationId = String(organisationPart?.data || '').trim();
      if (!organisationId) {
        return error(400, 'organisationId is required');
      }

      const items = parseAdminAutomationUploadFile(filePart);
      event.context.adminBulkAutomationPayload = {
        organisationId,
        items,
      };
    }

    return await crmBulkUploadAutomations(event);
  } catch (err) {
    console.error('Admin bulk upload automations error:', err);
    return error(err?.statusCode || 500, err.message || 'Failed to bulk upload automations');
  }
};

export const adminBulkUploadLeads = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const contentType = String(getHeader(event, 'content-type') || '').toLowerCase();

    if (contentType.includes('multipart/form-data')) {
      const formData = await readMultipartFormData(event);
      if (!formData?.length) {
        return error(400, 'No file uploaded');
      }

      const filePart = formData.find((part) => part.name === 'file');
      if (!filePart?.data?.length) {
        return error(400, 'Missing file');
      }

      const organisationPart = formData.find((part) => part.name === 'organisationId' || part.name === 'orgId');
      const organisationId = String(organisationPart?.data || '').trim();
      if (!organisationId) {
        return error(400, 'organisationId is required');
      }

      const leads = await parseAdminLeadUploadFile({ filePart, organisationId });
      event.context.adminBulkLeadPayload = {
        organisationId,
        leads,
      };
    }

    return await crmBulkUploadLeads(event);
  } catch (err) {
    console.error('Admin bulk upload leads error:', err);
    return error(err?.statusCode || 500, err.message || 'Failed to bulk upload leads');
  }
};

/**
 * Download CRM automation bulk upload sample CSV for superadmin use
 */
export const downloadAdminAutomationTemplate = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const templatePath = join(process.cwd(), 'public', 'samples', 'automation-sample.csv');
    const csvContent = await readFile(templatePath, 'utf8');

    setResponseHeader(event, 'Content-Type', 'text/csv; charset=utf-8');
    setResponseHeader(event, 'Content-Disposition', 'attachment; filename="automation-sample.csv"');

    return csvContent;
  } catch (err) {
    console.error('Download admin automation template error:', err);
    return error(500, err.message || 'Failed to download automation template');
  }
};

export const downloadAdminLeadTemplate = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const templatePath = join(process.cwd(), 'public', 'samples', 'lead-sample.csv');
    const csvContent = await readFile(templatePath, 'utf8');

    setResponseHeader(event, 'Content-Type', 'text/csv; charset=utf-8');
    setResponseHeader(event, 'Content-Disposition', 'attachment; filename="lead-sample.csv"');

    return csvContent;
  } catch (err) {
    console.error('Download admin lead template error:', err);
    return error(500, err.message || 'Failed to download lead template');
  }
};

export const listScriptsPool = async (event) => {
  requireAdmin(event);
  try {
    const items = await DictionaryScript.findAll({ order: [['sortOrder', 'ASC'], ['title', 'ASC'], ['id', 'ASC']] });
    return success(items);
  } catch (err) {
    console.error('List scripts pool error:', err);
    return error(err?.statusCode || 500, err.message || 'Failed to list scripts pool');
  }
};

export const getScriptPoolItemById = async (event) => {
  requireAdmin(event);
  try {
    const query = getQuery(event) || {};
    if (!query.id) return error(400, 'id is required');
    const item = await DictionaryScript.findByPk(Number(query.id));
    if (!item) return error(404, 'Script not found');
    return success(item);
  } catch (err) {
    console.error('Get script pool item error:', err);
    return error(err?.statusCode || 500, err.message || 'Failed to get script');
  }
};

export const createScriptPoolItem = async (event) => {
  requireAdmin(event);
  try {
    const payload = await parseRequestPayload(event);
    const next = sanitizeDictionaryScriptPayload(payload);
    const existing = await DictionaryScript.findOne({ where: { key: next.key } });
    if (existing) return error(409, 'Script key already exists');
    const created = await DictionaryScript.create(next);
    return success(created);
  } catch (err) {
    console.error('Create script pool item error:', err);
    return error(err?.statusCode || 500, err.message || 'Failed to create script');
  }
};

export const updateScriptPoolItem = async (event) => {
  requireAdmin(event);
  try {
    const payload = await parseRequestPayload(event);
    if (!payload?.id) return error(400, 'id is required');
    const item = await DictionaryScript.findByPk(Number(payload.id));
    if (!item) return error(404, 'Script not found');

    const next = sanitizeDictionaryScriptPayload(payload, item.key);
    const duplicate = await DictionaryScript.findOne({
      where: {
        key: next.key,
        id: { [Op.ne]: item.id },
      },
    });
    if (duplicate) return error(409, 'Script key already exists');

    item.key = next.key;
    item.title = next.title;
    item.content = next.content;
    item.sortOrder = next.sortOrder;
    await item.save();

    return success(item);
  } catch (err) {
    console.error('Update script pool item error:', err);
    return error(err?.statusCode || 500, err.message || 'Failed to update script');
  }
};

export const deleteScriptPoolItem = async (event) => {
  requireAdmin(event);
  try {
    const payload = await parseRequestPayload(event);
    if (!payload?.id) return error(400, 'id is required');
    const item = await DictionaryScript.findByPk(Number(payload.id));
    if (!item) return error(404, 'Script not found');
    await item.destroy();
    return success({ deletedId: item.id });
  } catch (err) {
    console.error('Delete script pool item error:', err);
    return error(err?.statusCode || 500, err.message || 'Failed to delete script');
  }
};

// ─── CRM Automation Dictionary ────────────────────────────────────────────────

const normalizeDictionaryGroupPayload = (payload = {}, existingKey = null) => ({
  key: String(payload.key || existingKey || '')
    .trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80),
  title: String(payload.title || '').trim().slice(0, 150),
  description: payload.description != null ? String(payload.description).trim().slice(0, 255) : null,
  category: payload.category != null ? String(payload.category).trim().slice(0, 80) : null,
  ordering: Number.isFinite(Number(payload.ordering)) ? Number(payload.ordering) : 0,
  status: ['active', 'archived'].includes(payload.status) ? payload.status : 'active',
})

const normalizeDictionaryTemplatePayload = (payload = {}, existingKey = null) => ({
  key: String(payload.key || existingKey || '')
    .trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80),
  groupKey: String(payload.groupKey || '').trim().slice(0, 80),
  type: ['Email', 'WhatsApp'].includes(payload.type) ? payload.type : 'Email',
  name: String(payload.name || '').trim().slice(0, 150),
  subject: payload.subject != null ? String(payload.subject).trim().slice(0, 200) : null,
  template: payload.template != null ? String(payload.template) : null,
  trigger: payload.trigger != null && typeof payload.trigger === 'object' ? payload.trigger : null,
  whatsappTemplateName: payload.whatsappTemplateName != null ? String(payload.whatsappTemplateName).trim().slice(0, 150) : null,
  whatsappTemplateLanguage: payload.whatsappTemplateLanguage != null ? String(payload.whatsappTemplateLanguage).trim().slice(0, 10) : null,
  ordering: Number.isFinite(Number(payload.ordering)) ? Number(payload.ordering) : 0,
  status: ['active', 'archived'].includes(payload.status) ? payload.status : 'active',
})

export const seedCrmAutomationDictionary = async (event) => {
  requireAdmin(event)
  try {
    const result = await runSeedCrmAutomationDictionary()
    return success(result)
  } catch (err) {
    console.error('Seed CRM automation dictionary error:', err)
    return error(err?.statusCode || 500, err.message || 'Failed to seed CRM automation dictionary')
  }
}

export const listCrmAutomationDictionaryGroups = async (event) => {
  requireAdmin(event)
  try {
    const query = getQuery(event) || {}
    const where = {}
    if (query.status) where.status = query.status
    if (query.category) where.category = query.category
    const items = await CrmAutomationDictionaryGroup.findAll({
      where,
      order: [['ordering', 'ASC'], ['title', 'ASC']],
    })
    return success(items)
  } catch (err) {
    console.error('List CRM automation dictionary groups error:', err)
    return error(err?.statusCode || 500, err.message || 'Failed to list groups')
  }
}

export const getCrmAutomationDictionaryGroupById = async (event) => {
  requireAdmin(event)
  try {
    const query = getQuery(event) || {}
    if (!query.id) return error(400, 'id is required')
    const item = await CrmAutomationDictionaryGroup.findByPk(Number(query.id))
    if (!item) return error(404, 'Group not found')
    return success(item)
  } catch (err) {
    console.error('Get CRM automation dictionary group error:', err)
    return error(err?.statusCode || 500, err.message || 'Failed to get group')
  }
}

export const createCrmAutomationDictionaryGroup = async (event) => {
  requireAdmin(event)
  try {
    const payload = await parseRequestPayload(event)
    const next = normalizeDictionaryGroupPayload(payload)
    if (!next.key) return error(400, 'key is required')
    if (!next.title) return error(400, 'title is required')
    const existing = await CrmAutomationDictionaryGroup.findOne({ where: { key: next.key } })
    if (existing) return error(409, 'Group key already exists')
    const created = await CrmAutomationDictionaryGroup.create(next)
    return success(created)
  } catch (err) {
    console.error('Create CRM automation dictionary group error:', err)
    return error(err?.statusCode || 500, err.message || 'Failed to create group')
  }
}

export const updateCrmAutomationDictionaryGroup = async (event) => {
  requireAdmin(event)
  try {
    const payload = await parseRequestPayload(event)
    if (!payload?.id) return error(400, 'id is required')
    const item = await CrmAutomationDictionaryGroup.findByPk(Number(payload.id))
    if (!item) return error(404, 'Group not found')
    const next = normalizeDictionaryGroupPayload(payload, item.key)
    if (!next.key) return error(400, 'key is required')
    if (!next.title) return error(400, 'title is required')
    if (next.key !== item.key) {
      const duplicate = await CrmAutomationDictionaryGroup.findOne({ where: { key: next.key, id: { [Op.ne]: item.id } } })
      if (duplicate) return error(409, 'Group key already exists')
    }
    Object.assign(item, next)
    await item.save()
    return success(item)
  } catch (err) {
    console.error('Update CRM automation dictionary group error:', err)
    return error(err?.statusCode || 500, err.message || 'Failed to update group')
  }
}

export const deleteCrmAutomationDictionaryGroup = async (event) => {
  requireAdmin(event)
  try {
    const payload = await parseRequestPayload(event)
    if (!payload?.id) return error(400, 'id is required')
    const item = await CrmAutomationDictionaryGroup.findByPk(Number(payload.id))
    if (!item) return error(404, 'Group not found')
    await sequelize.transaction(async (t) => {
      await CrmAutomationDictionaryTemplate.destroy({ where: { groupKey: item.key }, transaction: t })
      await item.destroy({ transaction: t })
    })
    return success({ deletedId: item.id })
  } catch (err) {
    console.error('Delete CRM automation dictionary group error:', err)
    return error(err?.statusCode || 500, err.message || 'Failed to delete group')
  }
}

export const listCrmAutomationDictionaryTemplates = async (event) => {
  requireAdmin(event)
  try {
    const query = getQuery(event) || {}
    const where = {}
    if (query.groupKey) where.groupKey = query.groupKey
    if (query.status) where.status = query.status
    if (query.type) where.type = query.type
    const items = await CrmAutomationDictionaryTemplate.findAll({
      where,
      order: [['groupKey', 'ASC'], ['ordering', 'ASC'], ['name', 'ASC']],
    })
    return success(items)
  } catch (err) {
    console.error('List CRM automation dictionary templates error:', err)
    return error(err?.statusCode || 500, err.message || 'Failed to list templates')
  }
}

export const getCrmAutomationDictionaryTemplateById = async (event) => {
  requireAdmin(event)
  try {
    const query = getQuery(event) || {}
    if (!query.id) return error(400, 'id is required')
    const item = await CrmAutomationDictionaryTemplate.findByPk(Number(query.id))
    if (!item) return error(404, 'Template not found')
    return success(item)
  } catch (err) {
    console.error('Get CRM automation dictionary template error:', err)
    return error(err?.statusCode || 500, err.message || 'Failed to get template')
  }
}

export const createCrmAutomationDictionaryTemplate = async (event) => {
  requireAdmin(event)
  try {
    const payload = await parseRequestPayload(event)
    const next = normalizeDictionaryTemplatePayload(payload)
    if (!next.key) return error(400, 'key is required')
    if (!next.groupKey) return error(400, 'groupKey is required')
    if (!next.name) return error(400, 'name is required')
    const groupExists = await CrmAutomationDictionaryGroup.findOne({ where: { key: next.groupKey } })
    if (!groupExists) return error(404, 'Group not found for groupKey')
    const existing = await CrmAutomationDictionaryTemplate.findOne({ where: { key: next.key } })
    if (existing) return error(409, 'Template key already exists')
    const created = await CrmAutomationDictionaryTemplate.create(next)
    return success(created)
  } catch (err) {
    console.error('Create CRM automation dictionary template error:', err)
    return error(err?.statusCode || 500, err.message || 'Failed to create template')
  }
}

export const updateCrmAutomationDictionaryTemplate = async (event) => {
  requireAdmin(event)
  try {
    const payload = await parseRequestPayload(event)
    if (!payload?.id) return error(400, 'id is required')
    const item = await CrmAutomationDictionaryTemplate.findByPk(Number(payload.id))
    if (!item) return error(404, 'Template not found')
    const next = normalizeDictionaryTemplatePayload(payload, item.key)
    if (!next.key) return error(400, 'key is required')
    if (!next.groupKey) return error(400, 'groupKey is required')
    if (!next.name) return error(400, 'name is required')
    if (next.key !== item.key) {
      const duplicate = await CrmAutomationDictionaryTemplate.findOne({ where: { key: next.key, id: { [Op.ne]: item.id } } })
      if (duplicate) return error(409, 'Template key already exists')
    }
    if (next.groupKey !== item.groupKey) {
      const groupExists = await CrmAutomationDictionaryGroup.findOne({ where: { key: next.groupKey } })
      if (!groupExists) return error(404, 'Group not found for groupKey')
    }
    Object.assign(item, next)
    await item.save()
    return success(item)
  } catch (err) {
    console.error('Update CRM automation dictionary template error:', err)
    return error(err?.statusCode || 500, err.message || 'Failed to update template')
  }
}

export const deleteCrmAutomationDictionaryTemplate = async (event) => {
  requireAdmin(event)
  try {
    const payload = await parseRequestPayload(event)
    if (!payload?.id) return error(400, 'id is required')
    const item = await CrmAutomationDictionaryTemplate.findByPk(Number(payload.id))
    if (!item) return error(404, 'Template not found')
    await item.destroy()
    return success({ deletedId: item.id })
  } catch (err) {
    console.error('Delete CRM automation dictionary template error:', err)
    return error(err?.statusCode || 500, err.message || 'Failed to delete template')
  }
}

// ──────────────────────────────────────────────────────────────────────────────

export const getOrganisationCrmFeatureFlags = async (event) => {
  requireAdmin(event);
  try {
    const organisation = await readOrganisationId(event);
    return success({
      organisationId: organisation.id,
      crmFeatureAccess: getOrganisationCrmFeatureAccess(organisation),
    });
  } catch (err) {
    console.error('Get organisation CRM feature flags error:', err);
    return error(err?.statusCode || 500, err.message || 'Failed to get CRM feature flags');
  }
};

export const updateOrganisationCrmFeatureFlags = async (event) => {
  requireAdmin(event);
  try {
    const payload = await parseRequestPayload(event);
    const organisation = await readOrganisationId(event, payload);
    const updates = sanitizeCrmFeatureAccessInput(payload);
    if (Object.values(updates).every((value) => value === undefined)) {
      return error(400, 'At least one of meta, whatsapp, chatbot is required');
    }
    const crmFeatureAccess = await saveOrganisationCrmFeatureAccess(organisation, updates);
    return success({
      organisationId: organisation.id,
      crmFeatureAccess,
    });
  } catch (err) {
    console.error('Update organisation CRM feature flags error:', err);
    return error(err?.statusCode || 500, err.message || 'Failed to update CRM feature flags');
  }
};

export const listCrmTreatments = async (event) => {
  requireAdmin(event);
  try {
    const organisation = await readOrganisationId(event);
    const items = await listAdminCrmOptionsByCategory(organisation.id, 'treatment');
    return success(items);
  } catch (err) {
    console.error('List CRM treatments error:', err);
    return error(err?.statusCode || 500, err.message || 'Failed to list CRM treatments');
  }
};

export const getCrmTreatmentById = async (event) => {
  requireAdmin(event);
  try {
    const query = getQuery(event) || {};
    const organisation = await readOrganisationId(event);
    if (!query.id) return error(400, 'id is required');
    const item = await getAdminCrmOptionById({ organisationId: organisation.id, category: 'treatment', id: query.id });
    return success(item);
  } catch (err) {
    console.error('Get CRM treatment error:', err);
    return error(err?.statusCode || 500, err.message || 'Failed to get CRM treatment');
  }
};

export const createCrmTreatment = async (event) => {
  requireAdmin(event);
  try {
    const payload = await parseRequestPayload(event);
    const organisation = await readOrganisationId(event, payload);
    const name = normalizeCrmOptionName(payload?.name);
    const color = payload?.color ? String(payload.color).trim() : null;
    const ordering = payload?.ordering == null || payload.ordering === '' ? null : Number(payload.ordering);
    if (!name) return error(400, 'name is required');
    await ensureUniqueAdminCrmOptionName({ organisationId: organisation.id, category: 'treatment', name });
    const created = await CrmOption.create({ organisationId: organisation.id, category: 'treatment', name, color, ordering, active: payload?.active !== false });
    return success(created);
  } catch (err) {
    console.error('Create CRM treatment error:', err);
    return error(err?.statusCode || 500, err.message || 'Failed to create CRM treatment');
  }
};

export const updateCrmTreatment = async (event) => {
  requireAdmin(event);
  try {
    const payload = await parseRequestPayload(event);
    const organisation = await readOrganisationId(event, payload);
    if (!payload?.id) return error(400, 'id is required');
    const item = await getAdminCrmOptionById({ organisationId: organisation.id, category: 'treatment', id: payload.id });
    if (payload?.name !== undefined) {
      const name = normalizeCrmOptionName(payload.name);
      if (!name) return error(400, 'name cannot be empty');
      await ensureUniqueAdminCrmOptionName({ organisationId: organisation.id, category: 'treatment', name, excludeId: item.id });
      item.name = name;
    }
    if (payload?.color !== undefined) item.color = payload.color ? String(payload.color).trim() : null;
    if (payload?.ordering !== undefined) item.ordering = payload.ordering == null || payload.ordering === '' ? null : Number(payload.ordering);
    if (payload?.active !== undefined) item.active = Boolean(payload.active);
    await item.save();
    return success(item);
  } catch (err) {
    console.error('Update CRM treatment error:', err);
    return error(err?.statusCode || 500, err.message || 'Failed to update CRM treatment');
  }
};

export const deleteCrmTreatment = async (event) => {
  requireAdmin(event);
  try {
    const payload = await parseRequestPayload(event);
    const organisation = await readOrganisationId(event, payload);
    if (!payload?.id) return error(400, 'id is required');
    const item = await getAdminCrmOptionById({ organisationId: organisation.id, category: 'treatment', id: payload.id });
    await item.destroy();
    return success({ deletedId: item.id });
  } catch (err) {
    console.error('Delete CRM treatment error:', err);
    return error(err?.statusCode || 500, err.message || 'Failed to delete CRM treatment');
  }
};

export const listLeadSources = async (event) => {
  requireAdmin(event);
  try {
    const organisation = await readOrganisationId(event);
    const items = await listAdminCrmOptionsByCategory(organisation.id, 'lead_source');
    return success(items);
  } catch (err) {
    console.error('List lead sources error:', err);
    return error(err?.statusCode || 500, err.message || 'Failed to list lead sources');
  }
};

export const getLeadSourceById = async (event) => {
  requireAdmin(event);
  try {
    const query = getQuery(event) || {};
    const organisation = await readOrganisationId(event);
    if (!query.id) return error(400, 'id is required');
    const item = await getAdminCrmOptionById({ organisationId: organisation.id, category: 'lead_source', id: query.id });
    return success(item);
  } catch (err) {
    console.error('Get lead source error:', err);
    return error(err?.statusCode || 500, err.message || 'Failed to get lead source');
  }
};

export const createLeadSource = async (event) => {
  requireAdmin(event);
  try {
    const payload = await parseRequestPayload(event);
    const organisation = await readOrganisationId(event, payload);
    const name = normalizeCrmOptionName(payload?.name);
    const color = payload?.color ? String(payload.color).trim() : null;
    const ordering = payload?.ordering == null || payload.ordering === '' ? null : Number(payload.ordering);
    if (!name) return error(400, 'name is required');
    await ensureUniqueAdminCrmOptionName({ organisationId: organisation.id, category: 'lead_source', name });
    const created = await CrmOption.create({ organisationId: organisation.id, category: 'lead_source', name, color, ordering, active: payload?.active !== false });
    return success(created);
  } catch (err) {
    console.error('Create lead source error:', err);
    return error(err?.statusCode || 500, err.message || 'Failed to create lead source');
  }
};

export const updateLeadSource = async (event) => {
  requireAdmin(event);
  try {
    const payload = await parseRequestPayload(event);
    const organisation = await readOrganisationId(event, payload);
    if (!payload?.id) return error(400, 'id is required');
    const item = await getAdminCrmOptionById({ organisationId: organisation.id, category: 'lead_source', id: payload.id });
    if (payload?.name !== undefined) {
      const name = normalizeCrmOptionName(payload.name);
      if (!name) return error(400, 'name cannot be empty');
      await ensureUniqueAdminCrmOptionName({ organisationId: organisation.id, category: 'lead_source', name, excludeId: item.id });
      item.name = name;
    }
    if (payload?.color !== undefined) item.color = payload.color ? String(payload.color).trim() : null;
    if (payload?.ordering !== undefined) item.ordering = payload.ordering == null || payload.ordering === '' ? null : Number(payload.ordering);
    if (payload?.active !== undefined) item.active = Boolean(payload.active);
    await item.save();
    return success(item);
  } catch (err) {
    console.error('Update lead source error:', err);
    return error(err?.statusCode || 500, err.message || 'Failed to update lead source');
  }
};

export const deleteLeadSource = async (event) => {
  requireAdmin(event);
  try {
    const payload = await parseRequestPayload(event);
    const organisation = await readOrganisationId(event, payload);
    if (!payload?.id) return error(400, 'id is required');
    const item = await getAdminCrmOptionById({ organisationId: organisation.id, category: 'lead_source', id: payload.id });
    await item.destroy();
    return success({ deletedId: item.id });
  } catch (err) {
    console.error('Delete lead source error:', err);
    return error(err?.statusCode || 500, err.message || 'Failed to delete lead source');
  }
};

export const listCrmAlerts = async (event) => {
  requireAdmin(event);
  try {
    const organisation = await readOrganisationId(event);
    const items = getOrganisationAlertOptions(organisation);
    return success(items);
  } catch (err) {
    console.error('List CRM alerts error:', err);
    return error(err?.statusCode || 500, err.message || 'Failed to list CRM alerts');
  }
};

export const getCrmAlertByKey = async (event) => {
  requireAdmin(event);
  try {
    const query = getQuery(event) || {};
    const organisation = await readOrganisationId(event);
    const key = String(query.key || '').trim().toLowerCase();
    if (!key) return error(400, 'key is required');
    const item = getOrganisationAlertOptions(organisation).find((alert) => String(alert.key || '').trim().toLowerCase() === key);
    if (!item) return error(404, 'Alert not found');
    return success(item);
  } catch (err) {
    console.error('Get CRM alert error:', err);
    return error(err?.statusCode || 500, err.message || 'Failed to get CRM alert');
  }
};

export const createCrmAlert = async (event) => {
  requireAdmin(event);
  try {
    const payload = await parseRequestPayload(event);
    const organisation = await readOrganisationId(event, payload);
    const items = getOrganisationAlertOptions(organisation);
    if (items.length >= 30) return error(400, 'Cannot exceed 30 alert options');
    const next = sanitizeAlertOptionInput(payload);
    const duplicateKey = items.find((item) => String(item.key || '').trim().toLowerCase() === next.key);
    if (duplicateKey) return error(409, 'Alert key already exists');
    const duplicateLabel = items.find((item) => String(item.label || '').trim().toLowerCase() === next.label.toLowerCase());
    if (duplicateLabel) return error(409, 'Alert label already exists');
    items.push(next);
    await saveOrganisationAlertOptions(organisation, items);
    return success(next);
  } catch (err) {
    console.error('Create CRM alert error:', err);
    return error(err?.statusCode || 500, err.message || 'Failed to create CRM alert');
  }
};

export const updateCrmAlert = async (event) => {
  requireAdmin(event);
  try {
    const payload = await parseRequestPayload(event);
    const organisation = await readOrganisationId(event, payload);
    const currentKey = String(payload?.currentKey || payload?.key || '').trim().toLowerCase();
    if (!currentKey) return error(400, 'currentKey or key is required');
    const items = getOrganisationAlertOptions(organisation);
    const index = items.findIndex((item) => String(item.key || '').trim().toLowerCase() === currentKey);
    if (index === -1) return error(404, 'Alert not found');
    const next = sanitizeAlertOptionInput(payload, currentKey);
    const duplicateKey = items.find((item, itemIndex) => itemIndex !== index && String(item.key || '').trim().toLowerCase() === next.key);
    if (duplicateKey) return error(409, 'Alert key already exists');
    const duplicateLabel = items.find((item, itemIndex) => itemIndex !== index && String(item.label || '').trim().toLowerCase() === next.label.toLowerCase());
    if (duplicateLabel) return error(409, 'Alert label already exists');
    items[index] = next;
    await saveOrganisationAlertOptions(organisation, items);
    return success(next);
  } catch (err) {
    console.error('Update CRM alert error:', err);
    return error(err?.statusCode || 500, err.message || 'Failed to update CRM alert');
  }
};

export const deleteCrmAlert = async (event) => {
  requireAdmin(event);
  try {
    const payload = await parseRequestPayload(event);
    const organisation = await readOrganisationId(event, payload);
    const key = String(payload?.key || '').trim().toLowerCase();
    if (!key) return error(400, 'key is required');
    const items = getOrganisationAlertOptions(organisation);
    const next = items.filter((item) => String(item.key || '').trim().toLowerCase() !== key);
    if (next.length === items.length) return error(404, 'Alert not found');
    await saveOrganisationAlertOptions(organisation, next);
    return success({ deletedKey: key });
  } catch (err) {
    console.error('Delete CRM alert error:', err);
    return error(err?.statusCode || 500, err.message || 'Failed to delete CRM alert');
  }
};

/**
 * Get storage usage per practice
 * Track Flossly Docs storage usage for each organisation
 */
export const getStorageUsagePerPractice = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const query = getQuery(event);
  const { organisationId, includeDetails = 'false' } = query;

  try {
    let whereClause = {};
    
    // Filter by specific organisation if provided
    if (organisationId) {
      whereClause.organisationId = parseInt(organisationId);
    }

    // Get all documents
    const documents = await UserDocument.findAll({
      where: whereClause,
      attributes: ['id', 'link', 'name', 'organisationId', 'createdAt']
    });

    // Get unique organisation IDs and fetch organisation details
    const orgIds = [...new Set(documents.map(doc => doc.organisationId).filter(Boolean))];
    const organisations = await Organisation.findAll({
      where: { id: { [Op.in]: orgIds } },
      attributes: ['id', 'name']
    });
    const orgMap = Object.fromEntries(organisations.map(o => [o.id, o.name]));

    // Group documents by organisation
    const orgGroups = {};
    documents.forEach(doc => {
      const orgId = doc.organisationId;
      if (!orgGroups[orgId]) {
        orgGroups[orgId] = {
          organisationId: orgId,
          organisationName: orgMap[orgId] || 'Unknown',
          documents: []
        };
      }
      orgGroups[orgId].documents.push(doc);
    });

    // Calculate storage for each organisation
    const storageByOrg = await Promise.all(
      Object.values(orgGroups).map(async (orgGroup) => {
        let totalSize = 0;
        let successCount = 0;
        let errorCount = 0;
        const documentDetails = [];

        // Get size of each document from S3
        for (const doc of orgGroup.documents) {
          if (!doc.link) {
            errorCount++;
            continue;
          }

          try {
            const s3Object = await getS3Object(doc.link);
            const fileSize = s3Object.contentLength || 0;
            totalSize += fileSize;
            successCount++;

            if (includeDetails === 'true') {
              documentDetails.push({
                id: doc.id,
                name: doc.name,
                link: doc.link,
                sizeBytes: fileSize,
                sizeMB: (fileSize / (1024 * 1024)).toFixed(2),
                createdAt: doc.createdAt
              });
            }
          } catch (err) {
            console.error(`Error getting size for document ${doc.id}:`, err.message);
            errorCount++;
          }
        }

        return {
          organisationId: orgGroup.organisationId,
          organisationName: orgGroup.organisationName,
          totalDocuments: orgGroup.documents.length,
          successfullyScanned: successCount,
          errors: errorCount,
          totalSizeBytes: totalSize,
          totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
          totalSizeGB: (totalSize / (1024 * 1024 * 1024)).toFixed(4),
          ...(includeDetails === 'true' && { documents: documentDetails })
        };
      })
    );

    // Sort by storage size descending
    storageByOrg.sort((a, b) => b.totalSizeBytes - a.totalSizeBytes);

    // Calculate totals
    const totalStats = storageByOrg.reduce((acc, org) => ({
      totalDocuments: acc.totalDocuments + org.totalDocuments,
      totalSizeBytes: acc.totalSizeBytes + org.totalSizeBytes,
      totalOrganisations: acc.totalOrganisations + 1
    }), { totalDocuments: 0, totalSizeBytes: 0, totalOrganisations: 0 });

    return success({
      summary: {
        totalOrganisations: totalStats.totalOrganisations,
        totalDocuments: totalStats.totalDocuments,
        totalStorageBytes: totalStats.totalSizeBytes,
        totalStorageMB: (totalStats.totalSizeBytes / (1024 * 1024)).toFixed(2),
        totalStorageGB: (totalStats.totalSizeBytes / (1024 * 1024 * 1024)).toFixed(4)
      },
      organisations: storageByOrg
    });
  } catch (err) {
    console.error('Get storage usage error:', err);
    return error(500, err.message);
  }
};

/**
 * Admin broadcast notification
 * Send notification to all users or filtered users via FCM and in-app
 */
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
export const extendOrganisationTrial = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const body = await readBody(event);
  const { organisationId, extensionDays } = body;

  if (!organisationId || !extensionDays || extensionDays <= 0) {
    return error(400, "organisationId and valid extensionDays are required");
  }

  try {
    // Get all users in the organisation with Trial license
    const userPreferences = await UserPreference.findAll({
      where: {
        organisationId,
        licenseType: 'Trial'
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'fullName']
        }
      ]
    });

    if (userPreferences.length === 0) {
      return error(404, "No users with Trial license found in this organisation");
    }

    // Extend renewal date for all trial users
    const updates = [];
    for (const pref of userPreferences) {
      const currentRenewalDate = new Date(pref.licenseRenewalDate);
      const newRenewalDate = new Date(currentRenewalDate.getTime() + (extensionDays * 24 * 60 * 60 * 1000));
      
      pref.licenseRenewalDate = newRenewalDate;
      await pref.save();
      
      updates.push({
        userId: pref.userId,
        email: pref.user?.email,
        fullName: pref.user?.fullName,
        previousRenewalDate: currentRenewalDate,
        newRenewalDate: newRenewalDate
      });
    }

    return success({
      message: `Extended trial period by ${extensionDays} days for ${updates.length} user(s)`,
      organisationId,
      extensionDays,
      usersUpdated: updates.length,
      updates
    });
  } catch (err) {
    console.error('Extend organisation trial error:', err);
    return error(500, err.message);
  }
};

export const updateOrganisationInfo = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const body = await readBody(event);
  const { organisationId, updates } = body;

  if (!organisationId || !updates || typeof updates !== 'object') {
    return error(400, "organisationId and updates object are required");
  }

  // Define allowed fields that can be updated
  const allowedFields = [
    'name', 'address', 'description', 'postalCode', 'surgeryCount', 
    'teamCount', 'currentApp', 'contact', 'type', 'managerId', 
    'logo', 'cqcInspectionDate', 'status', 'practiceAnniversaryDate',
    'automationPlaceholders'
  ];

  // Filter updates to only allowed fields
  const filteredUpdates = {};
  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      filteredUpdates[key] = value;
    }
  }

  if (Object.keys(filteredUpdates).length === 0) {
    return error(400, `No valid fields to update. Allowed fields: ${allowedFields.join(', ')}`);
  }

  // Validate type if provided
  if (filteredUpdates.type) {
    const validTypes = ['Dental', 'General Practice', 'Dermatology', 'Physiotherapy'];
    if (!validTypes.includes(filteredUpdates.type)) {
      return error(400, `Invalid type. Must be one of: ${validTypes.join(', ')}`);
    }
  }

  // Validate status if provided
  if (filteredUpdates.status) {
    const validStatuses = ['Invited', 'Active', 'InActive'];
    if (!validStatuses.includes(filteredUpdates.status)) {
      return error(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
  }

  try {
    // Find the organisation
    const organisation = await Organisation.findByPk(organisationId);

    if (!organisation) {
      return error(404, "Organisation not found");
    }

    const previousData = { ...organisation.dataValues };

    // Update the organisation
    await organisation.update(filteredUpdates);

    return success({
      message: `Organisation updated successfully`,
      update: {
        organisationId: organisation.id,
        updatedFields: Object.keys(filteredUpdates),
        previous: previousData,
        current: organisation.dataValues
      }
    });
  } catch (err) {
    console.error('Update organisation error:', err);
    return error(500, err.message);
  }
};

export const updateUserInfo = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const body = await readBody(event);
  const { userId, updates } = body;

  if (!userId || !updates || typeof updates !== 'object') {
    return error(400, "userId and updates object are required");
  }

  // Define allowed fields that can be updated
  const allowedFields = [
    'fullName', 'email', 'dob', 'phone', 'photo', 'address', 
    'status', 'gender', 'nextOfKin', 'nextOfKinContact', 
    'requiredCpdHours', 'roleId'
  ];

  // Filter updates to only allowed fields
  const filteredUpdates = {};
  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      filteredUpdates[key] = value;
    }
  }

  if (Object.keys(filteredUpdates).length === 0) {
    return error(400, `No valid fields to update. Allowed fields: ${allowedFields.join(', ')}`);
  }

  // Validate status if provided
  if (filteredUpdates.status) {
    const validStatuses = ['Active', 'Disabled', 'Invited', 'Expired'];
    if (!validStatuses.includes(filteredUpdates.status)) {
      return error(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
  }

  // Validate gender if provided
  if (filteredUpdates.gender) {
    const validGenders = ['Male', 'Female', 'Other'];
    if (!validGenders.includes(filteredUpdates.gender)) {
      return error(400, `Invalid gender. Must be one of: ${validGenders.join(', ')}`);
    }
  }

  // Validate roleId if provided
  if (filteredUpdates.roleId) {
    const role = await Role.findByPk(filteredUpdates.roleId);
    if (!role) {
      return error(400, 'Invalid roleId - role does not exist');
    }
  }

  try {
    // Find the user
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'title']
        }
      ]
    });

    if (!user) {
      return error(404, "User not found");
    }

    const previousData = { ...user.dataValues };

    // Update the user
    await user.update(filteredUpdates);

    // Reload to get updated role if changed
    await user.reload({
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'title']
        }
      ]
    });

    return success({
      message: `User updated successfully`,
      update: {
        userId: user.id,
        updatedFields: Object.keys(filteredUpdates),
        previous: previousData,
        current: user.dataValues
      }
    });
  } catch (err) {
    console.error('Update user error:', err);
    return error(500, err.message);
  }
};

export const updateUserLicense = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const body = await readBody(event);
  const { userId, organisationId, licenseType, renewalDate } = body;

  if (!userId || !organisationId || !licenseType || !renewalDate) {
    return error(400, "userId, organisationId, licenseType, and renewalDate are required");
  }

  // Validate license type
  const validLicenseTypes = ['System', 'Trial', 'Drift', 'Glide', 'Soar'];
  if (!validLicenseTypes.includes(licenseType)) {
    return error(400, `Invalid licenseType. Must be one of: ${validLicenseTypes.join(', ')}`);
  }

  // Validate renewal date
  const renewalDateObj = new Date(renewalDate);
  if (isNaN(renewalDateObj.getTime())) {
    return error(400, "Invalid renewalDate format. Use ISO 8601 format (e.g., 2026-12-31)");
  }

  try {
    // Find the user preference record
    const userPref = await UserPreference.findOne({
      where: {
        userId,
        organisationId
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'fullName']
        },
        {
          model: Organisation,
          as: 'organisation',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!userPref) {
      return error(404, "User preference not found for the specified user and organisation");
    }

    const previousLicenseType = userPref.licenseType;
    const previousRenewalDate = userPref.licenseRenewalDate;

    // Update license type and renewal date
    userPref.licenseType = licenseType;
    userPref.licenseRenewalDate = renewalDateObj;
    await userPref.save();

    return success({
      message: `License updated successfully for ${userPref.user?.fullName || 'user'}`,
      update: {
        userId: userPref.userId,
        organisationId: userPref.organisationId,
        user: userPref.user,
        organisation: userPref.organisation,
        previous: {
          licenseType: previousLicenseType,
          renewalDate: previousRenewalDate
        },
        current: {
          licenseType: userPref.licenseType,
          renewalDate: userPref.licenseRenewalDate
        }
      }
    });
  } catch (err) {
    console.error('Update user license error:', err);
    return error(500, err.message);
  }
};

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
export const resendInvite = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const body = await readBody(event);
  const { userId, organisationId } = body;

  if (!userId) {
    return error(400, "userId is required");
  }

  try {
    // Get user details
    const user = await User.findByPk(userId, {
      include: [
        {
          model: UserOrganisation,
          as: 'userOrganisations',
          include: [
            {
              model: Organisation,
              as: 'organisation'
            }
          ]
        }
      ]
    });

    if (!user) {
      return error(404, "User not found");
    }

    // Check if user status is "Invited"
    if (user.status !== 'Invited') {
      return error(400, `User status is "${user.status}". Only users with status "Invited" can receive resend invitations.`);
    }

    // Find the organization to get details for email
    let targetOrganisation = null;
    
    if (organisationId) {
      // Specific organization requested
      const userOrg = user.userOrganisations.find(
        uo => uo.organisationId === parseInt(organisationId)
      );
      
      if (!userOrg) {
        return error(404, "User is not associated with the specified organization");
      }
      
      targetOrganisation = userOrg.organisation;
    } else {
      // Use first organization if not specified
      if (!user.userOrganisations || user.userOrganisations.length === 0) {
        return error(400, "User is not associated with any organization");
      }
      
      targetOrganisation = user.userOrganisations[0].organisation;
    }

    // Generate new invite token if not exists
    if (!user.inviteToken) {
      user.inviteToken = uuidv4();
      await user.save();
    }

    // Get admin user details for "invited by" field
    const adminUser = await User.findByPk(admin.userId);
    const managerName = adminUser ? adminUser.fullName : 'Admin';

    // Send invitation email
    await sendInvitationEmail({
      email: user.email,
      orgTitle: targetOrganisation.name,
      link: user.inviteToken,
      manager: managerName
    });

    return success({
      message: `Invitation email resent successfully to ${user.email}`,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        status: user.status
      },
      organisation: {
        id: targetOrganisation.id,
        name: targetOrganisation.name
      },
      sentBy: managerName
    });
  } catch (err) {
    console.error('Resend invite error:', err);
    return error(500, err.message);
  }
};


/**
 * Deduct points from a user (Admin only - for correction/fraud)
 * POST /api/admin/deduct-points
 */
export const deductPoints = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const body = await readBody(event);
    const { userId, points, reason } = body;

    // Validate input
    if (!userId || !points || !reason) {
      return error(400, "userId, points, and reason are required");
    }

    if (typeof points !== 'number' || points <= 0) {
      return error(400, "Points must be a positive number");
    }

    if (reason.trim().length < 10) {
      return error(400, "Reason must be at least 10 characters long");
    }

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return error(404, "User not found");
    }

    // For non-super admins (roleId 17 is super admin), verify user belongs to same organization
    // Note: Regular admins have roleId 8, super admin has roleId 17
    if (admin.roleId !== 17) {
      const userOrg = await UserOrganisation.findOne({
        where: { userId }
      });

      const adminOrg = await UserOrganisation.findOne({
        where: { userId: admin.userId }
      });

      if (!userOrg || !adminOrg || userOrg.organisationId !== adminOrg.organisationId) {
        return error(403, "You can only deduct points from users in your organization");
      }
    }

    // Get user's current points
    let userPoints = await UserPoint.findOne({ where: { userId } });
    
    if (!userPoints) {
      return error(404, "User has no points record");
    }

    if (userPoints.balance < points) {
      return error(400, `Insufficient balance. User has ${userPoints.balance} points, cannot deduct ${points} points`);
    }

    // Start transaction
    const transaction = await sequelize.transaction();

    try {
      // Deduct points from balance
      userPoints.balance -= points;
      await userPoints.save({ transaction });

      // Create negative points history entry
      await UserPointsHistory.create({
        userId,
        rewardPointId: null,
        points: -points, // Negative value to indicate deduction
        description: `[ADMIN DEDUCTION] ${reason} | Deducted by: ${admin.fullName || admin.email} (ID: ${admin.userId})`
      }, { transaction });

      await transaction.commit();

      return success({
        message: "Points deducted successfully",
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email
        },
        pointsDeducted: points,
        newBalance: userPoints.balance,
        reason,
        deductedBy: {
          id: admin.userId,
          name: admin.fullName || admin.email
        },
        timestamp: new Date()
      });

    } catch (err) {
      await transaction.rollback();
      throw err;
    }

  } catch (err) {
    console.error('Deduct points error:', err);
    return error(500, err.message || "Failed to deduct points");
  }
};

/**
 * Award points to a user (Admin only - for bonuses/rewards)
 * POST /api/admin/awardPoints
 */
export const awardPoints = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const body = await readBody(event);
    const { userId, points, reason, rewardPointId } = body;

    // Validate input
    if (!userId || !points || !reason) {
      return error(400, "userId, points, and reason are required");
    }

    if (typeof points !== 'number' || points <= 0) {
      return error(400, "Points must be a positive number");
    }

    if (reason.trim().length < 10) {
      return error(400, "Reason must be at least 10 characters long");
    }

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return error(404, "User not found");
    }

    // For non-super admins (roleId 17 is super admin), verify user belongs to same organization
    // Note: Regular admins have roleId 8, super admin has roleId 17
    if (admin.roleId !== 17) {
      const userOrg = await UserOrganisation.findOne({
        where: { userId }
      });

      const adminOrg = await UserOrganisation.findOne({
        where: { userId: admin.userId }
      });

      if (!userOrg || !adminOrg || userOrg.organisationId !== adminOrg.organisationId) {
        return error(403, "You can only award points to users in your organization");
      }
    }

    // Verify rewardPointId if provided
    if (rewardPointId) {
      const rewardPoint = await RewardPoint.findByPk(rewardPointId);
      if (!rewardPoint) {
        return error(404, "Reward point definition not found");
      }
    }

    // Start transaction
    const transaction = await sequelize.transaction();

    try {
      // Get or create user's points record
      let userPoints = await UserPoint.findOne({ where: { userId } });
      
      if (!userPoints) {
        // First time earning points
        userPoints = await UserPoint.create({
          userId,
          balance: points,
          totalPointsRewarded: points,
          redeemed: 0
        }, { transaction });
      } else {
        // Add to existing balance
        userPoints.balance += points;
        userPoints.totalPointsRewarded += points;
        await userPoints.save({ transaction });
      }

      // Create positive points history entry
      await UserPointsHistory.create({
        userId,
        rewardPointId: rewardPointId || null,
        points: points, // Positive value
        description: `[ADMIN AWARD] ${reason} | Awarded by: ${admin.fullName || admin.email} (ID: ${admin.userId})`
      }, { transaction });

      await transaction.commit();

      return success({
        message: "Points awarded successfully",
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email
        },
        pointsAwarded: points,
        newBalance: userPoints.balance,
        totalRewarded: userPoints.totalPointsRewarded,
        reason,
        awardedBy: {
          id: admin.userId,
          name: admin.fullName || admin.email
        },
        timestamp: new Date()
      });

    } catch (err) {
      await transaction.rollback();
      throw err;
    }

  } catch (err) {
    console.error('Award points error:', err);
    return error(500, err.message || "Failed to award points");
  }
};

/**
 * Get points issued by admin users (reporting)
 * GET /api/admin/pointsIssuedByAdmin
 */
export const getPointsIssuedByAdmin = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const query = getQuery(event);
    const { organisationId, startDate, endDate, adminUserId, action } = query;

    // Build where clause for filtering
    const whereClause = {};
    
    // Filter by organisation (super admin can see all, regular admin only their org)
    if (admin.roleId !== 17) {
      // Regular admin - get their organisation
      const adminOrg = await UserOrganisation.findOne({
        where: { userId: admin.userId }
      });
      if (!adminOrg) {
        return error(404, "Admin organisation not found");
      }
      whereClause['$User.UserOrganisations.organisationId$'] = adminOrg.organisationId;
    } else if (organisationId) {
      // Super admin can filter by specific organisation
      whereClause['$User.UserOrganisations.organisationId$'] = parseInt(organisationId);
    }

    // Filter by date range
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        whereClause.createdAt[Op.lte] = new Date(endDate);
      }
    }

    // Filter by specific admin user
    if (adminUserId) {
      whereClause.description = {
        [Op.like]: `%ID: ${adminUserId}%`
      };
    }

    // Filter by action type (AWARD or DEDUCTION)
    if (action) {
      if (action === 'award') {
        whereClause.description = {
          [Op.like]: '%[ADMIN AWARD]%'
        };
      } else if (action === 'deduct') {
        whereClause.description = {
          [Op.like]: '%[ADMIN DEDUCTION]%'
        };
      }
    }

    // Get all admin-issued points history
    const pointsHistory = await UserPointsHistory.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email'],
          include: [
            {
              model: UserOrganisation,
              as: 'userOrganisations',
              attributes: ['organisationId'],
              include: [
                {
                  model: Organisation,
                  as: 'organisation',
                  attributes: ['id', 'name']
                }
              ]
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Parse and aggregate data
    const adminStats = {};
    const orgStats = {};
    let totalAwarded = 0;
    let totalDeducted = 0;
    const transactions = [];

    pointsHistory.forEach(record => {
      const description = record.description || '';
      
      // Only process admin-issued points
      if (!description.includes('[ADMIN AWARD]') && !description.includes('[ADMIN DEDUCTION]')) {
        return;
      }

      const isAward = description.includes('[ADMIN AWARD]');
      const points = Math.abs(record.points);
      
      // Extract admin info from description
      const adminMatch = description.match(/by: (.+?) \(ID: (\d+)\)/);
      const adminName = adminMatch ? adminMatch[1] : 'Unknown';
      const adminId = adminMatch ? parseInt(adminMatch[2]) : null;

      // Track by admin user
      if (adminId) {
        if (!adminStats[adminId]) {
          adminStats[adminId] = {
            adminId,
            adminName,
            totalAwarded: 0,
            totalDeducted: 0,
            transactionCount: 0
          };
        }
        
        if (isAward) {
          adminStats[adminId].totalAwarded += points;
          totalAwarded += points;
        } else {
          adminStats[adminId].totalDeducted += points;
          totalDeducted += points;
        }
        adminStats[adminId].transactionCount++;
      }

      // Track by organisation
      const userOrg = record.user?.userOrganisations?.[0];
      if (userOrg && userOrg.organisation) {
        const orgId = userOrg.organisation.id;
        const orgName = userOrg.organisation.name;
        
        if (!orgStats[orgId]) {
          orgStats[orgId] = {
            organisationId: orgId,
            organisationName: orgName,
            totalAwarded: 0,
            totalDeducted: 0,
            transactionCount: 0
          };
        }
        
        if (isAward) {
          orgStats[orgId].totalAwarded += points;
        } else {
          orgStats[orgId].totalDeducted += points;
        }
        orgStats[orgId].transactionCount++;
      }

      // Add to transactions list
      transactions.push({
        id: record.id,
        userId: record.userId,
        userName: record.user?.fullName || 'Unknown',
        userEmail: record.user?.email,
        organisationId: userOrg?.organisation?.id,
        organisationName: userOrg?.organisation?.name,
        points: record.points,
        action: isAward ? 'award' : 'deduct',
        description: record.description,
        adminName,
        adminId,
        createdAt: record.createdAt
      });
    });

    return success({
      summary: {
        totalAwarded,
        totalDeducted,
        netChange: totalAwarded - totalDeducted,
        transactionCount: transactions.length
      },
      byAdmin: Object.values(adminStats).sort((a, b) => 
        (b.totalAwarded + b.totalDeducted) - (a.totalAwarded + a.totalDeducted)
      ),
      byOrganisation: Object.values(orgStats).sort((a, b) => 
        (b.totalAwarded + b.totalDeducted) - (a.totalAwarded + a.totalDeducted)
      ),
      transactions
    });

  } catch (err) {
    console.error('Get points issued by admin error:', err);
    return error(500, err.message || "Failed to get points issued by admin");
  }
};

/**
 * Get points totals by practice (reporting)
 * GET /api/admin/pointsTotalsByPractice
 */
export const getPointsTotalsByPractice = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const query = getQuery(event);
    const { organisationId, sortBy = 'totalPoints' } = query;

    // Build organisation filter
    let orgFilter = {};
    if (admin.roleId !== 17) {
      // Regular admin - only their organisation
      const adminOrg = await UserOrganisation.findOne({
        where: { userId: admin.userId }
      });
      if (!adminOrg) {
        return error(404, "Admin organisation not found");
      }
      orgFilter = { id: adminOrg.organisationId };
    } else if (organisationId) {
      // Super admin filtering by specific org
      orgFilter = { id: parseInt(organisationId) };
    }

    // Get all organisations with user point data
    const organisations = await Organisation.findAll({
      where: orgFilter,
      attributes: ['id', 'name'],
      include: [
        {
          model: UserOrganisation,
          as: 'userOrganisations',
          attributes: ['userId'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'fullName', 'email'],
              include: [
                {
                  model: UserPoint,
                  as: 'userPoints',
                  attributes: ['balance', 'totalPointsRewarded', 'redeemed']
                }
              ]
            }
          ]
        }
      ]
    });

    const practiceStats = organisations.map(org => {
      const users = org.userOrganisations || [];
      
      let totalBalance = 0;
      let totalRewarded = 0;
      let totalRedeemed = 0;
      let usersWithPoints = 0;

      users.forEach(userOrg => {
        const user = userOrg.user;
        if (user && user.userPoints) {
          totalBalance += user.userPoints.balance || 0;
          totalRewarded += user.userPoints.totalPointsRewarded || 0;
          totalRedeemed += user.userPoints.redeemed || 0;
          usersWithPoints++;
        }
      });

      return {
        organisationId: org.id,
        organisationName: org.name,
        totalUsers: users.length,
        usersWithPoints,
        totalBalance,
        totalPointsRewarded: totalRewarded,
        totalPointsRedeemed: totalRedeemed,
        averageBalancePerUser: usersWithPoints > 0 ? Math.round(totalBalance / usersWithPoints) : 0,
        averageRewardedPerUser: usersWithPoints > 0 ? Math.round(totalRewarded / usersWithPoints) : 0
      };
    });

    // Sort results
    const sortField = {
      'totalPoints': 'totalPointsRewarded',
      'balance': 'totalBalance',
      'redeemed': 'totalPointsRedeemed',
      'users': 'usersWithPoints'
    }[sortBy] || 'totalPointsRewarded';

    practiceStats.sort((a, b) => b[sortField] - a[sortField]);

    // Calculate grand totals
    const grandTotals = practiceStats.reduce((acc, org) => ({
      totalOrganisations: acc.totalOrganisations + 1,
      totalUsers: acc.totalUsers + org.totalUsers,
      totalUsersWithPoints: acc.totalUsersWithPoints + org.usersWithPoints,
      totalBalance: acc.totalBalance + org.totalBalance,
      totalPointsRewarded: acc.totalPointsRewarded + org.totalPointsRewarded,
      totalPointsRedeemed: acc.totalPointsRedeemed + org.totalPointsRedeemed
    }), {
      totalOrganisations: 0,
      totalUsers: 0,
      totalUsersWithPoints: 0,
      totalBalance: 0,
      totalPointsRewarded: 0,
      totalPointsRedeemed: 0
    });

    return success({
      grandTotals,
      practices: practiceStats
    });

  } catch (err) {
    console.error('Get points totals by practice error:', err);
    return error(500, err.message || "Failed to get points totals by practice");
  }
};

/**
 * Search organisations by name (paginated)
 * GET /api/admin/searchOrganisations
 */
export const searchOrganisations = async (event) => {
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
    
    // For non-super admins, only show their organisation
    if (admin.roleId !== 17) {
      const adminOrg = await UserOrganisation.findOne({
        where: { userId: admin.userId }
      });
      if (!adminOrg) {
        return error(404, "Admin organisation not found");
      }
      whereClause.id = adminOrg.organisationId;
    }

    // Add name search if provided
    if (search.trim()) {
      whereClause.name = {
        [Op.iLike]: `%${search.trim()}%`
      };
    }

    // Get organisations with pagination
    const { count, rows: organisations } = await Organisation.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'name', 'contact', 'address', 'postalCode', 'type', 'status', 'createdAt'],
      order: [['name', 'ASC']],
      limit: parseInt(limit),
      offset
    });

    return success({
      organisations,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });

  } catch (err) {
    console.error('Search organisations error:', err);
    return error(500, err.message || "Failed to search organisations");
  }
};

/**
 * Get organisation by ID
 * GET /api/admin/getOrganisationById?id=5
 */
export const getOrganisationById = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const query = getQuery(event);
    const { id } = query;

    if (!id) {
      return error(400, "Organisation ID is required");
    }

    // For non-super admins, verify they can access this organisation
    if (admin.roleId !== 17) {
      const adminOrg = await UserOrganisation.findOne({
        where: { userId: admin.userId }
      });
      
      if (!adminOrg || adminOrg.organisationId !== parseInt(id)) {
        return error(403, "You can only access your own organisation");
      }
    }

    // Get organisation with user count
    const organisation = await Organisation.findByPk(parseInt(id), {
      attributes: ['id', 'name', 'contact', 'address', 'postalCode', 'description', 'type', 'status', 'surgeryCount', 'teamCount', 'managerId', 'createdAt', 'updatedAt'],
      include: [
        {
          model: UserOrganisation,
          as: 'userOrganisations',
          attributes: ['userId', 'createdAt'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'fullName', 'email', 'status']
            }
          ]
        }
      ]
    });

    if (!organisation) {
      return error(404, "Organisation not found");
    }

    // Format response
    const users = organisation.userOrganisations?.map(uo => ({
      userId: uo.user?.id,
      fullName: uo.user?.fullName,
      email: uo.user?.email,
      status: uo.user?.status,
      joinedAt: uo.createdAt
    })) || [];

    return success({
      organisation: {
        id: organisation.id,
        name: organisation.name,
        contact: organisation.contact,
        address: organisation.address,
        postalCode: organisation.postalCode,
        description: organisation.description,
        type: organisation.type,
        status: organisation.status,
        surgeryCount: organisation.surgeryCount,
        teamCount: organisation.teamCount,
        managerId: organisation.managerId,
        createdAt: organisation.createdAt,
        updatedAt: organisation.updatedAt,
        userCount: users.length,
        users
      }
    });

  } catch (err) {
    console.error('Get organisation by ID error:', err);
    return error(500, err.message || "Failed to get organisation");
  }
};

/**
 * Search roles by name (paginated)
 * GET /api/admin/searchRoles
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

// ============================================
// Admin Bulk Task Upload (No User Assignment)
// ============================================

/**
 * Admin bulk task upload from CSV
 * This endpoint creates tasks in the task pool WITHOUT user assignment
 * Unlike the regular bulk upload, this doesn't require a user column
 */
export const adminBulkUploadTasks = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const formidable = (await import('formidable')).default;
    const fs = await import('fs');
    const { parse } = await import('csv-parse');

    const form = formidable({ multiples: false });
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(event.node.req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const file = files.file[0];
    if (!file) {
      return error(400, "No CSV file provided");
    }

    // Parse CSV
    const records = await new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(file.filepath)
        .pipe(parse({ columns: true, trim: true }))
        .on("data", (data) => results.push(data))
        .on("end", () => resolve(results))
        .on("error", (err) => reject(err));
    });

    if (!records || records.length === 0) {
      return error(400, "CSV file is empty or invalid");
    }

    // Validate and prepare tasks for insertion
    const tasksToInsert = [];
    const errors = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowNum = i + 2; // +2 because row 1 is header and index starts at 0

      // Validate required fields
      if (!record.title || !record.title.trim()) {
        errors.push(`Row ${rowNum}: Title is required`);
        continue;
      }

      // Validate categoryId is required
      if (!record.categoryId || !record.categoryId.trim()) {
        errors.push(`Row ${rowNum}: categoryId is required`);
        continue;
      }

      const categoryId = Number(record.categoryId);
      if (isNaN(categoryId)) {
        errors.push(`Row ${rowNum}: Invalid categoryId - must be a number`);
        continue;
      }

      // Prepare task object
      const taskData = {
        title: record.title.trim(),
        description: record.description ? record.description.trim() : null,
        categoryId: categoryId,
        roleId: record.roleId ? Number(record.roleId) : null,
        defaultFrequency: record.defaultFrequency || null,
        isSystemTask: true, // Admin uploaded tasks are system tasks (visible in task pool)
      };

      // Validate roleId if provided
      if (record.roleId && isNaN(Number(record.roleId))) {
        errors.push(`Row ${rowNum}: Invalid roleId`);
        continue;
      }

      tasksToInsert.push(taskData);
    }

    // If there are validation errors, return them
    if (errors.length > 0 && tasksToInsert.length === 0) {
      return error(400, `Validation errors: ${errors.join(', ')}`);
    }

    // Insert tasks into database
    let createdTasks = [];
    if (tasksToInsert.length > 0) {
      createdTasks = await Task.bulkCreate(tasksToInsert);
    }

    return success({
      message: `Successfully uploaded ${createdTasks.length} tasks`,
      created: createdTasks.length,
      errors: errors.length > 0 ? errors : undefined,
      tasks: createdTasks.map(t => ({
        id: t.id,
        title: t.title,
        categoryId: t.categoryId,
        roleId: t.roleId,
        defaultFrequency: t.defaultFrequency
      }))
    });

  } catch (err) {
    console.error('Admin bulk upload tasks error:', err);
    return error(500, err.message || "Failed to upload tasks");
  }
};

/**
 * Download CSV template for admin bulk task upload
 * This template does NOT include user column
 */
export const downloadAdminTaskTemplate = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    // CSV template with categoryId column
    const csvContent = `title,description,categoryId,roleId,defaultFrequency
Morning Rounds,Complete morning patient rounds,1,1,Daily
Equipment Check,Check all medical equipment,1,1,Weekly
Inventory Review,Review inventory levels,1,1,Monthly
Staff Meeting,Weekly staff meeting,1,1,Weekly
Safety Inspection,Perform safety inspection,1,1,Monthly`;

    // Set headers for CSV download
    event.node.res.setHeader('Content-Type', 'text/csv');
    event.node.res.setHeader('Content-Disposition', 'attachment; filename="admin-task-template.csv"');
    
    return csvContent;

  } catch (err) {
    console.error('Download admin task template error:', err);
    return error(500, err.message || "Failed to download template");
  }
};

// ============================================
// Default Priorities and Statuses Management
// ============================================

/**
 * Get all default priorities
 */
export const getDefaultPriorities = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const { DefaultPriority } = await import('../models/index.js');
    
    const priorities = await DefaultPriority.findAll({
      order: [['sortOrder', 'ASC']]
    });

    return success({
      priorities,
      total: priorities.length
    });

  } catch (err) {
    console.error('Get default priorities error:', err);
    return error(500, err.message || "Failed to get default priorities");
  }
};

/**
 * Get all default statuses
 */
export const getDefaultStatuses = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const { DefaultStatus } = await import('../models/index.js');
    
    const statuses = await DefaultStatus.findAll({
      order: [['id', 'ASC']]
    });

    return success({
      statuses,
      total: statuses.length
    });

  } catch (err) {
    console.error('Get default statuses error:', err);
    return error(500, err.message || "Failed to get default statuses");
  }
};

/**
 * Create a new default priority
 */
export const createDefaultPriority = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const { DefaultPriority } = await import('../models/index.js');
    const body = await readBody(event);
    const { key, name, color, sortOrder } = typeof body === 'string' ? JSON.parse(body) : body;

    if (!key || !name) {
      return error(400, "Key and name are required");
    }

    if (sortOrder === undefined) {
      return error(400, "Sort order is required");
    }

    // Check if key already exists
    const existingPriority = await DefaultPriority.findOne({ where: { key } });
    if (existingPriority) {
      return error(400, "A priority with this key already exists");
    }

    // Create the default priority
    const priority = await DefaultPriority.create({
      key,
      name,
      color: color || null,
      sortOrder
    });

    return success({
      message: "Default priority created successfully",
      priority
    });

  } catch (err) {
    console.error('Create default priority error:', err);
    return error(500, err.message || "Failed to create default priority");
  }
};

/**
 * Update a default priority and cascade to all organisations
 */
export const updateDefaultPriority = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const { DefaultPriority, OrganisationPriority } = await import('../models/index.js');
    const body = await readBody(event);
    const { id, name, color, sortOrder } = typeof body === 'string' ? JSON.parse(body) : body;

    if (!id) {
      return error(400, "Priority ID is required");
    }

    // Find the default priority
    const defaultPriority = await DefaultPriority.findByPk(id);
    if (!defaultPriority) {
      return error(404, "Default priority not found");
    }

    // Store the key for matching organisation priorities
    const priorityKey = defaultPriority.key;

    // Update default priority
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (color !== undefined) updateData.color = color;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    await defaultPriority.update(updateData);

    // Cascade update to all organisation priorities with the same key
    const orgUpdateData = {};
    if (name !== undefined) orgUpdateData.name = name;
    if (color !== undefined) orgUpdateData.color = color;
    if (sortOrder !== undefined) orgUpdateData.sortOrder = sortOrder;

    const [updatedCount] = await OrganisationPriority.update(
      orgUpdateData,
      {
        where: { key: priorityKey }
      }
    );

    return success({
      message: "Default priority updated successfully",
      priority: defaultPriority,
      organisationsUpdated: updatedCount
    });

  } catch (err) {
    console.error('Update default priority error:', err);
    return error(500, err.message || "Failed to update default priority");
  }
};

/**
 * Create a new default status
 */
export const createDefaultStatus = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const { DefaultStatus } = await import('../models/index.js');
    const body = await readBody(event);
    const { key, name, color, description } = typeof body === 'string' ? JSON.parse(body) : body;

    if (!key || !name) {
      return error(400, "Key and name are required");
    }

    // Check if key already exists
    const existingStatus = await DefaultStatus.findOne({ where: { key } });
    if (existingStatus) {
      return error(400, "A status with this key already exists");
    }

    // Create the default status
    const status = await DefaultStatus.create({
      key,
      name,
      color: color || null,
      description: description || null
    });

    return success({
      message: "Default status created successfully",
      status
    });

  } catch (err) {
    console.error('Create default status error:', err);
    return error(500, err.message || "Failed to create default status");
  }
};

/**
 * Update a default status and cascade to all organisations
 */
export const updateDefaultStatus = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const { DefaultStatus, OrganisationStatus } = await import('../models/index.js');
    const body = await readBody(event);
    const { id, name, color, description } = typeof body === 'string' ? JSON.parse(body) : body;

    if (!id) {
      return error(400, "Status ID is required");
    }

    // Find the default status
    const defaultStatus = await DefaultStatus.findByPk(id);
    if (!defaultStatus) {
      return error(404, "Default status not found");
    }

    // Store the key for matching organisation statuses
    const statusKey = defaultStatus.key;

    // Update default status
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (color !== undefined) updateData.color = color;
    if (description !== undefined) updateData.description = description;

    await defaultStatus.update(updateData);

    // Cascade update to all organisation statuses with the same key
    const orgUpdateData = {};
    if (name !== undefined) orgUpdateData.name = name;
    if (color !== undefined) orgUpdateData.color = color;
    if (description !== undefined) orgUpdateData.description = description;

    const [updatedCount] = await OrganisationStatus.update(
      orgUpdateData,
      {
        where: { key: statusKey }
      }
    );

    return success({
      message: "Default status updated successfully",
      status: defaultStatus,
      organisationsUpdated: updatedCount
    });

  } catch (err) {
    console.error('Update default status error:', err);
    return error(500, err.message || "Failed to update default status");
  }
};

/**
 * Get all checklists with optional filtering
 * GET /api/admin/getChecklists?taskId=123&search=fire
 */
export const getChecklists = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const { TaskChecklist, Task } = await import('../models/index.js');
    const query = getQuery(event);
    const { taskId, search, limit = 100, offset = 0 } = query;

    const whereClause = {};
    
    if (taskId) {
      whereClause.taskId = parseInt(taskId);
    }

    if (search) {
      whereClause[Op.or] = [
        { question: { [Op.like]: `%${search}%` } },
        { category: { [Op.like]: `%${search}%` } }
      ];
    }

    const checklists = await TaskChecklist.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Task,
          as: 'task',
          attributes: ['id', 'title', 'description']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['taskId', 'ASC'], ['id', 'ASC']]
    });

    return success({
      checklists: checklists.rows,
      total: checklists.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (err) {
    console.error('Get checklists error:', err);
    return error(500, err.message || "Failed to get checklists");
  }
};

/**
 * Get checklist by ID
 * GET /api/admin/getChecklistById?id=123
 */
export const getChecklistById = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const { TaskChecklist, Task } = await import('../models/index.js');
    const query = getQuery(event);
    const { id } = query;

    if (!id) {
      return error(400, "Checklist ID is required");
    }

    const checklist = await TaskChecklist.findByPk(id, {
      include: [
        {
          model: Task,
          as: 'task',
          attributes: ['id', 'title', 'description', 'categoryId', 'roleId']
        }
      ]
    });

    if (!checklist) {
      return error(404, "Checklist not found");
    }

    return success({ checklist });

  } catch (err) {
    console.error('Get checklist by ID error:', err);
    return error(500, err.message || "Failed to get checklist");
  }
};

/**
 * Create a new checklist item
 * POST /api/admin/createChecklist
 */
export const createChecklist = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const { TaskChecklist, Task } = await import('../models/index.js');
    const body = await readBody(event);
    const {
      taskId,
      question,
      category,
      fieldOneTitle,
      fieldOneValue,
      fieldTwoTitle,
      fieldTwoValue,
      showRadio,
      showTime,
      showDate,
      radioValue,
      timeValue,
      dateValue
    } = body;

    // Validate required fields
    if (!taskId) {
      return error(400, "taskId is required");
    }

    if (!question) {
      return error(400, "question is required");
    }

    // Verify task exists
    const task = await Task.findByPk(taskId);
    if (!task) {
      return error(404, "Task not found");
    }

    // Create checklist item
    const checklist = await TaskChecklist.create({
      taskId: parseInt(taskId),
      question,
      category: category || null,
      fieldOneTitle: fieldOneTitle || null,
      fieldOneValue: fieldOneValue || null,
      fieldTwoTitle: fieldTwoTitle || null,
      fieldTwoValue: fieldTwoValue || null,
      showRadio: showRadio !== undefined ? showRadio : false,
      showTime: showTime !== undefined ? showTime : false,
      showDate: showDate !== undefined ? showDate : false,
      radioValue: radioValue || 'N/A',
      timeValue: timeValue || null,
      dateValue: dateValue || null
    });

    return success({
      message: "Checklist item created successfully",
      checklist
    });

  } catch (err) {
    console.error('Create checklist error:', err);
    return error(500, err.message || "Failed to create checklist");
  }
};

/**
 * Update a checklist item
 * PUT /api/admin/updateChecklist
 */
export const updateChecklist = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const { TaskChecklist } = await import('../models/index.js');
    const body = await readBody(event);
    const {
      id,
      question,
      category,
      fieldOneTitle,
      fieldOneValue,
      fieldTwoTitle,
      fieldTwoValue,
      showRadio,
      showTime,
      showDate,
      radioValue,
      timeValue,
      dateValue
    } = body;

    if (!id) {
      return error(400, "Checklist ID is required");
    }

    // Find checklist item
    const checklist = await TaskChecklist.findByPk(id);
    if (!checklist) {
      return error(404, "Checklist item not found");
    }

    // Update fields
    const updateData = {};
    if (question !== undefined) updateData.question = question;
    if (category !== undefined) updateData.category = category;
    if (fieldOneTitle !== undefined) updateData.fieldOneTitle = fieldOneTitle;
    if (fieldOneValue !== undefined) updateData.fieldOneValue = fieldOneValue;
    if (fieldTwoTitle !== undefined) updateData.fieldTwoTitle = fieldTwoTitle;
    if (fieldTwoValue !== undefined) updateData.fieldTwoValue = fieldTwoValue;
    if (showRadio !== undefined) updateData.showRadio = showRadio;
    if (showTime !== undefined) updateData.showTime = showTime;
    if (showDate !== undefined) updateData.showDate = showDate;
    if (radioValue !== undefined) updateData.radioValue = radioValue;
    if (timeValue !== undefined) updateData.timeValue = timeValue;
    if (dateValue !== undefined) updateData.dateValue = dateValue;

    await checklist.update(updateData);

    return success({
      message: "Checklist item updated successfully",
      checklist
    });

  } catch (err) {
    console.error('Update checklist error:', err);
    return error(500, err.message || "Failed to update checklist");
  }
};

/**
 * Delete a checklist item
 * DELETE /api/admin/deleteChecklist
 */
export const deleteChecklist = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const { TaskChecklist } = await import('../models/index.js');
    const body = await readBody(event);
    const { id } = body;

    if (!id) {
      return error(400, "Checklist ID is required");
    }

    // Validate that id is a number
    const checklistId = parseInt(id);
    if (isNaN(checklistId)) {
      return error(400, "Checklist ID must be a valid number");
    }

    // Find the specific checklist item by primary key
    const checklist = await TaskChecklist.findByPk(checklistId);
    
    if (!checklist) {
      return error(404, "Checklist item not found");
    }

    // Log the checklist details before deletion for debugging
    const checklistInfo = {
      id: checklist.id,
      taskId: checklist.taskId,
      question: checklist.question
    };
    
    console.log(`[Admin Delete Checklist] Deleting checklist ID ${checklistInfo.id} from task ID ${checklistInfo.taskId}`);

    // Delete using destroy with hooks disabled to prevent any cascade issues
    await TaskChecklist.destroy({
      where: { id: checklistId },
      hooks: false,
      individualHooks: false
    });

    console.log(`[Admin Delete Checklist] Successfully deleted checklist ID ${checklistInfo.id}`);

    return success({
      message: "Checklist item deleted successfully",
      deletedId: checklistId,
      deletedChecklistInfo: checklistInfo
    });

  } catch (err) {
    console.error('Delete checklist error:', err);
    return error(500, err.message || "Failed to delete checklist");
  }
};

/**
 * Bulk upload checklists from CSV
 * POST /api/admin/bulkUploadChecklists
 * CSV Format: taskTitle,itemTitle,showRadio,defaultComment
 */
export const bulkUploadChecklists = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const { TaskChecklist, Task } = await import('../models/index.js');
    const formidable = (await import('formidable')).default;
    const fs = await import('fs');
    const { parse } = await import('csv-parse');

    const form = formidable({ multiples: false });
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(event.node.req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const file = files.file?.[0];
    if (!file) {
      return error(400, "No CSV file provided");
    }

    // Parse CSV
    const records = await new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(file.filepath)
        .pipe(parse({ columns: true, trim: true }))
        .on("data", (data) => results.push(data))
        .on("end", () => resolve(results))
        .on("error", (err) => reject(err));
    });

    if (!records || records.length === 0) {
      return error(400, "CSV file is empty or invalid");
    }

    // Group records by task title
    const taskGroups = new Map();
    records.forEach((record, index) => {
      const taskTitle = (record.taskTitle || '').trim();
      const itemTitle = (record.itemTitle || '').trim();
      
      if (!taskTitle || !itemTitle) {
        return; // Skip invalid rows
      }

      const key = taskTitle.toLowerCase();
      if (!taskGroups.has(key)) {
        taskGroups.set(key, {
          taskTitle: taskTitle,
          items: []
        });
      }

      // Parse showRadio - default to TRUE if not specified
      const showRadio = record.showRadio?.toString().toUpperCase() !== 'FALSE';

      taskGroups.get(key).items.push({
        question: itemTitle,
        showRadio: showRadio,
        defaultComment: (record.defaultComment || '').trim()
      });
    });

    const results = [];
    const transaction = await sequelize.transaction();
    
    try {
      for (const [key, group] of taskGroups) {
        const taskTitle = group.taskTitle;
        const items = group.items;

        // Find task by title (case insensitive)
        let task = await Task.findOne({ 
          where: { 
            title: { [Op.iLike]: taskTitle },
            isSystemTask: true 
          } 
        });

        // If task doesn't exist, create it as a system task
        if (!task) {
          task = await Task.create({
            title: taskTitle,
            description: `Auto-created from admin checklist upload`,
            categoryId: 2, // Default category
            roleId: null,
            defaultFrequency: null,
            isSystemTask: true
          }, { transaction });
        }

        // Add checklist items to the task
        let createdCount = 0;
        for (const item of items) {
          const question = item.question.trim();
          if (!question) continue;

          // Check if checklist already exists
          const existing = await TaskChecklist.findOne({ 
            where: { 
              taskId: task.id, 
              question 
            } 
          });

          if (!existing) {
            await TaskChecklist.create({
              taskId: task.id,
              question,
              category: null,
              showRadio: item.showRadio,
              showDate: false,
              showTime: false,
              fieldOneTitle: 'Comments / Notes',
              fieldOneValue: item.defaultComment || '',
              fieldTwoTitle: null,
              fieldTwoValue: null,
              radioValue: 'N/A',
              timeValue: null,
              dateValue: null
            }, { transaction });
            createdCount++;
          }
        }

        results.push({ 
          taskTitle, 
          taskId: task.id,
          status: 'success', 
          created: createdCount,
          skipped: items.length - createdCount
        });
      }

      await transaction.commit();

      const successCount = results.filter(r => r.status === 'success').length;
      const totalCreated = results.reduce((sum, r) => sum + (r.created || 0), 0);

      return success({ 
        message: `${successCount} task(s) processed, ${totalCreated} checklist(s) created from ${records.length} rows`,
        summary: {
          totalRows: records.length,
          tasksProcessed: successCount,
          checklistsCreated: totalCreated
        },
        results 
      });

    } catch (err) {
      await transaction.rollback();
      throw err;
    }

  } catch (err) {
    console.error('Bulk upload checklists error:', err);
    return error(500, err.message || "Failed to bulk upload checklists");
  }
};

/**
 * Download checklist CSV template
 * GET /api/admin/downloadChecklistTemplate
 */
export const downloadChecklistTemplate = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const csv = `taskTitle,itemTitle,showRadio,defaultComment
Fire Safety Check,Check fire alarm,TRUE,
Fire Safety Check,Check extinguishers,TRUE,Last serviced this month
Surgery Prep,Sterilize tools,TRUE,
Surgery Prep,Prep chair,TRUE,
Opening Checks,Unlock premises,TRUE,Note time of arrival
Opening Checks,Turn on all lights,TRUE,
Opening Checks,Check waiting room,TRUE,Ensure clean and tidy`;

    // Set headers for CSV download
    setResponseHeader(event, 'Content-Type', 'text/csv');
    setResponseHeader(event, 'Content-Disposition', 'attachment; filename="checklist-template.csv"');
    
    return csv;

  } catch (err) {
    console.error('Download checklist template error:', err);
    return error(500, err.message || "Failed to download template");
  }
};

/**
 * Get all system task categories (parent categories only)
 * GET /api/admin/getTaskCategories
 */
export const getTaskCategories = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const { TaskCategory, Task } = await import('../models/index.js');
    const query = getQuery(event);
    const { includeSubcategories = 'true', includeTaskCount = 'true' } = query;

    // Build query for parent categories (system categories only)
    const whereClause = {
      isDeleted: false,
      organisationId: null,  // System categories only
      parentId: null         // Parent categories only
    };

    const includeOptions = [];

    // Include task count if requested
    if (includeTaskCount === 'true') {
      includeOptions.push({
        model: Task,
        as: "tasks",
        attributes: [],
        required: false,
        where: { isSystemTask: true }
      });
    }

    // Include subcategories if requested
    if (includeSubcategories === 'true') {
      includeOptions.push({
        model: TaskCategory,
        as: "subcategories",
        where: { isDeleted: false },
        required: false,
        attributes: ['id', 'name', 'description', 'color', 'parentId', 'organisationId', 'createdAt']
      });
    }

    const attributes = includeTaskCount === 'true' 
      ? {
          include: [[sequelize.fn("COUNT", sequelize.col("tasks.id")), "taskCount"]],
        }
      : undefined;

    const categories = await TaskCategory.findAll({
      where: whereClause,
      attributes,
      include: includeOptions,
      group: includeTaskCount === 'true' ? ["TaskCategories.id", "subcategories.id"] : undefined,
      order: [['id', 'ASC']]
    });

    return success({
      total: categories.length,
      categories
    });

  } catch (err) {
    console.error('Get task categories error:', err);
    return error(500, err.message || "Failed to get task categories");
  }
};

/**
 * Get task category by ID (with subcategories)
 * GET /api/admin/getTaskCategoryById?id=1
 */
export const getTaskCategoryById = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const { TaskCategory, Task } = await import('../models/index.js');
    const query = getQuery(event);
    const { id } = query;

    if (!id) {
      return error(400, "Category ID is required");
    }

    const category = await TaskCategory.findOne({
      where: {
        id: parseInt(id),
        isDeleted: false,
        organisationId: null  // System categories only
      },
      include: [
        {
          model: TaskCategory,
          as: "subcategories",
          where: { isDeleted: false },
          required: false,
          attributes: ['id', 'name', 'description', 'color', 'parentId', 'organisationId', 'createdAt']
        },
        {
          model: TaskCategory,
          as: "parent",
          attributes: ['id', 'name', 'description', 'color'],
          required: false
        }
      ]
    });

    if (!category) {
      return error(404, "Category not found");
    }

    return success({ category });

  } catch (err) {
    console.error('Get task category by ID error:', err);
    return error(500, err.message || "Failed to get task category");
  }
};

/**
 * Get all subcategories for a parent category
 * GET /api/admin/getTaskSubcategories?parentId=1
 */
export const getTaskSubcategories = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const { TaskCategory } = await import('../models/index.js');
    const query = getQuery(event);
    const { parentId } = query;

    if (!parentId) {
      return error(400, "parentId is required");
    }

    // Verify parent exists and is a system category
    const parent = await TaskCategory.findOne({
      where: {
        id: parseInt(parentId),
        isDeleted: false,
        organisationId: null,
        parentId: null  // Must be a parent category
      }
    });

    if (!parent) {
      return error(404, "Parent category not found");
    }

    const subcategories = await TaskCategory.findAll({
      where: {
        parentId: parseInt(parentId),
        isDeleted: false,
        organisationId: null  // System subcategories only
      },
      order: [['name', 'ASC']]
    });

    return success({
      parentCategory: {
        id: parent.id,
        name: parent.name
      },
      total: subcategories.length,
      subcategories
    });

  } catch (err) {
    console.error('Get task subcategories error:', err);
    return error(500, err.message || "Failed to get subcategories");
  }
};

/**
 * Create a new task category (parent or subcategory)
 * POST /api/admin/createTaskCategory
 */
export const createTaskCategory = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const { TaskCategory } = await import('../models/index.js');
    const body = await readBody(event);
    const { name, description, color, parentId } = body;

    if (!name || !name.trim()) {
      return error(400, "Category name is required");
    }

    // If parentId is provided, verify it exists and is a system parent category
    if (parentId) {
      const parent = await TaskCategory.findOne({
        where: {
          id: parseInt(parentId),
          isDeleted: false,
          organisationId: null,
          parentId: null  // Must be a parent category
        }
      });

      if (!parent) {
        return error(404, "Parent category not found or is not a system parent category");
      }
    }

    // Check for duplicate name at the same level
    const existingCategory = await TaskCategory.findOne({
      where: {
        name: name.trim(),
        isDeleted: false,
        organisationId: null,
        parentId: parentId ? parseInt(parentId) : null
      }
    });

    if (existingCategory) {
      return error(400, `Category "${name}" already exists at this level`);
    }

    // Create the category
    const category = await TaskCategory.create({
      name: name.trim(),
      description: description?.trim() || null,
      color: color || null,
      parentId: parentId ? parseInt(parentId) : null,
      organisationId: null,  // System category
      isDeleted: false
    });

    return success({
      message: `${parentId ? 'Subcategory' : 'Category'} created successfully`,
      category
    });

  } catch (err) {
    console.error('Create task category error:', err);
    return error(500, err.message || "Failed to create category");
  }
};

/**
 * Update a task category
 * PUT /api/admin/updateTaskCategory
 */
export const updateTaskCategory = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const { TaskCategory } = await import('../models/index.js');
    const body = await readBody(event);
    const { id, name, description, color } = body;

    if (!id) {
      return error(400, "Category ID is required");
    }

    // Find the category
    const category = await TaskCategory.findOne({
      where: {
        id: parseInt(id),
        isDeleted: false,
        organisationId: null  // System categories only
      }
    });

    if (!category) {
      return error(404, "Category not found");
    }

    // Check for duplicate name if name is being changed
    if (name && name.trim() !== category.name) {
      const existingCategory = await TaskCategory.findOne({
        where: {
          name: name.trim(),
          isDeleted: false,
          organisationId: null,
          parentId: category.parentId,
          id: { [Op.ne]: parseInt(id) }  // Exclude current category
        }
      });

      if (existingCategory) {
        return error(400, `Category "${name}" already exists at this level`);
      }
    }

    // Update fields
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (color !== undefined) updateData.color = color || null;

    await category.update(updateData);

    return success({
      message: "Category updated successfully",
      category
    });

  } catch (err) {
    console.error('Update task category error:', err);
    return error(500, err.message || "Failed to update category");
  }
};

/**
 * Soft delete a task category
 * DELETE /api/admin/deleteTaskCategory
 */
export const deleteTaskCategory = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const { TaskCategory, Task } = await import('../models/index.js');
    const body = await readBody(event);
    const { id } = body;

    if (!id) {
      return error(400, "Category ID is required");
    }

    const categoryId = parseInt(id);

    // Find the category
    const category = await TaskCategory.findOne({
      where: {
        id: categoryId,
        isDeleted: false,
        organisationId: null  // System categories only
      }
    });

    if (!category) {
      return error(404, "Category not found");
    }

    // Check if category has tasks
    const taskCount = await Task.count({
      where: {
        categoryId: categoryId,
        isSystemTask: true
      }
    });

    if (taskCount > 0) {
      return error(400, `Cannot delete category. It has ${taskCount} task(s) assigned to it. Please reassign or delete the tasks first.`);
    }

    // Check if it's a parent category with subcategories
    const subcategoryCount = await TaskCategory.count({
      where: {
        parentId: categoryId,
        isDeleted: false,
        organisationId: null
      }
    });

    if (subcategoryCount > 0) {
      return error(400, `Cannot delete category. It has ${subcategoryCount} subcategory(ies). Please delete or reassign the subcategories first.`);
    }

    // Soft delete the category
    await category.update({ isDeleted: true });

    return success({
      message: "Category deleted successfully",
      deletedId: categoryId
    });

  } catch (err) {
    console.error('Delete task category error:', err);
    return error(500, err.message || "Failed to delete category");
  }
};

// ============================================
// Rota Management (Organisation Level)
// ============================================

/**
 * List all rotas for an organisation
 * GET /api/admin/listOrgsRotas?organisationId=1
 */
export const listOrgsRotas = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const query = getQuery(event);
  const { organisationId, includeShifts = 'false', limit = 100, offset = 0 } = query;

  if (!organisationId) {
    return error(400, "organisationId is required");
  }

  try {
    // Verify organisation exists
    const organisation = await Organisation.findByPk(parseInt(organisationId), {
      attributes: ['id', 'name']
    });

    if (!organisation) {
      return error(404, "Organisation not found");
    }

    const whereClause = {
      organisationId: parseInt(organisationId),
      isDeleted: false
    };

    const rotas = await Rota.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return success({
      organisationId: organisation.id,
      organisationName: organisation.name,
      rotas: rotas.rows,
      total: rotas.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (err) {
    console.error('List org rotas error:', err);
    return error(500, err.message || "Failed to list rotas");
  }
};

/**
 * Get rota by ID
 * GET /api/admin/getRotaById?id=1&organisationId=1
 */
export const getRotaById = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const query = getQuery(event);
  const { id, organisationId } = query;

  if (!id) {
    return error(400, "id is required");
  }

  if (!organisationId) {
    return error(400, "organisationId is required");
  }

  try {
    const rota = await Rota.findOne({
      where: {
        id: parseInt(id),
        organisationId: parseInt(organisationId),
        isDeleted: false
      },
      include: [
        {
          model: RotaShift,
          as: "shifts",
          where: { isDeleted: false },
          required: false,
          order: [['startDate', 'ASC']]
        },
        {
          model: RotaUser,
          as: "users",
          required: false,
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "fullName", "email", "photo"]
            }
          ]
        }
      ]
    });

    if (!rota) {
      return error(404, "Rota not found");
    }

    return success({ rota });

  } catch (err) {
    console.error('Get rota by ID error:', err);
    return error(500, err.message || "Failed to get rota");
  }
};

/**
 * Create a new rota for an organisation
 * POST /api/admin/createRota
 */
export const createRota = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const body = await readBody(event);
    const { organisationId, name, startDate, endDate, duration, notes } = body;

    if (!organisationId) {
      return error(400, "organisationId is required");
    }

    if (!name || !name.trim()) {
      return error(400, "name is required");
    }

    if (!startDate || !endDate) {
      return error(400, "startDate and endDate are required");
    }

    if (new Date(endDate) < new Date(startDate)) {
      return error(400, "End date cannot be before start date");
    }

    // Verify organisation exists
    const organisation = await Organisation.findByPk(parseInt(organisationId), {
      attributes: ['id', 'name']
    });

    if (!organisation) {
      return error(404, "Organisation not found");
    }

    // Check for conflicting rotas
    const conflictRota = await Rota.findOne({
      where: {
        organisationId: parseInt(organisationId),
        isDeleted: false,
        [Op.or]: [
          { startDate: { [Op.between]: [startDate, endDate] } },
          { endDate: { [Op.between]: [startDate, endDate] } },
          {
            [Op.and]: [
              { startDate: { [Op.lte]: startDate } },
              { endDate: { [Op.gte]: endDate } }
            ]
          }
        ]
      }
    });

    if (conflictRota) {
      return error(409, "A rota already exists for this organisation in the given date range");
    }

    const rota = await Rota.create({
      organisationId: parseInt(organisationId),
      name: name.trim(),
      startDate,
      endDate,
      duration: duration || null,
      notes: notes || null
    });

    return success({
      message: "Rota created successfully",
      rota
    });

  } catch (err) {
    console.error('Create rota error:', err);
    return error(500, err.message || "Failed to create rota");
  }
};

/**
 * Update a rota
 * PUT /api/admin/updateRota
 */
export const updateRota = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const body = await readBody(event);
    const { id, organisationId, name, startDate, endDate, duration, notes } = body;

    if (!id) {
      return error(400, "id is required");
    }

    if (!organisationId) {
      return error(400, "organisationId is required");
    }

    const rota = await Rota.findOne({
      where: {
        id: parseInt(id),
        organisationId: parseInt(organisationId),
        isDeleted: false
      }
    });

    if (!rota) {
      return error(404, "Rota not found");
    }

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return error(400, "End date cannot be before start date");
    }

    // Build update object
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (startDate !== undefined) updateData.startDate = startDate;
    if (endDate !== undefined) updateData.endDate = endDate;
    if (duration !== undefined) updateData.duration = duration;
    if (notes !== undefined) updateData.notes = notes;

    await rota.update(updateData);

    return success({
      message: "Rota updated successfully",
      rota
    });

  } catch (err) {
    console.error('Update rota error:', err);
    return error(500, err.message || "Failed to update rota");
  }
};

/**
 * Delete (soft delete) a rota
 * DELETE /api/admin/deleteRota
 */
export const deleteRota = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const body = await readBody(event);
    const { id, organisationId } = body;

    if (!id) {
      return error(400, "id is required");
    }

    if (!organisationId) {
      return error(400, "organisationId is required");
    }

    const rota = await Rota.findOne({
      where: {
        id: parseInt(id),
        organisationId: parseInt(organisationId),
        isDeleted: false
      }
    });

    if (!rota) {
      return error(404, "Rota not found");
    }

    // Soft delete the rota
    await rota.update({ isDeleted: true });

    // Also soft delete all shifts associated with the rota
    await RotaShift.update(
      { isDeleted: true },
      { where: { rotaId: parseInt(id) } }
    );

    return success({
      message: "Rota deleted successfully",
      deletedId: parseInt(id)
    });

  } catch (err) {
    console.error('Delete rota error:', err);
    return error(500, err.message || "Failed to delete rota");
  }
};

/**
 * Publish a rota (make it visible to staff)
 * POST /api/admin/publishRota
 */
export const publishRota = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const body = await readBody(event);
    const { id, organisationId } = body;

    if (!id) {
      return error(400, "id is required");
    }

    if (!organisationId) {
      return error(400, "organisationId is required");
    }

    const rota = await Rota.findOne({
      where: {
        id: parseInt(id),
        organisationId: parseInt(organisationId),
        isDeleted: false
      }
    });

    if (!rota) {
      return error(404, "Rota not found");
    }

    await rota.update({
      isPublished: true,
      publishedDate: new Date()
    });

    return success({
      message: "Rota published successfully",
      rota
    });

  } catch (err) {
    console.error('Publish rota error:', err);
    return error(500, err.message || "Failed to publish rota");
  }
};

/**
 * Unpublish a rota
 * POST /api/admin/unpublishRota
 */
export const unpublishRota = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const body = await readBody(event);
    const { id, organisationId } = body;

    if (!id) {
      return error(400, "id is required");
    }

    if (!organisationId) {
      return error(400, "organisationId is required");
    }

    const rota = await Rota.findOne({
      where: {
        id: parseInt(id),
        organisationId: parseInt(organisationId),
        isDeleted: false
      }
    });

    if (!rota) {
      return error(404, "Rota not found");
    }

    await rota.update({
      isPublished: false
    });

    return success({
      message: "Rota unpublished successfully",
      rota
    });

  } catch (err) {
    console.error('Unpublish rota error:', err);
    return error(500, err.message || "Failed to unpublish rota");
  }
};

// ============================================
// Document Management (Admin View)
// ============================================

/**
 * List all folders in an organisation (flat list)
 * GET /api/admin/listOrgDocumentFolders?organisationId=1
 */
export const listOrgDocumentFolders = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const query = getQuery(event);
    const { organisationId, limit = 100, offset = 0 } = query;

    if (!organisationId) {
      return error(400, "organisationId is required");
    }

    const folders = await UserDocumentFolder.findAll({
      where: {
        organisationId: parseInt(organisationId)
      },
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const folderIds = folders.map(f => f.id);
    const documentCounts = folderIds.length > 0
      ? await UserDocument.findAll({
          where: { folderId: { [Op.in]: folderIds } },
          attributes: ["folderId", [fn("COUNT", col("id")), "count"]],
          group: ["folderId"]
        })
      : [];

    const countMap = {};
    documentCounts.forEach(dc => {
      countMap[dc.folderId] = parseInt(dc.get("count")) || 0;
    });

    const foldersWithCounts = folders.map(f => ({
      ...f.toJSON(),
      documentCount: countMap[f.id] || 0
    }));

    const total = await UserDocumentFolder.count({
      where: {
        organisationId: parseInt(organisationId)
      }
    });

    return success({
      organisationId: parseInt(organisationId),
      folders: foldersWithCounts,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (err) {
    console.error('List org document folders error:', err);
    return error(500, err.message || "Failed to list document folders");
  }
};

/**
 * Get folder by ID with documents
 * GET /api/admin/getOrgDocumentFolderById?id=1&organisationId=1
 */
export const getOrgDocumentFolderById = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const query = getQuery(event);
    const { id, organisationId } = query;

    if (!id) {
      return error(400, "id is required");
    }

    if (!organisationId) {
      return error(400, "organisationId is required");
    }

    const folder = await UserDocumentFolder.findOne({
      where: {
        id: parseInt(id),
        organisationId: parseInt(organisationId)
      },
      include: [
        {
          model: UserDocument,
          as: "documents",
          required: false
        },
        {
          model: UserDocumentFolder,
          as: "parent",
          attributes: ["id", "name", "color", "parentId"],
          required: false
        },
        {
          model: UserDocumentFolder,
          as: "subfolders",
          attributes: ["id", "name", "color", "parentId"],
          required: false
        }
      ]
    });

    if (!folder) {
      return error(404, "Folder not found");
    }

    return success({ folder });

  } catch (err) {
    console.error('Get org document folder by ID error:', err);
    return error(500, err.message || "Failed to get folder");
  }
};

/**
 * List all documents in an organisation (optionally by folder or user)
 * GET /api/admin/listOrgDocuments?organisationId=1&folderId=1&userId=1
 */
export const listOrgDocuments = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const query = getQuery(event);
    const { organisationId, folderId, userId, search, limit = 100, offset = 0 } = query;

    if (!organisationId) {
      return error(400, "organisationId is required");
    }

    const whereClause = {
      organisationId: parseInt(organisationId)
    };

    if (folderId) {
      whereClause.folderId = parseInt(folderId);
    }

    if (userId) {
      whereClause.userId = parseInt(userId);
    }

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { tags: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const documents = await UserDocument.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: UserDocumentFolder,
          as: "folder",
          attributes: ["id", "name", "color"],
          required: false
        }
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return success({
      organisationId: parseInt(organisationId),
      documents: documents.rows,
      total: documents.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (err) {
    console.error('List org documents error:', err);
    return error(500, err.message || "Failed to list documents");
  }
};

/**
 * Get document by ID
 * GET /api/admin/getOrgDocumentById?id=1&organisationId=1
 */
export const getOrgDocumentById = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const query = getQuery(event);
    const { id, organisationId } = query;

    if (!id) {
      return error(400, "id is required");
    }

    if (!organisationId) {
      return error(400, "organisationId is required");
    }

    const document = await UserDocument.findOne({
      where: {
        id: parseInt(id),
        organisationId: parseInt(organisationId)
      },
      include: [
        {
          model: UserDocumentFolder,
          as: "folder",
          attributes: ["id", "name", "color"],
          required: false
        }
      ]
    });

    if (!document) {
      return error(404, "Document not found");
    }

    return success({ document });

  } catch (err) {
    console.error('Get org document by ID error:', err);
    return error(500, err.message || "Failed to get document");
  }
};

// ============================================
// HR Document Management (Recruitment/Onboarding)
// ============================================

/**
 * List all HR document templates
 * GET /api/admin/listHrDocuments?type=Recruitment
 */
export const listHrDocuments = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const { HrDocument } = await import('../models/hrDocuments');
    const query = getQuery(event);
    const { type, limit = 100, offset = 0 } = query;

    const whereClause = {};
    if (type) {
      whereClause.type = type;
    }

    const documents = await HrDocument.findAndCountAll({
      where: whereClause,
      order: [['type', 'ASC'], ['name', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return success({
      documents: documents.rows,
      total: documents.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (err) {
    console.error('List HR documents error:', err);
    return error(500, err.message || "Failed to list HR documents");
  }
};

/**
 * Get HR document template by ID
 * GET /api/admin/getHrDocumentById?id=1
 */
export const getHrDocumentById = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const { HrDocument } = await import('../models/hrDocuments');
    const query = getQuery(event);
    const { id } = query;

    if (!id) {
      return error(400, "id is required");
    }

    const document = await HrDocument.findByPk(parseInt(id));

    if (!document) {
      return error(404, "HR document not found");
    }

    return success({ document });

  } catch (err) {
    console.error('Get HR document by ID error:', err);
    return error(500, err.message || "Failed to get HR document");
  }
};

/**
 * Create a new HR document template
 * POST /api/admin/createHrDocument
 */
export const createHrDocument = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const { HrDocument } = await import('../models/hrDocuments');
    const body = await readBody(event);
    const { name, type } = body;

    if (!name || !name.trim()) {
      return error(400, "name is required");
    }

    if (!type) {
      return error(400, "type is required (Recruitment, Training, or Flossly)");
    }

    if (!['Recruitment', 'Training', 'Flossly'].includes(type)) {
      return error(400, "type must be one of: Recruitment, Training, Flossly");
    }

    const document = await HrDocument.create({
      name: name.trim(),
      type
    });

    return success({
      message: "HR document created successfully",
      document
    });

  } catch (err) {
    console.error('Create HR document error:', err);
    return error(500, err.message || "Failed to create HR document");
  }
};

/**
 * Update an HR document template
 * PUT /api/admin/updateHrDocument
 */
export const updateHrDocument = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const { HrDocument } = await import('../models/hrDocuments');
    const body = await readBody(event);
    const { id, name, type } = body;

    if (!id) {
      return error(400, "id is required");
    }

    const document = await HrDocument.findByPk(parseInt(id));

    if (!document) {
      return error(404, "HR document not found");
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (type !== undefined) {
      if (!['Recruitment', 'Training', 'Flossly'].includes(type)) {
        return error(400, "type must be one of: Recruitment, Training, Flossly");
      }
      updateData.type = type;
    }

    await document.update(updateData);

    return success({
      message: "HR document updated successfully",
      document
    });

  } catch (err) {
    console.error('Update HR document error:', err);
    return error(500, err.message || "Failed to update HR document");
  }
};

/**
 * Delete an HR document template
 * DELETE /api/admin/deleteHrDocument
 */
export const deleteHrDocument = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const { HrDocument } = await import('../models/hrDocuments');
    const body = await readBody(event);
    const { id } = body;

    if (!id) {
      return error(400, "id is required");
    }

    const document = await HrDocument.findByPk(parseInt(id));

    if (!document) {
      return error(404, "HR document not found");
    }

    await document.destroy();

    return success({
      message: "HR document deleted successfully",
      deletedId: parseInt(id)
    });

  } catch (err) {
    console.error('Delete HR document error:', err);
    return error(500, err.message || "Failed to delete HR document");
  }
};

/**
 * Get user's HR document completion status
 * GET /api/admin/getUserHrDocumentStatus?userId=1
 */
export const getUserHrDocumentStatus = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const { UserHrDocument } = await import('../models/auth/userHrDocuments');
    const { HrDocument } = await import('../models/hrDocuments');
    const query = getQuery(event);
    const { userId } = query;

    if (!userId) {
      return error(400, "userId is required");
    }

    const userDocs = await UserHrDocument.findAll({
      where: { userId: parseInt(userId) },
      order: [['type', 'ASC'], ['name', 'ASC']]
    });

    const completedCount = userDocs.filter(d => d.status === 'Completed').length;
    const pendingCount = userDocs.filter(d => d.status === 'Pending').length;

    return success({
      userId: parseInt(userId),
      documents: userDocs,
      summary: {
        total: userDocs.length,
        completed: completedCount,
        pending: pendingCount,
        completionRate: userDocs.length > 0 ? ((completedCount / userDocs.length) * 100).toFixed(1) + '%' : '0%'
      }
    });

  } catch (err) {
    console.error('Get user HR document status error:', err);
    return error(500, err.message || "Failed to get user HR document status");
  }
};

/**
 * List all users' HR document status for an organisation
 * GET /api/admin/listOrgUsersHrDocumentStatus?organisationId=1&type=Recruitment
 */
export const listOrgUsersHrDocumentStatus = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const { UserHrDocument } = await import('../models/auth/userHrDocuments');
    const query = getQuery(event);
    const { organisationId, type, limit = 100, offset = 0 } = query;

    if (!organisationId) {
      return error(400, "organisationId is required");
    }

    const userIdsQuery = await UserOrganisation.findAll({
      where: { organisationId: parseInt(organisationId) },
      attributes: ['userId']
    });
    
    const userIds = userIdsQuery.map(uo => uo.userId);
    
    if (userIds.length === 0) {
      return success({
        organisationId: parseInt(organisationId),
        type: type || 'all',
        users: [],
        totalUsers: 0,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    }

    const whereClause = {
      userId: { [Op.in]: userIds }
    };

    if (type) {
      whereClause.type = type;
    }

    const userDocs = await UserHrDocument.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email']
        }
      ],
      order: [['userId', 'ASC'], ['type', 'ASC'], ['name', 'ASC']]
    });

    const userStats = {};
    userDocs.forEach(doc => {
      const uid = doc.userId;
      if (!userStats[uid]) {
        userStats[uid] = {
          userId: uid,
          userName: doc.user?.fullName,
          userEmail: doc.user?.email,
          total: 0,
          completed: 0,
          pending: 0
        };
      }
      userStats[uid].total++;
      if (doc.status === 'Completed') userStats[uid].completed++;
      else userStats[uid].pending++;
    });

    const resultUsers = Object.values(userStats).map(stat => ({
      ...stat,
      completionRate: stat.total > 0 ? ((stat.completed / stat.total) * 100).toFixed(1) + '%' : '0%'
    }));

    const paginatedUsers = resultUsers.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    return success({
      organisationId: parseInt(organisationId),
      type: type || 'all',
      users: paginatedUsers,
      totalUsers: resultUsers.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (err) {
    console.error('List org users HR document status error:', err);
    return error(500, err.message || "Failed to list users HR document status");
  }
};

/**
 * Update (mark complete/incomplete) a user's HR document
 * PUT /api/admin/updateUserHrDocument
 */
export const updateUserHrDocument = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const { UserHrDocument } = await import('../models/auth/userHrDocuments');
    const body = await readBody(event);
    const { id, status, link } = body;

    if (!id) {
      return error(400, "id is required");
    }

    if (!status) {
      return error(400, "status is required (Completed or Pending)");
    }

    if (!['Completed', 'Pending'].includes(status)) {
      return error(400, "status must be either Completed or Pending");
    }

    const userDoc = await UserHrDocument.findByPk(parseInt(id));

    if (!userDoc) {
      return error(404, "User HR document not found");
    }

    const updateData = { status };
    if (link !== undefined) updateData.link = link;
    if (status === 'Completed') updateData.uploadedDate = new Date();

    await userDoc.update(updateData);

    return success({
      message: "User HR document updated successfully",
      userHrDocument: userDoc
    });

  } catch (err) {
    console.error('Update user HR document error:', err);
    return error(500, err.message || "Failed to update user HR document");
  }
};

// ============================================
// Rota Shift Management
// ============================================

/**
 * List shifts for a rota
 * GET /api/admin/listRotaShifts?rotaId=1&organisationId=1
 */
export const listRotaShifts = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const query = getQuery(event);
  const { rotaId, organisationId, limit = 500, offset = 0 } = query;

  if (!rotaId) {
    return error(400, "rotaId is required");
  }

  if (!organisationId) {
    return error(400, "organisationId is required");
  }

  try {
    // Verify rota exists and belongs to organisation
    const rota = await Rota.findOne({
      where: {
        id: parseInt(rotaId),
        organisationId: parseInt(organisationId),
        isDeleted: false
      },
      attributes: ['id', 'name', 'organisationId']
    });

    if (!rota) {
      return error(404, "Rota not found");
    }

    const shifts = await RotaShift.findAndCountAll({
      where: {
        rotaId: parseInt(rotaId),
        isDeleted: false
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "fullName", "email"]
        },
        {
          model: RotaUser,
          as: "rotaUser",
          attributes: ["id"],
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "fullName", "email"]
            }
          ]
        }
      ],
      order: [['startDate', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return success({
      rotaId: rota.id,
      rotaName: rota.name,
      shifts: shifts.rows,
      total: shifts.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (err) {
    console.error('List rota shifts error:', err);
    return error(500, err.message || "Failed to list rota shifts");
  }
};

/**
 * Get shift by ID
 * GET /api/admin/getRotaShiftById?id=1&organisationId=1
 */
export const getRotaShiftById = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const query = getQuery(event);
  const { id, organisationId } = query;

  if (!id) {
    return error(400, "id is required");
  }

  if (!organisationId) {
    return error(400, "organisationId is required");
  }

  try {
    const shift = await RotaShift.findOne({
      where: {
        id: parseInt(id),
        isDeleted: false
      },
      include: [
        {
          model: Rota,
          as: 'rota',
          where: { organisationId: parseInt(organisationId) },
          attributes: ['id', 'name', 'organisationId'],
          required: true
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "fullName", "email"]
        },
        {
          model: RotaUser,
          as: "rotaUser",
          attributes: ["id"],
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "fullName", "email"]
            }
          ]
        }
      ]
    });

    if (!shift) {
      return error(404, "Shift not found");
    }

    return success({ shift });

  } catch (err) {
    console.error('Get rota shift by ID error:', err);
    return error(500, err.message || "Failed to get shift");
  }
};

/**
 * Create a new shift for a rota
 * POST /api/admin/createRotaShift
 */
export const createRotaShift = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const body = await readBody(event);
    const {
      rotaId,
      organisationId,
      dentistId,
      nurseId,
      userId,
      surgeryId,
      label,
      color,
      startDate,
      endDate,
      breakTime,
      isLocumShift,
      locumUserId,
      notes
    } = body;

    if (!rotaId) {
      return error(400, "rotaId is required");
    }

    if (!organisationId) {
      return error(400, "organisationId is required");
    }

    if (!label || !startDate || !endDate) {
      return error(400, "label, startDate, and endDate are required");
    }

    // Verify rota exists and belongs to organisation
    const rota = await Rota.findOne({
      where: {
        id: parseInt(rotaId),
        organisationId: parseInt(organisationId),
        isDeleted: false
      }
    });

    if (!rota) {
      return error(404, "Rota not found");
    }

    const hasUser = userId || locumUserId || dentistId || nurseId;
    const hasSurgery = surgeryId;
    
    if (!hasUser && !hasSurgery) {
      return error(400, "Dentist, nurse, user, or surgery is required");
    }

    const shift = await RotaShift.create({
      rotaId: parseInt(rotaId),
      dentistId: dentistId || null,
      nurseId: nurseId || null,
      userId: userId || null,
      surgeryId: surgeryId || null,
      label: label.trim(),
      color: color || null,
      startDate,
      endDate,
      breakTime: breakTime || null,
      isLocumShift: isLocumShift || false,
      locumUserId: locumUserId || null,
      notes: notes || null
    });

    return success({
      message: "Shift created successfully",
      shift
    });

  } catch (err) {
    console.error('Create rota shift error:', err);
    return error(500, err.message || "Failed to create shift");
  }
};

/**
 * Update a shift
 * PUT /api/admin/updateRotaShift
 */
export const updateRotaShift = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const body = await readBody(event);
    const {
      id,
      organisationId,
      dentistId,
      nurseId,
      userId,
      surgeryId,
      label,
      color,
      startDate,
      endDate,
      breakTime,
      isLocumShift,
      locumUserId,
      notes,
      forceCreate
    } = body;

    if (!id) {
      return error(400, "id is required");
    }

    if (!organisationId) {
      return error(400, "organisationId is required");
    }

    const shift = await RotaShift.findOne({
      where: {
        id: parseInt(id),
        isDeleted: false
      },
      include: [{
        model: Rota,
        as: 'rota',
        where: { organisationId: parseInt(organisationId) },
        attributes: ['id', 'organisationId'],
        required: true
      }]
    });

    if (!shift) {
      return error(404, "Shift not found");
    }

    // Build update object
    const updateData = {};
    if (label !== undefined) updateData.label = label.trim();
    if (color !== undefined) updateData.color = color;
    if (startDate !== undefined) updateData.startDate = startDate;
    if (endDate !== undefined) updateData.endDate = endDate;
    if (breakTime !== undefined) updateData.breakTime = breakTime;
    if (notes !== undefined) updateData.notes = notes;
    if (dentistId !== undefined) updateData.dentistId = dentistId;
    if (nurseId !== undefined) updateData.nurseId = nurseId;
    if (userId !== undefined) updateData.userId = userId;
    if (surgeryId !== undefined) updateData.surgeryId = surgeryId;
    if (isLocumShift !== undefined) updateData.isLocumShift = isLocumShift;
    if (locumUserId !== undefined) updateData.locumUserId = locumUserId;

    await shift.update(updateData);

    return success({
      message: "Shift updated successfully",
      shift
    });

  } catch (err) {
    console.error('Update rota shift error:', err);
    return error(500, err.message || "Failed to update shift");
  }
};

/**
 * Delete (soft delete) a shift
 * DELETE /api/admin/deleteRotaShift
 */
export const deleteRotaShift = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const body = await readBody(event);
    const { id, organisationId } = body;

    if (!id) {
      return error(400, "id is required");
    }

    if (!organisationId) {
      return error(400, "organisationId is required");
    }

    const shift = await RotaShift.findOne({
      where: {
        id: parseInt(id),
        isDeleted: false
      },
      include: [{
        model: Rota,
        as: 'rota',
        where: { organisationId: parseInt(organisationId) },
        attributes: ['id', 'organisationId'],
        required: true
      }]
    });

    if (!shift) {
      return error(404, "Shift not found");
    }

    // Soft delete the shift
    await shift.update({ isDeleted: true });

    return success({
      message: "Shift deleted successfully",
      deletedId: parseInt(id)
    });

  } catch (err) {
    console.error('Delete rota shift error:', err);
    return error(500, err.message || "Failed to delete shift");
  }
};

/**
 * Start a shift
 * POST /api/admin/startRotaShift
 */
export const startRotaShift = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const body = await readBody(event);
    const { id, organisationId } = body;

    if (!id) {
      return error(400, "id is required");
    }

    if (!organisationId) {
      return error(400, "organisationId is required");
    }

    const shift = await RotaShift.findOne({
      where: {
        id: parseInt(id),
        isDeleted: false
      },
      include: [{
        model: Rota,
        as: 'rota',
        where: { organisationId: parseInt(organisationId) },
        attributes: ['id', 'organisationId'],
        required: true
      }]
    });

    if (!shift) {
      return error(404, "Shift not found");
    }

    if (shift.startedAt) {
      return error(400, "Shift has already started");
    }

    await shift.update({ startedAt: new Date() });

    return success({
      message: "Shift started successfully",
      shift
    });

  } catch (err) {
    console.error('Start rota shift error:', err);
    return error(500, err.message || "Failed to start shift");
  }
};

/**
 * Complete a shift
 * POST /api/admin/completeRotaShift
 */
export const completeRotaShift = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const body = await readBody(event);
    const { id, organisationId } = body;

    if (!id) {
      return error(400, "id is required");
    }

    if (!organisationId) {
      return error(400, "organisationId is required");
    }

    const shift = await RotaShift.findOne({
      where: {
        id: parseInt(id),
        isDeleted: false
      },
      include: [{
        model: Rota,
        as: 'rota',
        where: { organisationId: parseInt(organisationId) },
        attributes: ['id', 'organisationId'],
        required: true
      }]
    });

    if (!shift) {
      return error(404, "Shift not found");
    }

    if (!shift.startedAt) {
      return error(400, "Shift has not started yet");
    }

    if (shift.completedAt) {
      return error(400, "Shift has already been completed");
    }

    await shift.update({ completedAt: new Date() });

    return success({
      message: "Shift completed successfully",
      shift
    });

  } catch (err) {
    console.error('Complete rota shift error:', err);
    return error(500, err.message || "Failed to complete shift");
  }
};

// ============================================
// Leave Management (Admin Approvals)
// ============================================

/**
 * List leave requests for an organisation
 * GET /api/admin/listLeaveRequests?organisationId=1&status=Pending&userId=1&limit=100&offset=0
 */
export const listLeaveRequests = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  const query = getQuery(event);
  const { organisationId, status, userId, limit = 100, offset = 0 } = query;

  if (!organisationId) {
    return error(400, "organisationId is required");
  }

  try {
    const whereClause = {
      organisationId: parseInt(organisationId)
    };

    if (status && ['Pending', 'Approved', 'Rejected', 'Cancelled'].includes(status)) {
      whereClause.status = status;
    }

    if (userId) {
      whereClause.userId = parseInt(userId);
    }

    const leaves = await UserLeaveHistory.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "fullName", "email", "photo"]
        }
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return success({
      organisationId: parseInt(organisationId),
      leaves: leaves.rows,
      total: leaves.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (err) {
    console.error('List leave requests error:', err);
    return error(500, err.message || "Failed to list leave requests");
  }
};

/**
 * Approve a leave request
 * POST /api/admin/approveLeave
 */
export const approveLeave = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const body = await readBody(event);
    const { id, organisationId } = body;

    if (!id) {
      return error(400, "id is required");
    }

    if (!organisationId) {
      return error(400, "organisationId is required");
    }

    const leave = await UserLeaveHistory.findOne({
      where: {
        id: parseInt(id),
        organisationId: parseInt(organisationId),
        status: 'Pending'
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "fullName", "email"]
        }
      ]
    });

    if (!leave) {
      return error(404, "Pending leave request not found");
    }

    await leave.update({
      status: 'Approved',
      approvedBy: admin.userId
    });

    return success({
      message: "Leave approved successfully",
      leave
    });

  } catch (err) {
    console.error('Approve leave error:', err);
    return error(500, err.message || "Failed to approve leave");
  }
};

/**
 * Reject a leave request
 * POST /api/admin/rejectLeave
 */
export const rejectLeave = async (event) => {
  const admin = event.context.admin;
  
  if (!admin) {
    return error(403, "Admin access required");
  }

  try {
    const body = await readBody(event);
    const { id, organisationId } = body;

    if (!id) {
      return error(400, "id is required");
    }

    if (!organisationId) {
      return error(400, "organisationId is required");
    }

    const leave = await UserLeaveHistory.findOne({
      where: {
        id: parseInt(id),
        organisationId: parseInt(organisationId),
        status: 'Pending'
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "fullName", "email"]
        }
      ]
    });

    if (!leave) {
      return error(404, "Pending leave request not found");
    }

    await leave.update({
      status: 'Rejected',
      approvedBy: admin.userId
    });

    return success({
      message: "Leave rejected successfully",
      leave
    });

  } catch (err) {
    console.error('Reject leave error:', err);
    return error(500, err.message || "Failed to reject leave");
  }
};

/**
 * Bulk upload checklists for org-specific task pool tasks
 * POST /api/admin/tasks/org/:orgId/checklists/bulk-upload
 * CSV columns: taskId, taskTitle, question, category, fieldOneTitle, fieldOneValue,
 *              fieldTwoTitle, fieldTwoValue, showRadio, showDate, showTime
 */
export const adminBulkUploadChecklistsForOrg = async (event) => {
  const admin = event.context.admin;

  if (!admin) {
    return error(403, "Admin access required");
  }

  const orgIdRaw = getRouterParam(event, "orgId");
  const organisationId = parseInt(orgIdRaw, 10);
  if (!orgIdRaw || Number.isNaN(organisationId)) {
    return error(400, "Invalid organisation id");
  }

  try {
    const { TaskChecklist, Task, TaskCategory, Organisation } = await import(
      "../models/index.js"
    );

    const organisation = await Organisation.findByPk(organisationId, {
      attributes: ["id", "name"],
    });
    if (!organisation) {
      return error(404, "Organisation not found");
    }

    const orgCategories = await TaskCategory.findAll({
      where: { isDeleted: false, organisationId },
      attributes: ["id"],
    });
    const orgCategoryIds = new Set(orgCategories.map((c) => c.id));

    const formidable = (await import("formidable")).default;
    const fs = await import("fs");
    const { parse } = await import("csv-parse");

    const form = formidable({ multiples: false });
    const [_, files] = await new Promise((resolve, reject) => {
      form.parse(event.node.req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const file = files.file?.[0];
    if (!file) {
      return error(400, "No CSV file provided");
    }

    const records = await new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(file.filepath)
        .pipe(parse({ columns: true, trim: true }))
        .on("data", (data) => results.push(data))
        .on("end", () => resolve(results))
        .on("error", (err) => reject(err));
    });

    if (!records || records.length === 0) {
      return error(400, "CSV file is empty or invalid");
    }

    const rowErrors = [];
    const checklistsToInsert = [];
    const taskCache = new Map();

    const resolveTask = async (rawId, rawTitle, rowNum) => {
      if (rawId) {
        const taskId = Number(rawId);
        if (Number.isNaN(taskId)) {
          rowErrors.push(`Row ${rowNum}: Invalid taskId — must be a number`);
          return null;
        }
        if (taskCache.has(taskId)) return taskCache.get(taskId);

        const task = await Task.findOne({
          where: { id: taskId, isSystemTask: false },
          attributes: ["id", "title", "categoryId"],
        });

        if (!task) {
          rowErrors.push(`Row ${rowNum}: Task with id ${taskId} not found or is not an org task`);
          return null;
        }
        if (!orgCategoryIds.has(task.categoryId)) {
          rowErrors.push(`Row ${rowNum}: Task ${taskId} does not belong to organisation ${organisationId}`);
          return null;
        }
        taskCache.set(taskId, task);
        return task;
      }

      if (rawTitle) {
        const key = rawTitle.toLowerCase();
        if (taskCache.has(key)) return taskCache.get(key);

        const task = await Task.findOne({
          where: { title: { [Op.iLike]: rawTitle }, isSystemTask: false },
          attributes: ["id", "title", "categoryId"],
        });

        if (!task) {
          rowErrors.push(`Row ${rowNum}: No org task found with title "${rawTitle}"`);
          return null;
        }
        if (!orgCategoryIds.has(task.categoryId)) {
          rowErrors.push(`Row ${rowNum}: Task "${rawTitle}" does not belong to organisation ${organisationId}`);
          return null;
        }
        taskCache.set(key, task);
        return task;
      }

      rowErrors.push(`Row ${rowNum}: taskId or taskTitle is required`);
      return null;
    };

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowNum = i + 2;

      if (!record.question || !record.question.trim()) {
        rowErrors.push(`Row ${rowNum}: question is required`);
        continue;
      }

      const task = await resolveTask(
        record.taskId ? String(record.taskId).trim() : "",
        record.taskTitle ? String(record.taskTitle).trim() : "",
        rowNum
      );
      if (!task) continue;

      const parseBool = (val, defaultVal = false) => {
        if (val === undefined || val === null || val === "") return defaultVal;
        return String(val).toUpperCase() !== "FALSE";
      };

      checklistsToInsert.push({
        taskId: task.id,
        question: record.question.trim(),
        category: record.category ? record.category.trim() : null,
        fieldOneTitle: record.fieldOneTitle ? record.fieldOneTitle.trim() : null,
        fieldOneValue: record.fieldOneValue ? record.fieldOneValue.trim() : null,
        fieldTwoTitle: record.fieldTwoTitle ? record.fieldTwoTitle.trim() : null,
        fieldTwoValue: record.fieldTwoValue ? record.fieldTwoValue.trim() : null,
        showRadio: parseBool(record.showRadio, false),
        showDate: parseBool(record.showDate, false),
        showTime: parseBool(record.showTime, false),
        radioValue: "N/A",
        timeValue: null,
        dateValue: null,
      });
    }

    if (rowErrors.length > 0 && checklistsToInsert.length === 0) {
      return error(400, `Validation errors: ${rowErrors.join(", ")}`);
    }

    let createdChecklists = [];
    if (checklistsToInsert.length > 0) {
      createdChecklists = await TaskChecklist.bulkCreate(checklistsToInsert);
    }

    return success({
      message: `Successfully uploaded ${createdChecklists.length} checklist item(s) for organisation ${organisationId}`,
      organisationId,
      organisationName: organisation.name,
      created: createdChecklists.length,
      errors: rowErrors.length > 0 ? rowErrors : undefined,
      checklists: createdChecklists.map((c) => ({
        id: c.id,
        taskId: c.taskId,
        question: c.question,
        showRadio: c.showRadio,
        showDate: c.showDate,
        showTime: c.showTime,
      })),
    });
  } catch (err) {
    console.error("Admin bulk upload org checklists error:", err);
    return error(500, err.message || "Failed to upload organisation checklists");
  }
};
