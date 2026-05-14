import { getTaskById } from '~/server/controllers/admin';

export default defineEventHandler((event) => getTaskById(event));
