import { getDefaultStatuses } from '../../../controllers/admin';

export default defineEventHandler((event) => getDefaultStatuses(event));
