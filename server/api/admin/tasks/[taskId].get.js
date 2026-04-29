import { getTaskById } from '../../../controllers/admin';

export default defineEventHandler((event) => getTaskById(event));
