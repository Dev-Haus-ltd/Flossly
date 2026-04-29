import { getOrgsTrialsExpiringInXDays } from '../../../controllers/admin';

export default defineEventHandler((event) => getOrgsTrialsExpiringInXDays(event));
