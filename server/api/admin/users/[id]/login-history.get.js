import { getUserLoginHistory } from '~/server/controllers/admin';

export default defineEventHandler((event) => getUserLoginHistory(event));
