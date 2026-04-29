import { getChecklistById } from '../../../../../controllers/admin';

export default defineEventHandler((event) => getChecklistById(event));
