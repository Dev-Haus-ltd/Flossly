import { listCrmTreatments } from '~/server/controllers/admin';
export default defineEventHandler((event) => listCrmTreatments(event));
