import { getClinicalNoteTemplateVersionsAdmin } from '../../../../../controllers/admin';

export default defineEventHandler((event) => getClinicalNoteTemplateVersionsAdmin(event));
