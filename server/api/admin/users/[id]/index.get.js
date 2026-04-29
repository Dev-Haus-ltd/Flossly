import { getUserById } from '../../../../controllers/admin';

export default defineEventHandler((event) => getUserById(event));
