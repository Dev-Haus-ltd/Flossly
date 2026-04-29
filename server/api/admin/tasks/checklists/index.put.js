import { createChecklist } from '../../../../controllers/admin';

export default defineEventHandler((event) => createChecklist(event));
