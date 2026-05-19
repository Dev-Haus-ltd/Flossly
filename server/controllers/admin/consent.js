import { success, error } from '../../utils/response';
import { seedConsentFormTemplates as runSeedConsentFormTemplates } from '../../utils/seedConsentFormTemplates';
import { requireAdmin } from './shared.js';

export const seedConsentFormTemplates = async (event) => {
  requireAdmin(event);
  try {
    const result = await runSeedConsentFormTemplates();
    return success(result);
  } catch (err) {
    console.error('Seed consent form templates error:', err);
    return error(err?.statusCode || 500, err.message || 'Failed to seed consent templates');
  }
};
