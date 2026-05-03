import { getPointsTotalsByPractice } from '~/server/controllers/admin';

export default defineEventHandler((event) => getPointsTotalsByPractice(event));
