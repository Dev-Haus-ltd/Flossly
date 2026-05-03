import { listOrgDocumentFolders } from '~/server/controllers/admin';

export default defineEventHandler((event) => listOrgDocumentFolders(event));
