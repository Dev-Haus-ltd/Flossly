import { deleteTaskCategory } from '~/server/controllers/admin';

export default defineEventHandler((event) => deleteTaskCategory(event));
