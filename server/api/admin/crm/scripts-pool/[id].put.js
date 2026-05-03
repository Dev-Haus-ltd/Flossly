import { updateScriptPoolItem } from '~/server/controllers/admin';

export default defineEventHandler((event) => updateScriptPoolItem(event));
