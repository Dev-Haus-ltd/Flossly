import { createRotaShift } from '~/server/controllers/admin';

export default defineEventHandler((event) => createRotaShift(event));
