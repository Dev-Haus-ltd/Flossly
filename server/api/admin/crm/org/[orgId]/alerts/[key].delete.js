import { deleteCrmAlert } from '~/server/controllers/admin';

export default defineEventHandler((event) => deleteCrmAlert(event));
