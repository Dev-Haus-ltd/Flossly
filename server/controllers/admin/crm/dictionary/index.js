import { success, error } from '../../../../utils/response';
import { CrmAutomationDictionaryGroup, CrmAutomationDictionaryTemplate } from '../../../../models';
import { Op } from 'sequelize';
import { getRouterParam, getQuery } from 'h3';
import sequelize from '../../../../utils/db';
import { seedCrmAutomationDictionary as runSeedCrmAutomationDictionary } from '../../../../utils/seedCrmAutomationDictionary';
import { requireAdmin, parseRequestPayload } from '../../shared.js';

function normalizeDictionaryGroupPayload(payload = {}, existingKey = null) {
  const key = payload.key != null ? String(payload.key).trim() : (existingKey || '');
  const title = payload.title != null ? String(payload.title).trim() : '';
  const description = payload.description != null && payload.description !== ''
    ? String(payload.description).trim()
    : null;
  const category = payload.category != null && payload.category !== ''
    ? String(payload.category).trim()
    : null;
  const ordering = payload.ordering == null || payload.ordering === '' ? 0 : Number(payload.ordering);
  const status = payload.status != null ? String(payload.status).trim() : 'active';
  return { key, title, description, category, ordering, status };
}

function normalizeDictionaryTemplatePayload(payload = {}, existingKey = null) {
  const key = payload.key != null ? String(payload.key).trim() : (existingKey || '');
  const groupKey = payload.groupKey != null ? String(payload.groupKey).trim() : '';
  const type = payload.type != null ? String(payload.type).trim() : 'Email';
  const name = payload.name != null ? String(payload.name).trim() : '';
  const subject = payload.subject != null && payload.subject !== ''
    ? String(payload.subject).trim()
    : null;
  const template = payload.template != null && payload.template !== ''
    ? String(payload.template)
    : null;
  const trigger = payload.trigger !== undefined ? payload.trigger : null;
  const whatsappTemplateName = payload.whatsappTemplateName != null && payload.whatsappTemplateName !== ''
    ? String(payload.whatsappTemplateName).trim()
    : null;
  const whatsappTemplateLanguage = payload.whatsappTemplateLanguage != null && payload.whatsappTemplateLanguage !== ''
    ? String(payload.whatsappTemplateLanguage).trim()
    : null;
  const ordering = payload.ordering == null || payload.ordering === '' ? 0 : Number(payload.ordering);
  const status = payload.status != null ? String(payload.status).trim() : 'active';
  return {
    key,
    groupKey,
    type,
    name,
    subject,
    template,
    trigger,
    whatsappTemplateName,
    whatsappTemplateLanguage,
    ordering,
    status,
  };
}

export const seedCrmAutomationDictionary = async (event) => {
  requireAdmin(event);
  try {
    const result = await runSeedCrmAutomationDictionary();
    return success(result);
  } catch (err) {
    console.error('Seed CRM automation dictionary error:', err);
    return error(err?.statusCode || 500, err.message || 'Failed to seed CRM automation dictionary');
  }
};

export const listCrmAutomationDictionaryGroups = async (event) => {
  requireAdmin(event);
  try {
    const query = getQuery(event) || {};
    const where = {};
    if (query.status) where.status = query.status;
    if (query.category) where.category = query.category;
    const items = await CrmAutomationDictionaryGroup.findAll({
      where,
      order: [['ordering', 'ASC'], ['title', 'ASC']],
    });
    return success(items);
  } catch (err) {
    console.error('List CRM automation dictionary groups error:', err);
    return error(err?.statusCode || 500, err.message || 'Failed to list groups');
  }
};

export const getCrmAutomationDictionaryGroupById = async (event) => {
  requireAdmin(event);
  try {
    const query = getQuery(event) || {};
    const idRaw = query.id ?? getRouterParam(event, 'id');
    if (idRaw == null || idRaw === '') return error(400, 'id is required');
    const item = await CrmAutomationDictionaryGroup.findByPk(Number(idRaw));
    if (!item) return error(404, 'Group not found');
    return success(item);
  } catch (err) {
    console.error('Get CRM automation dictionary group error:', err);
    return error(err?.statusCode || 500, err.message || 'Failed to get group');
  }
};

export const createCrmAutomationDictionaryGroup = async (event) => {
  requireAdmin(event);
  try {
    const payload = await parseRequestPayload(event);
    const next = normalizeDictionaryGroupPayload(payload);
    if (!next.key) return error(400, 'key is required');
    if (!next.title) return error(400, 'title is required');
    const existing = await CrmAutomationDictionaryGroup.findOne({ where: { key: next.key } });
    if (existing) return error(409, 'Group key already exists');
    const created = await CrmAutomationDictionaryGroup.create(next);
    return success(created);
  } catch (err) {
    console.error('Create CRM automation dictionary group error:', err);
    return error(err?.statusCode || 500, err.message || 'Failed to create group');
  }
};

export const updateCrmAutomationDictionaryGroup = async (event) => {
  requireAdmin(event);
  try {
    const payload = await parseRequestPayload(event);
    const idRaw = payload?.id ?? getRouterParam(event, 'id');
    if (idRaw == null || idRaw === '') return error(400, 'id is required');
    const item = await CrmAutomationDictionaryGroup.findByPk(Number(idRaw));
    if (!item) return error(404, 'Group not found');
    const next = normalizeDictionaryGroupPayload(payload, item.key);
    if (!next.key) return error(400, 'key is required');
    if (!next.title) return error(400, 'title is required');
    if (next.key !== item.key) {
      const duplicate = await CrmAutomationDictionaryGroup.findOne({ where: { key: next.key, id: { [Op.ne]: item.id } } });
      if (duplicate) return error(409, 'Group key already exists');
    }
    Object.assign(item, next);
    await item.save();
    return success(item);
  } catch (err) {
    console.error('Update CRM automation dictionary group error:', err);
    return error(err?.statusCode || 500, err.message || 'Failed to update group');
  }
};

