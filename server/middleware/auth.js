import jwt from 'jsonwebtoken'
import { error } from '../utils/response'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const path = event.path;
  
  if (!path.includes('/api')) return;
  
  if (isPublicPath(path)) {
    return;
  }
  let token = getCookie(event, 'accessToken')
  if (!token) {
    const authHeader = getHeader(event, 'Authorization')
    if (!authHeader) {
      return error(401, "Missing Authentication");
    } else {
      token = authHeader.split(' ')[1]
    }
  }
  
  if (!token) {
    return error(401, "Missing Authentication");
  }
  
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    event.context.user = decoded;
  } catch (err) {
    return error(401, "Invalid/Expired Token");
  }
});

const isPublicPath = (path) => {
  const publicPaths = [
    "/api/auth/login",
    "/api/auth/signUpRequest",
    "/api/auth/verifyEmail",
    "/api/auth/createHash",
    "/api/auth/requestResetPassword",
    "/api/auth/resetPassword",
    "/api/auth/acceptInvitation",
    "/api/auth/acceptOrganisationInvitation",
    "/api/auth/declineOrganisationInvitation",
    "/api/auth/verifyInvitationToken",
    "/api/auth/exchangeShortToken",
    "/api/auth/resendVerificationEmail",
    "/api/misc/getRoles",
    "/api/meta/callback",
    "/api/meta/webhook",
    "/api/whatsapp/webhook",
    "/api/chatbot/createAppointment",
    "/api/chatbot/createLead",
  ];
  
  const isPublic = publicPaths.some(publicPath => 
    path === publicPath || path.startsWith(publicPath + '?') || path.startsWith(publicPath + '/')
  );
  
  return isPublic;
};
