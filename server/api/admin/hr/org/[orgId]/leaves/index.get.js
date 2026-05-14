import { listLeaveRequests } from '~/server/controllers/admin';

export default defineEventHandler((event) => listLeaveRequests(event));
