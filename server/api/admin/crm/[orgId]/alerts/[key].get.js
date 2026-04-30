import { getCrmAlertByKey } from '../../../../../controllers/admin';

export default defineEventHandler((event) => getCrmAlertByKey(event));
