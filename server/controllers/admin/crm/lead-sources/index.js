import { success, error } from '../../../../utils/response';
import { CrmOption } from '../../../../models';
import { getRouterParam, getQuery } from 'h3';
import {
  requireAdmin,
  parseRequestPayload,
  readOrganisationId,
  normalizeCrmOptionName,
  listAdminCrmOptionsByCategory,
  getAdminCrmOptionById,
  ensureUniqueAdminCrmOptionName,
} from '../../shared.js';

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
    const idRaw = query.id ?? getRouterParam(event, 'id');
    if (idRaw == null || idRaw === '') return error(400, 'id is required');
    const item = await getAdminCrmOptionById({ organisationId: organisation.id, category: 'lead_source', id: idRaw });
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
    const idRaw = payload?.id ?? getRouterParam(event, 'id');
    if (idRaw == null || idRaw === '') return error(400, 'id is required');
    const mergedPayload = { ...payload, id: idRaw };
    const organisation = await readOrganisationId(event, mergedPayload);
    const item = await getAdminCrmOptionById({ organisationId: organisation.id, category: 'lead_source', id: idRaw });
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
    const idRaw = payload?.id ?? getRouterParam(event, 'id');
    if (idRaw == null || idRaw === '') return error(400, 'id is required');
    const mergedPayload = { ...payload, id: idRaw };
    const organisation = await readOrganisationId(event, mergedPayload);
    const item = await getAdminCrmOptionById({ organisationId: organisation.id, category: 'lead_source', id: idRaw });
    await item.destroy();
    return success({ deletedId: item.id });
  } catch (err) {
    console.error('Delete lead source error:', err);
    return error(err?.statusCode || 500, err.message || 'Failed to delete lead source');
  }
};
