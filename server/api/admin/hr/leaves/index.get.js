import { listLeaveRequests } from '../../../../controllers/admin';

export default defineEventHandler((event) => listLeaveRequests(event));
