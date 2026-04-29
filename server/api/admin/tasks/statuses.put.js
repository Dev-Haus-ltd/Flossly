import { createDefaultStatus } from '../../../controllers/admin';

export default defineEventHandler((event) => createDefaultStatus(event));
