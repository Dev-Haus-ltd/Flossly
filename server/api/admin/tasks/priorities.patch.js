import { updateDefaultPriority } from '../../../controllers/admin';

export default defineEventHandler((event) => updateDefaultPriority(event));
