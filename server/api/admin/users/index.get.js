import { searchUsers } from '~/server/controllers/admin';

export default defineEventHandler((event) => searchUsers(event));
