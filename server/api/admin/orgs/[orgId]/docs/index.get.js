import { listOrgDocuments } from '../../../../../controllers/admin';

export default defineEventHandler((event) => listOrgDocuments(event));
