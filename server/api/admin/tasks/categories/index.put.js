import { createTaskCategory } from '../../../../controllers/admin';

export default defineEventHandler((event) => createTaskCategory(event));
