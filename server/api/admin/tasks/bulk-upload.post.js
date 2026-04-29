import { adminBulkUploadTasks } from '../../../controllers/admin';

export default defineEventHandler((event) => adminBulkUploadTasks(event));
