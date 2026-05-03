import { resetUserPassword } from '~/server/controllers/admin';

export default defineEventHandler((event) => resetUserPassword(event));
