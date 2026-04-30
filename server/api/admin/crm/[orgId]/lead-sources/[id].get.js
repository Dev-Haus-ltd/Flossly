import { getLeadSourceById } from '../../../../../controllers/admin';

export default defineEventHandler((event) => getLeadSourceById(event));
