import { deductPoints } from '~/server/controllers/admin';

export default defineEventHandler((event) => deductPoints(event));
