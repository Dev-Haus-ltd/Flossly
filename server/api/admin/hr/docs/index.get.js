import { listHrDocuments } from '~/server/controllers/admin';

export default defineEventHandler((event) => listHrDocuments(event));
