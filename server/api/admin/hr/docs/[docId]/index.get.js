import { getHrDocumentById } from '../../../../../controllers/admin';

export default defineEventHandler((event) => getHrDocumentById(event));
