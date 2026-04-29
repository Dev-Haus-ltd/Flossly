import { getTaskPool } from '../../../controllers/admin';

export default defineEventHandler((event) => getTaskPool(event));
