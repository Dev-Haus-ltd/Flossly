import { getChecklists } from '~/server/controllers/admin';

export default defineEventHandler((event) => getChecklists(event));
