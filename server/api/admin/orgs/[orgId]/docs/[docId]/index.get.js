import { getOrgDocumentById } from '~/server/controllers/admin';

export default defineEventHandler((event) => getOrgDocumentById(event));
