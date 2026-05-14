import { updateOrgLicense } from '~/server/controllers/admin';

export default defineEventHandler((event) => updateOrgLicense(event));
