import { getGlobalAutomationLibrary } from '../../../../../controllers/admin';
export default defineEventHandler((event) => getGlobalAutomationLibrary(event));
