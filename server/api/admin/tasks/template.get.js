import { downloadAdminTaskTemplate } from '~/server/controllers/admin';

export default defineEventHandler((event) => downloadAdminTaskTemplate(event));
