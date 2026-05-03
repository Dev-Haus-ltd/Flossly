import { getOrgsByPlanType } from '~/server/controllers/admin';

export default defineEventHandler((event) => getOrgsByPlanType(event));
