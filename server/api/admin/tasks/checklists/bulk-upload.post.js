import { bulkUploadChecklists } from '~/server/controllers/admin';

export default defineEventHandler((event) => bulkUploadChecklists(event));
