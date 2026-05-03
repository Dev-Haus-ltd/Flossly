import { getCrmAutomationDictionaryTemplateById } from '~/server/controllers/admin';

export default defineEventHandler((event) => getCrmAutomationDictionaryTemplateById(event));
