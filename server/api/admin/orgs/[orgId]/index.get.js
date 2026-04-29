import { getOrganisationById } from '../../../../controllers/admin';

export default defineEventHandler((event) => getOrganisationById(event));
