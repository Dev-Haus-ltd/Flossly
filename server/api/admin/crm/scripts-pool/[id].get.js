import { getScriptPoolItemById } from '../../../../controllers/admin';

export default defineEventHandler((event) => getScriptPoolItemById(event));
