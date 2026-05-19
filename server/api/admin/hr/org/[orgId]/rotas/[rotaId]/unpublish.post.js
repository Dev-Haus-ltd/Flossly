import { unpublishRota } from '~/server/controllers/admin';

export default defineEventHandler((event) => unpublishRota(event));
