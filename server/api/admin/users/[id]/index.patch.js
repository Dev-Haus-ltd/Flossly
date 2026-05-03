import { updateUserInfo } from '~/server/controllers/admin';

export default defineEventHandler((event) => updateUserInfo(event));
