import { broadcastNotification } from '~/server/controllers/admin';

export default defineEventHandler((event) => broadcastNotification(event));
