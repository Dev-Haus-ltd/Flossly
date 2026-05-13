import { getCrmAlertByKey } from '~/server/controllers/admin';

export default defineEventHandler((event) => getCrmAlertByKey(event));
