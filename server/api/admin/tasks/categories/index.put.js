import { createTaskCategory } from '~/server/controllers/admin';

export default defineEventHandler((event) => createTaskCategory(event));
