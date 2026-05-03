import { updateTaskCategory } from '~/server/controllers/admin';

export default defineEventHandler((event) => updateTaskCategory(event));
