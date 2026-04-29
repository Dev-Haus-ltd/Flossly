import { createCrmAlert } from '../../../../controllers/admin';
export default defineEventHandler((event) => createCrmAlert(event));
