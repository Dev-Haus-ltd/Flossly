import { getGlobalAutomationLibrary } from '~/server/controllers/admin';
export default defineEventHandler((event) => getGlobalAutomationLibrary(event));
