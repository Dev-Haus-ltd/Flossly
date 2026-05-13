import { updateChecklist } from '~/server/controllers/admin';

export default defineEventHandler((event) => updateChecklist(event));
