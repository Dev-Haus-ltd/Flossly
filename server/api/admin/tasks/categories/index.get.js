import { getTaskCategories } from '../../../../controllers/admin';

export default defineEventHandler((event) => getTaskCategories(event));
