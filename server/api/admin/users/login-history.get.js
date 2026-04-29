import { getUserLoginHistory } from '../../../controllers/admin';

export default defineEventHandler((event) => getUserLoginHistory(event));
