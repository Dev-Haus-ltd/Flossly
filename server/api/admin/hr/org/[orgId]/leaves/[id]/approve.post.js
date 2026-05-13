import { approveLeave } from '~/server/controllers/admin';

export default defineEventHandler((event) => approveLeave(event));
