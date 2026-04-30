import { success, error } from '../../../../utils/response';
import {
  requireAdmin,
  parseRequestPayload,
  readOrganisationId,
  getOrganisationCrmFeatureAccess,
  sanitizeCrmFeatureAccessInput,
  saveOrganisationCrmFeatureAccess,
} from '../../shared.js';

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
