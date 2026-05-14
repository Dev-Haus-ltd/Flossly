import { getTaskCategories } from '~/server/controllers/admin';

export default defineEventHandler((event) => getTaskCategories(event));
