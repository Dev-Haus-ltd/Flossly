import { getClinicalNoteTemplateVersionsAdmin } from '~/server/controllers/admin';

export default defineEventHandler((event) => getClinicalNoteTemplateVersionsAdmin(event));
