import { getTaskSubcategories } from '~/server/controllers/admin';

export default defineEventHandler((event) => getTaskSubcategories(event));
