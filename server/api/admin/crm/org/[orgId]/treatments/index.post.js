import { createCrmTreatment } from '~/server/controllers/admin';
export default defineEventHandler((event) => createCrmTreatment(event));
