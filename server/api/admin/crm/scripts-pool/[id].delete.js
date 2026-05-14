import { deleteScriptPoolItem } from '~/server/controllers/admin';

export default defineEventHandler((event) => deleteScriptPoolItem(event));
