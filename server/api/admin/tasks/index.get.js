import { getTaskPool } from '~/server/controllers/admin';

export default defineEventHandler((event) => getTaskPool(event));
