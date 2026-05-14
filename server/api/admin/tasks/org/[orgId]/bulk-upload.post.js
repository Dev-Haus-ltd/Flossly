import { adminBulkUploadTasksForOrg } from '~/server/controllers/admin';

export default defineEventHandler((event) => adminBulkUploadTasksForOrg(event));
