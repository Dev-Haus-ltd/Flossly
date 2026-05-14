import { getAllRoles } from '~/server/controllers/admin';

export default defineEventHandler((event) => getAllRoles(event));