export const deleteCrmAutomationDictionaryGroup = async (event) => {
  requireAdmin(event);
  try {
    const payload = await parseRequestPayload(event);
    const idRaw = payload?.id ?? getRouterParam(event, 'id');
    if (idRaw == null || idRaw === '') return error(400, 'id is required');
    const item = await CrmAutomationDictionaryGroup.findByPk(Number(idRaw));
    if (!item) return error(404, 'Group not found');
    await sequelize.transaction(async (t) => {
      await CrmAutomationDictionaryTemplate.destroy({ where: { groupKey: item.key }, transaction: t });
      await item.destroy({ transaction: t });
    });
    return success({ deletedId: item.id });
  } catch (err) {
    console.error('Delete CRM automation dictionary group error:', err);
    return error(err?.statusCode || 500, err.message || 'Failed to delete group');
  }
};

export const listCrmAutomationDictionaryTemplates = async (event) => {
  requireAdmin(event);
  try {
    const query = getQuery(event) || {};
    const where = {};
    if (query.groupKey) where.groupKey = query.groupKey;
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    const items = await CrmAutomationDictionaryTemplate.findAll({
      where,
      order: [['groupKey', 'ASC'], ['ordering', 'ASC'], ['name', 'ASC']],
    });
    return success(items);
  } catch (err) {
    console.error('List CRM automation dictionary templates error:', err);
    return error(err?.statusCode || 500, err.message || 'Failed to list templates');
  }
};

export const getCrmAutomationDictionaryTemplateById = async (event) => {
  requireAdmin(event);
  try {
    const query = getQuery(event) || {};
    const idRaw = query.id ?? getRouterParam(event, 'id');
    if (idRaw == null || idRaw === '') return error(400, 'id is required');
    const item = await CrmAutomationDictionaryTemplate.findByPk(Number(idRaw));
    if (!item) return error(404, 'Template not found');
    return success(item);
  } catch (err) {
    console.error('Get CRM automation dictionary template error:', err);
    return error(err?.statusCode || 500, err.message || 'Failed to get template');
  }
};

export const createCrmAutomationDictionaryTemplate = async (event) => {
  requireAdmin(event);
  try {
    const payload = await parseRequestPayload(event);
    const next = normalizeDictionaryTemplatePayload(payload);
    if (!next.key) return error(400, 'key is required');
    if (!next.groupKey) return error(400, 'groupKey is required');
    if (!next.name) return error(400, 'name is required');
    const groupExists = await CrmAutomationDictionaryGroup.findOne({ where: { key: next.groupKey } });
    if (!groupExists) return error(404, 'Group not found for groupKey');
    const existing = await CrmAutomationDictionaryTemplate.findOne({ where: { key: next.key } });
    if (existing) return error(409, 'Template key already exists');
    const created = await CrmAutomationDictionaryTemplate.create(next);
    return success(created);
  } catch (err) {
    console.error('Create CRM automation dictionary template error:', err);
    return error(err?.statusCode || 500, err.message || 'Failed to create template');
  }
};

export const updateCrmAutomationDictionaryTemplate = async (event) => {
  requireAdmin(event);
  try {
    const payload = await parseRequestPayload(event);
    const idRaw = payload?.id ?? getRouterParam(event, 'id');
    if (idRaw == null || idRaw === '') return error(400, 'id is required');
    const item = await CrmAutomationDictionaryTemplate.findByPk(Number(idRaw));
    if (!item) return error(404, 'Template not found');
    const next = normalizeDictionaryTemplatePayload(payload, item.key);
    if (!next.key) return error(400, 'key is required');
    if (!next.groupKey) return error(400, 'groupKey is required');
    if (!next.name) return error(400, 'name is required');
    if (next.key !== item.key) {
      const duplicate = await CrmAutomationDictionaryTemplate.findOne({ where: { key: next.key, id: { [Op.ne]: item.id } } });
      if (duplicate) return error(409, 'Template key already exists');
    }
    if (next.groupKey !== item.groupKey) {
      const groupExists = await CrmAutomationDictionaryGroup.findOne({ where: { key: next.groupKey } });
      if (!groupExists) return error(404, 'Group not found for groupKey');
    }
    Object.assign(item, next);
    await item.save();
    return success(item);
  } catch (err) {
    console.error('Update CRM automation dictionary template error:', err);
    return error(err?.statusCode || 500, err.message || 'Failed to update template');
  }
};

export const deleteCrmAutomationDictionaryTemplate = async (event) => {
  requireAdmin(event);
  try {
    const payload = await parseRequestPayload(event);
    const idRaw = payload?.id ?? getRouterParam(event, 'id');
    if (idRaw == null || idRaw === '') return error(400, 'id is required');
    const item = await CrmAutomationDictionaryTemplate.findByPk(Number(idRaw));
    if (!item) return error(404, 'Template not found');
    await item.destroy();
    return success({ deletedId: item.id });
  } catch (err) {
    console.error('Delete CRM automation dictionary template error:', err);
    return error(err?.statusCode || 500, err.message || 'Failed to delete template');
  }
};
