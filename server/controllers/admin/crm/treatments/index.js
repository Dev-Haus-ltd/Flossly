import { success, error } from '../../../../utils/response';
import { CrmOption } from '../../../../models';
import { getRouterParam } from 'h3';
import {
  requireAdmin,
  parseRequestPayload,
  parseOrganisationIdFromPath,
  normalizeCrmOptionName,
  listAdminCrmOptionsByCategory,
  getAdminCrmOptionById,
  ensureUniqueAdminCrmOptionName,
} from '../../shared.js';

export const listCrmTreatments = async (event) => {
  requireAdmin(event);
  try {
    const organisationId = parseOrganisationIdFromPath(event);
    const items = await listAdminCrmOptionsByCategory(organisationId, 'treatment');
    return success(items);
  } catch (err) {
    console.error('List CRM treatments error:', err);
    return error(err?.statusCode || 500, err.message || 'Failed to list CRM treatments');
  }
};

export const getCrmTreatmentById = async (event) => {
  requireAdmin(event);
  try {
    const organisationId = parseOrganisationIdFromPath(event);
    const idRaw = getRouterParam(event, 'id');
    if (idRaw == null || idRaw === '') return error(400, 'id is required');
    const item = await getAdminCrmOptionById({ organisationId, category: 'treatment', id: idRaw });
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
    const organisationId = parseOrganisationIdFromPath(event);
    const name = normalizeCrmOptionName(payload?.name);
    const color = payload?.color ? String(payload.color).trim() : null;
    const ordering = payload?.ordering == null || payload.ordering === '' ? null : Number(payload.ordering);
    if (!name) return error(400, 'name is required');
    await ensureUniqueAdminCrmOptionName({ organisationId, category: 'treatment', name });
    const created = await CrmOption.create({ organisationId, category: 'treatment', name, color, ordering, active: payload?.active !== false });
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
    const idRaw = getRouterParam(event, 'id');
    if (idRaw == null || idRaw === '') return error(400, 'id is required');
    const organisationId = parseOrganisationIdFromPath(event);
    const item = await getAdminCrmOptionById({ organisationId, category: 'treatment', id: idRaw });
    if (payload?.name !== undefined) {
      const name = normalizeCrmOptionName(payload.name);
      if (!name) return error(400, 'name cannot be empty');
      await ensureUniqueAdminCrmOptionName({ organisationId, category: 'treatment', name, excludeId: item.id });
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
    const idRaw = getRouterParam(event, 'id');
    if (idRaw == null || idRaw === '') return error(400, 'id is required');
    const organisationId = parseOrganisationIdFromPath(event);
    const item = await getAdminCrmOptionById({ organisationId, category: 'treatment', id: idRaw });
    await item.destroy();
    return success({ deletedId: item.id });
  } catch (err) {
    console.error('Delete CRM treatment error:', err);
    return error(err?.statusCode || 500, err.message || 'Failed to delete CRM treatment');
  }
};
