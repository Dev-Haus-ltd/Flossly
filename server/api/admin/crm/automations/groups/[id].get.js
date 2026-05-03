import { getCrmAutomationDictionaryGroupById } from '~/server/controllers/admin';

export default defineEventHandler((event) => getCrmAutomationDictionaryGroupById(event));
