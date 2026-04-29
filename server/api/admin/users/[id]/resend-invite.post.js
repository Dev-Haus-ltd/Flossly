import { resendInvite } from '../../../../controllers/admin';

export default defineEventHandler((event) => resendInvite(event));
