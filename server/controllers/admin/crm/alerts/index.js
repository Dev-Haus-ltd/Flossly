import { success, error } from '../../../../utils/response';
import { getRouterParam } from 'h3';
import {
  requireAdmin,
  parseRequestPayload,
  readOrganisationId,
  sanitizeAlertOptionInput,
  getOrganisationAlertOptions,
  saveOrganisationAlertOptions,
} from '../../shared.js';

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
    const organisation = await readOrganisationId(event);
    const key = String(getRouterParam(event, 'key') || '').trim().toLowerCase();
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
    const organisation = await readOrganisationId(event);
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
    const organisation = await readOrganisationId(event);
    const pathKey = getRouterParam(event, 'key');
    const currentKey = String(pathKey || '').trim().toLowerCase();
    if (!currentKey) return error(400, 'key is required in the URL path');
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
    const organisation = await readOrganisationId(event);
    const key = String(getRouterParam(event, 'key') || '').trim().toLowerCase();
    if (!key) return error(400, 'key is required in the URL path');
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
