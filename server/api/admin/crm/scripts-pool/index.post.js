import { createScriptPoolItem } from '~/server/controllers/admin';
export default defineEventHandler((event) => createScriptPoolItem(event));
