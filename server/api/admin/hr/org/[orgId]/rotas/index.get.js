import { listOrgsRotas } from '~/server/controllers/admin';

export default defineEventHandler((event) => listOrgsRotas(event));
