import { User } from "../models/index.js";

// Server-side support agent allowlist (should match client-side useDeveloperAccess.js)
const SUPPORT_AGENT_EMAILS = [
  'info@dev-haus.co.uk',
  'newadmin@yopmail.com'
];

export const isSupportAgent = async (userContext) => {
  if (!userContext?.userId) return false;
  const dbUser = await User.findByPk(userContext.userId, { attributes: ['id', 'email'] });
  const email = (dbUser?.email || '').toLowerCase();
  return SUPPORT_AGENT_EMAILS.includes(email);
};
