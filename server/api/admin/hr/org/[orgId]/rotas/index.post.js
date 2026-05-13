import { createRota } from '~/server/controllers/admin';

export default defineEventHandler((event) => createRota(event));
