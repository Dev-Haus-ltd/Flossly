import { downloadChecklistTemplate } from '~/server/controllers/admin';

export default defineEventHandler((event) => downloadChecklistTemplate(event));
