import { deleteChecklist } from '~/server/controllers/admin';

export default defineEventHandler((event) => deleteChecklist(event));
