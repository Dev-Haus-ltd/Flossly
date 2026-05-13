import { getLeadSourceById } from '~/server/controllers/admin';

export default defineEventHandler((event) => getLeadSourceById(event));
