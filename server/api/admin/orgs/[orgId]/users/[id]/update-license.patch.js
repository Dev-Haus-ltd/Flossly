import { updateUserLicense } from '~/server/controllers/admin';

export default defineEventHandler((event) => updateUserLicense(event));
