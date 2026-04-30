import { rejectLeave } from '../../../../../../../controllers/admin';

export default defineEventHandler((event) => rejectLeave(event));
