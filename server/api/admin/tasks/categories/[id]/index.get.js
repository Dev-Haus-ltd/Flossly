import { getTaskCategoryById } from '../../../../../controllers/admin';

export default defineEventHandler((event) => getTaskCategoryById(event));
