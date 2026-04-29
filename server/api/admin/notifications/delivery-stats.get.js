import { getNotificationDeliveryStats } from '../../../controllers/admin';

export default defineEventHandler((event) => getNotificationDeliveryStats(event));
