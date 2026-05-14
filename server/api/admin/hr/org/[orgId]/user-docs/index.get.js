import { listOrgUsersHrDocumentStatus } from '~/server/controllers/admin';

export default defineEventHandler((event) => listOrgUsersHrDocumentStatus(event));
