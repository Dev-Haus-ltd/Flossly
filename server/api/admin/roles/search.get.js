import { searchRoles } from '~/server/controllers/admin';

export default defineEventHandler((event) => searchRoles(event));
