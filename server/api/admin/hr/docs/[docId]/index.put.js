import { updateHrDocument } from '~/server/controllers/admin';

export default defineEventHandler((event) => updateHrDocument(event));
