import { updateDefaultStatus } from '~/server/controllers/admin';

export default defineEventHandler((event) => updateDefaultStatus(event));
