import { updateDefaultPriority } from '~/server/controllers/admin';

export default defineEventHandler((event) => updateDefaultPriority(event));
