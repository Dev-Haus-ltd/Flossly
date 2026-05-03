import { getOrganisationById } from '~/server/controllers/admin';

export default defineEventHandler((event) => getOrganisationById(event));
