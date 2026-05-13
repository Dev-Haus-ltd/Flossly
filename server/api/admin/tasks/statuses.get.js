import { getDefaultStatuses } from '~/server/controllers/admin';

export default defineEventHandler((event) => getDefaultStatuses(event));
