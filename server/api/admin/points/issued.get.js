import { getPointsIssuedByAdmin } from '~/server/controllers/admin';

export default defineEventHandler((event) => getPointsIssuedByAdmin(event));
