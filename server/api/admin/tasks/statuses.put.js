import { createDefaultStatus } from '~/server/controllers/admin';

export default defineEventHandler((event) => createDefaultStatus(event));
