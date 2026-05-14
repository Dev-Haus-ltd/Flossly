import { getTaskCategoryById } from '~/server/controllers/admin';

export default defineEventHandler((event) => getTaskCategoryById(event));
