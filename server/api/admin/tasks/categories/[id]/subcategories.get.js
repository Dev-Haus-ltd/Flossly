import { getTaskSubcategories } from '../../../../../controllers/admin';

export default defineEventHandler((event) => getTaskSubcategories(event));
