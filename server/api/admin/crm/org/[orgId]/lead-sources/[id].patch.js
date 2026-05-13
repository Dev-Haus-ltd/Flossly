import { updateLeadSource } from '~/server/controllers/admin';

export default defineEventHandler((event) => updateLeadSource(event));
