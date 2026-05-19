import { getUserById } from '~/server/controllers/admin';

export default defineEventHandler((event) => getUserById(event));
