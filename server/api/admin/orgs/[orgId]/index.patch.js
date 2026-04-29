import { updateOrganisationInfo } from '../../../../controllers/admin';

export default defineEventHandler((event) => updateOrganisationInfo(event));
