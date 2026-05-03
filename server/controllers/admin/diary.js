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
import { requireAdmin, parseRequestPayload } from './shared.js';

export const listClinicalNoteTemplatesAdmin = async (event) => {
  requireAdmin(event);
  try {
    const query = getQuery(event) || {};
    const where = { scope: 'system' };
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    const items = await ClinicalNoteTemplate.findAll({
      where,
      include: [{ model: ClinicalNoteTemplateVersion, as: 'currentVersion' }],
      order: [['type', 'ASC'], ['sortOrder', 'ASC'], ['title', 'ASC']],
    });
    return success(items.map(serializeClinicalTemplate));
  } catch (err) {
    console.error('List clinical note templates admin error:', err);
    return error(err?.statusCode || 500, err.message || 'Failed to list clinical note templates');
  }
};


export const createClinicalNoteTemplateAdmin = async (event) => {
  requireAdmin(event);
  try {
    const payload = await parseRequestPayload(event);
    const next = sanitizeClinicalNoteTemplatePayload(payload, { defaultScope: 'system' });
    const created = await createClinicalTemplateWithVersion({
      scope: 'system',
      type: next.type,
      category: next.category,
      key: next.key,
      title: next.title,
      content: next.content,
      status: next.status,
      sortOrder: next.sortOrder,
      isDefault: next.isDefault === true,
      actorUserId: event.context.admin?.id || null,
      changeNote: next.changeNote,
    });
    return success(serializeClinicalTemplate(created));
  } catch (err) {
    console.error('Create clinical note template admin error:', err);
    return error(err?.statusCode || 500, err.message || 'Failed to create clinical note template');
  }
};


export const updateClinicalNoteTemplateAdmin = async (event) => {
  requireAdmin(event);
  try {
    const payload = await parseRequestPayload(event);
    const id = Number(getRouterParam(event, 'id'));
    if (!id) return error(400, 'id is required');
    const template = await ClinicalNoteTemplate.findOne({
      where: { id, scope: 'system' },
      include: [{ model: ClinicalNoteTemplateVersion, as: 'currentVersion' }],
    });
    if (!template) return error(404, 'Template not found');
    const next = sanitizeClinicalNoteTemplatePayload(payload, { existing: template, defaultScope: 'system' });
    const updated = await updateClinicalTemplateWithVersion({
      template,
      title: next.title,
      key: next.key,
      category: next.category,
      content: next.content,
      status: next.status,
      sortOrder: next.sortOrder,
      isDefault: next.isDefault,
      actorUserId: event.context.admin?.id || null,
      changeNote: next.changeNote,
    });
    return success(serializeClinicalTemplate(updated));
  } catch (err) {
    console.error('Update clinical note template admin error:', err);
    return error(err?.statusCode || 500, err.message || 'Failed to update clinical note template');
  }
};


export const getClinicalNoteTemplateVersionsAdmin = async (event) => {
  requireAdmin(event);
  try {
    const idRaw = getRouterParam(event, 'id');
    if (!idRaw) return error(400, 'id is required');
    const template = await ClinicalNoteTemplate.findOne({
      where: { id: Number(idRaw), scope: 'system' },
    });
    if (!template) return error(404, 'Template not found');
    const items = await ClinicalNoteTemplateVersion.findAll({
      where: { templateId: template.id },
      order: [['versionNumber', 'DESC'], ['id', 'DESC']],
    });
    return success(items.map(serializeClinicalTemplateVersion));
  } catch (err) {
    console.error('Get clinical note template versions admin error:', err);
    return error(err?.statusCode || 500, err.message || 'Failed to get clinical note template versions');
  }
};
