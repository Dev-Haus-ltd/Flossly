import { updateUserStatus } from '~/server/controllers/admin';

export default defineEventHandler((event) => updateUserStatus(event));
