import { exportAllTasks } from '../../../../controllers/admin';

export default defineEventHandler((event) => exportAllTasks(event));
