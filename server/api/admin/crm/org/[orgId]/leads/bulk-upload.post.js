import { adminBulkUploadLeads } from '~/server/controllers/admin';

export default defineEventHandler((event) => adminBulkUploadLeads(event));
