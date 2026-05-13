import { getRotaById } from '~/server/controllers/admin';

export default defineEventHandler((event) => getRotaById(event));
