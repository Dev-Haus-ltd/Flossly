import { getPastDueOrgs } from '../../../controllers/admin';

export default defineEventHandler((event) => getPastDueOrgs(event));
