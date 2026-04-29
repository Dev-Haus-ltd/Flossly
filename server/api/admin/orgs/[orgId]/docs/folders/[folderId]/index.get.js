import { getOrgDocumentFolderById } from '../../../../../../../controllers/admin';

export default defineEventHandler((event) => getOrgDocumentFolderById(event));
