import { createCrmAlert } from '~/server/controllers/admin';
export default defineEventHandler((event) => createCrmAlert(event));
