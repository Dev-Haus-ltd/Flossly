import { error } from '../../utils/response';
import { User, UserOrganisation, Organisation, CrmOption } from '../../models';
import { Op } from 'sequelize';
import { getRouterParam, getQuery, readBody } from 'h3';
import sequelize from '../../utils/db';
import { extname } from 'node:path';
import * as XLSX from 'xlsx';
import { parseJsonBody } from '../../utils/body';
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

export const parseAdminAutomationUploadFile = (filePart) => {
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

export const parseAdminLeadUploadFile = async ({ filePart, organisationId }) => {
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

export const requireAdmin = (event) => {
  const admin = event.context.admin;
  if (!admin) error(403, 'Admin access required');
  return admin;
};

export const parseRequestPayload = async (event) => {
  const body = await readBody(event);
  return typeof body === 'string' ? parseJsonBody(body) : body;
};

export const readOrganisationId = async (event) => {
  const paramOrg = getRouterParam(event, 'orgId') ?? getRouterParam(event, 'organisationId');
  const organisationId = Number(paramOrg);
  if (!organisationId) error(400, 'Organisation id is required in the URL path');
  const organisation = await Organisation.findByPk(organisationId, { attributes: ['id', 'automationPlaceholders'] });
  if (!organisation) error(404, 'Organisation not found');
  return organisation;
};

export const validateCrmOptionCategory = (category) => {
  if (!CRM_OPTION_CATEGORY_LABELS[category]) error(400, 'Unsupported CRM option category');
  return category;
};

export const normalizeCrmOptionName = (value) => String(value || '').trim();

export const listAdminCrmOptionsByCategory = async (organisationId, category) => {
  return await CrmOption.findAll({
    where: { organisationId: Number(organisationId), category },
    order: [['ordering', 'ASC'], ['name', 'ASC'], ['id', 'ASC']],
  });
};

export const getAdminCrmOptionById = async ({ organisationId, category, id }) => {
  const row = await CrmOption.findOne({
    where: { id: Number(id), organisationId: Number(organisationId), category },
  });
  if (!row) error(404, `${CRM_OPTION_CATEGORY_LABELS[category]} not found`);
  return row;
};

export const ensureUniqueAdminCrmOptionName = async ({ organisationId, category, name, excludeId = null }) => {
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

export const sanitizeAlertOptionInput = (payload = {}, existingKey = null) => {
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

export const sanitizeDictionaryScriptPayload = (payload = {}, existingKey = null) => {
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

export const getOrganisationAlertOptions = (organisation) => {
  const stored = organisation?.automationPlaceholders?.alertOptions;
  return Array.isArray(stored) && stored.length ? [...stored] : [...DEFAULT_ADMIN_ALERT_OPTIONS];
};

export const saveOrganisationAlertOptions = async (organisation, options) => {
  organisation.automationPlaceholders = {
    ...(organisation.automationPlaceholders || {}),
    alertOptions: options,
  };
  await organisation.save();
  return options;
};

export const getOrganisationCrmFeatureAccess = (organisation) => {
  const stored = organisation?.automationPlaceholders?.crmFeatureAccess;
  return {
    ...DEFAULT_CRM_FEATURE_ACCESS,
    ...(stored && typeof stored === 'object' ? stored : {}),
  };
};

export const sanitizeCrmFeatureAccessInput = (payload = {}) => ({
  meta: payload.meta !== undefined ? Boolean(payload.meta) : undefined,
  whatsapp: payload.whatsapp !== undefined ? Boolean(payload.whatsapp) : undefined,
  chatbot: payload.chatbot !== undefined ? Boolean(payload.chatbot) : undefined,
});

export const saveOrganisationCrmFeatureAccess = async (organisation, updates = {}) => {
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