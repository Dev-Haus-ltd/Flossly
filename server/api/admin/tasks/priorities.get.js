import { getDefaultPriorities } from '../../../controllers/admin';

export default defineEventHandler((event) => getDefaultPriorities(event));
