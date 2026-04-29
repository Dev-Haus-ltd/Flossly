import { broadcastNotification } from '../../../controllers/admin';

export default defineEventHandler((event) => broadcastNotification(event));
