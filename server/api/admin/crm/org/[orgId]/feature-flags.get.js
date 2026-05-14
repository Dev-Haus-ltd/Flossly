import { getOrganisationCrmFeatureFlags } from '~/server/controllers/admin';

export default defineEventHandler((event) => getOrganisationCrmFeatureFlags(event));
