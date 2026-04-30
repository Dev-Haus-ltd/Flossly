import { getOrganisationCrmFeatureFlags } from '../../../../controllers/admin';

export default defineEventHandler((event) => getOrganisationCrmFeatureFlags(event));
