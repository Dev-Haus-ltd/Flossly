import { updateUserHrDocument } from '~/server/controllers/admin';

export default defineEventHandler((event) => updateUserHrDocument(event));
