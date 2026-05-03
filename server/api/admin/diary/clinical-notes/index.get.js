import { listClinicalNoteTemplatesAdmin } from '~/server/controllers/admin';

export default defineEventHandler((event) => listClinicalNoteTemplatesAdmin(event));
