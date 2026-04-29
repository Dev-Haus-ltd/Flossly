import { updateDefaultStatus } from '../../../controllers/admin';

export default defineEventHandler((event) => updateDefaultStatus(event));
