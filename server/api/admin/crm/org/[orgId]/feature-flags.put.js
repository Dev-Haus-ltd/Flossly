import { updateOrganisationCrmFeatureFlags } from '~/server/controllers/admin';

export default defineEventHandler((event) => updateOrganisationCrmFeatureFlags(event));
