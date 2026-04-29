import { updateUserLicense } from '../../../../controllers/admin';

export default defineEventHandler((event) => updateUserLicense(event));
