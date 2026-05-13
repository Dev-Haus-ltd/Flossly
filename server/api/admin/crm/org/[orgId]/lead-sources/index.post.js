import { createLeadSource } from '~/server/controllers/admin';
export default defineEventHandler((event) => createLeadSource(event));
