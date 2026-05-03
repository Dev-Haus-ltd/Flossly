import { getUsageMetrics } from '~/server/controllers/admin';

export default defineEventHandler((event) => getUsageMetrics(event));
