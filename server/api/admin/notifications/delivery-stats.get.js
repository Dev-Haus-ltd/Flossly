import { getNotificationDeliveryStats } from '~/server/controllers/admin';

export default defineEventHandler((event) => getNotificationDeliveryStats(event));
