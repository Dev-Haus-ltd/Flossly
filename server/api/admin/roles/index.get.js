import { getAllRoles } from '../../../controllers/admin';

export default defineEventHandler((event) => getAllRoles(event));
