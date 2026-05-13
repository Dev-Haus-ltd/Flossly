import { searchOrganisations } from '~/server/controllers/admin';

export default defineEventHandler((event) => searchOrganisations(event));
