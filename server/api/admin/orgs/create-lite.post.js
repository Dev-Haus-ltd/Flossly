import { createLiteAccount } from '~/server/controllers/admin';

export default defineEventHandler((event) => createLiteAccount(event));
