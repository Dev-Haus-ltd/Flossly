import { deductPoints } from '../../../controllers/admin';

export default defineEventHandler((event) => deductPoints(event));
