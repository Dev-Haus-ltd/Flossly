import { updateOrganisationCrmFeatureFlags } from '../../../../controllers/admin';

export default defineEventHandler((event) => updateOrganisationCrmFeatureFlags(event));
