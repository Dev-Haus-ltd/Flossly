import { deleteChecklist } from '../../../../../controllers/admin';

export default defineEventHandler((event) => deleteChecklist(event));
