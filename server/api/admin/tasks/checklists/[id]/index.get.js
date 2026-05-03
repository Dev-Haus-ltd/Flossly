import { getChecklistById } from '~/server/controllers/admin';

export default defineEventHandler((event) => getChecklistById(event));
