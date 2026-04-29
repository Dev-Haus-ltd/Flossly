import { getOrgDocumentById } from '../../../../../../controllers/admin';

export default defineEventHandler((event) => getOrgDocumentById(event));
