import { rejectLeave } from '~/server/controllers/admin';

export default defineEventHandler((event) => rejectLeave(event));
