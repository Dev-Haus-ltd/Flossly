import { success, error } from '../../../../utils/response';
import { DictionaryScript } from '../../../../models';
import { Op } from 'sequelize';
import { getRouterParam, getQuery } from 'h3';
import {
  requireAdmin,
  parseRequestPayload,
  sanitizeDictionaryScriptPayload,
} from '../../shared.js';

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
    const idRaw = query.id ?? getRouterParam(event, 'id');
    if (idRaw == null || idRaw === '') return error(400, 'id is required');
    const item = await DictionaryScript.findByPk(Number(idRaw));
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
    const idRaw = payload?.id ?? getRouterParam(event, 'id');
    if (idRaw == null || idRaw === '') return error(400, 'id is required');
    const item = await DictionaryScript.findByPk(Number(idRaw));
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
    const idRaw = payload?.id ?? getRouterParam(event, 'id');
    if (idRaw == null || idRaw === '') return error(400, 'id is required');
    const item = await DictionaryScript.findByPk(Number(idRaw));
    if (!item) return error(404, 'Script not found');
    await item.destroy();
    return success({ deletedId: item.id });
  } catch (err) {
    console.error('Delete script pool item error:', err);
    return error(err?.statusCode || 500, err.message || 'Failed to delete script');
  }
};
