import { bulkUploadChecklists } from '../../../../controllers/admin';

export default defineEventHandler((event) => bulkUploadChecklists(event));
