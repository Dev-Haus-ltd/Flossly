import { getStorageUsagePerPractice } from '../../../controllers/admin';

export default defineEventHandler((event) => getStorageUsagePerPractice(event));
