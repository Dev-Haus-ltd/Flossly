import { getStorageUsagePerPractice } from '~/server/controllers/admin';

export default defineEventHandler((event) => getStorageUsagePerPractice(event));
