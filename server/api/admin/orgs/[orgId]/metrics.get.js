import { getUsageMetrics } from '../../../../controllers/admin';

export default defineEventHandler((event) => getUsageMetrics(event));
