import { getUserHrDocumentStatus } from '../../../../../../../../controllers/admin';

export default defineEventHandler((event) => getUserHrDocumentStatus(event));
