import { getUserHrDocumentStatus } from '~/server/controllers/admin';

export default defineEventHandler((event) => getUserHrDocumentStatus(event));
