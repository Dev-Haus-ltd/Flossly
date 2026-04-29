import { exportOrgTasks } from '../../../../../controllers/admin';

export default defineEventHandler((event) => exportOrgTasks(event));
