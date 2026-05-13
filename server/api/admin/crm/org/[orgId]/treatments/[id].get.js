import { getCrmTreatmentById } from '~/server/controllers/admin';

export default defineEventHandler((event) => getCrmTreatmentById(event));
