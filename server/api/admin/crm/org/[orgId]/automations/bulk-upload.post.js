import { adminBulkUploadAutomations } from '~/server/controllers/admin';
export default defineEventHandler((event) => adminBulkUploadAutomations(event));
