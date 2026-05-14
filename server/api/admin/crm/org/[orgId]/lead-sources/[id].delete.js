import { deleteLeadSource } from '~/server/controllers/admin';

export default defineEventHandler((event) => deleteLeadSource(event));
