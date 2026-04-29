import { getPointsIssuedByAdmin } from '../../../controllers/admin';

export default defineEventHandler((event) => getPointsIssuedByAdmin(event));
