import { listOrgDocuments } from '~/server/controllers/admin';

export default defineEventHandler((event) => listOrgDocuments(event));
