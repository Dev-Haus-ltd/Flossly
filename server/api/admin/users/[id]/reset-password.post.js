import { resetUserPassword } from '../../../../controllers/admin';

export default defineEventHandler((event) => resetUserPassword(event));
