import { searchUsers } from '../../../controllers/admin';

export default defineEventHandler((event) => searchUsers(event));
