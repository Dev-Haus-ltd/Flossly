import { adminBulkUploadTasks } from '~/server/controllers/admin';

export default defineEventHandler((event) => adminBulkUploadTasks(event));
