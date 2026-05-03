import { createDefaultPriority } from '~/server/controllers/admin';

export default defineEventHandler((event) => createDefaultPriority(event));
