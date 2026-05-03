import { getOrgsAboveSeatLimit } from '~/server/controllers/admin';

export default defineEventHandler((event) => getOrgsAboveSeatLimit(event));
