import { createClinicalNoteTemplateAdmin } from '~/server/controllers/admin';

export default defineEventHandler((event) => createClinicalNoteTemplateAdmin(event));
