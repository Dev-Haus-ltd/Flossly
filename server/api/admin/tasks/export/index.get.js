import { exportAllTasks } from '~/server/controllers/admin';

export default defineEventHandler((event) => exportAllTasks(event));
