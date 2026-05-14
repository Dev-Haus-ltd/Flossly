import { getPracticeAutomationLibrary } from '~/server/controllers/admin';
export default defineEventHandler((event) => getPracticeAutomationLibrary(event));
