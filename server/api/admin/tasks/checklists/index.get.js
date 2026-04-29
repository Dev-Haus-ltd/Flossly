import { getChecklists } from '../../../../controllers/admin';

export default defineEventHandler((event) => getChecklists(event));
