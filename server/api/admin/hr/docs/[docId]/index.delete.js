import { deleteHrDocument } from '~/server/controllers/admin';

export default defineEventHandler((event) => deleteHrDocument(event));
