import { updateCrmAlert } from '~/server/controllers/admin';

export default defineEventHandler((event) => updateCrmAlert(event));
