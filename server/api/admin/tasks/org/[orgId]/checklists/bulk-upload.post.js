import { adminBulkUploadChecklistsForOrg } from '~/server/controllers/admin';

export default defineEventHandler((event) => adminBulkUploadChecklistsForOrg(event));
