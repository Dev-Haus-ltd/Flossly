import { createChecklist } from '~/server/controllers/admin';

export default defineEventHandler((event) => createChecklist(event));
