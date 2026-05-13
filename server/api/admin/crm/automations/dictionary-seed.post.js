import { seedCrmAutomationDictionary } from '~/server/controllers/admin';
export default defineEventHandler((event) => seedCrmAutomationDictionary(event));
