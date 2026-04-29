import { searchOrganisations } from '../../../controllers/admin';

export default defineEventHandler((event) => searchOrganisations(event));
