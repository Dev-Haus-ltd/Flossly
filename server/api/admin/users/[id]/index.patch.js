import { updateUserInfo } from '../../../../controllers/admin';

export default defineEventHandler((event) => updateUserInfo(event));
