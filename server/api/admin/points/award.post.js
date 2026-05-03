import { awardPoints } from '~/server/controllers/admin';

export default defineEventHandler((event) => awardPoints(event));
