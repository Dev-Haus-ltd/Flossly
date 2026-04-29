import { getPointsTotalsByPractice } from '../../../controllers/admin';

export default defineEventHandler((event) => getPointsTotalsByPractice(event));
