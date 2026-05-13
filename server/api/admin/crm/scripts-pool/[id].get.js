import { getScriptPoolItemById } from '~/server/controllers/admin';

export default defineEventHandler((event) => getScriptPoolItemById(event));
