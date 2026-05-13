import { getHrDocumentById } from '~/server/controllers/admin';

export default defineEventHandler((event) => getHrDocumentById(event));
