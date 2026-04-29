import { getOrgsByPlanType } from '../../../controllers/admin';

export default defineEventHandler((event) => getOrgsByPlanType(event));
