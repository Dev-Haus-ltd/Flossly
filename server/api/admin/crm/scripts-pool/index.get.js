import { listScriptsPool } from '~/server/controllers/admin';
export default defineEventHandler((event) => listScriptsPool(event));
