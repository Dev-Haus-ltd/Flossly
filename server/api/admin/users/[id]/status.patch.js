import { updateUserStatus } from '../../../../controllers/admin';

export default defineEventHandler((event) => updateUserStatus(event));
