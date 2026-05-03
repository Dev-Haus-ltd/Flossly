import { getPastDueOrgs } from '~/server/controllers/admin';

export default defineEventHandler((event) => getPastDueOrgs(event));
