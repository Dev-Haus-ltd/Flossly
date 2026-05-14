import { getRotaShiftById } from '~/server/controllers/admin';

export default defineEventHandler((event) => getRotaShiftById(event));
