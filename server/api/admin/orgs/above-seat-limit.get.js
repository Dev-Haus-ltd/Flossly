import { getOrgsAboveSeatLimit } from '../../../controllers/admin';

export default defineEventHandler((event) => getOrgsAboveSeatLimit(event));
