import { listHrDocuments } from '../../../../controllers/admin';

export default defineEventHandler((event) => listHrDocuments(event));
