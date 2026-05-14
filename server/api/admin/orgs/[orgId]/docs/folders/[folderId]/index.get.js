import { getOrgDocumentFolderById } from '~/server/controllers/admin';

export default defineEventHandler((event) => getOrgDocumentFolderById(event));
