import { createHrDocument } from '~/server/controllers/admin';

export default defineEventHandler((event) => createHrDocument(event));
