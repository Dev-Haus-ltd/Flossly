import { getOrgsTrialsExpiringInXDays } from '~/server/controllers/admin';

export default defineEventHandler((event) => getOrgsTrialsExpiringInXDays(event));
