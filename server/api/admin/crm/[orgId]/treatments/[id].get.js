import { getCrmTreatmentById } from '../../../../../controllers/admin';

export default defineEventHandler((event) => getCrmTreatmentById(event));
