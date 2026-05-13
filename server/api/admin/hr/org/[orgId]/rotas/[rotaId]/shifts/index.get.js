import { listRotaShifts } from '~/server/controllers/admin';

export default defineEventHandler((event) => listRotaShifts(event));
