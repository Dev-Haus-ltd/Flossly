import jwt from 'jsonwebtoken'
import { User, UserOrganisation } from '../models'
import { error } from '../utils/response'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const path = event.path;
  
  // Skip non-API routes entirely
  if (!path.includes('/api')) return;
  
  // CRITICAL: Check public paths FIRST before any auth logic
  if (isPublicPath(path)) {
    console.log('[AUTH] Public path allowed:', path); // Add logging
    return; // Exit immediately for public paths
  }
  
  // Now check for authentication
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
    
    // Validate organization membership if orgId is present in token
    if (decoded.orgId && decoded.userId) {
      // Check if user's global status is not disabled/expired
      const user = await User.findByPk(decoded.userId, {
        attributes: ['status'],
      });
      
      if (user && (user.status === "Disabled" || user.status === "Expired")) {
        return error(403, "Your account is deactivated");
      }
      
      // Check if user's organization membership is still active
      const membership = await UserOrganisation.findOne({
        where: {
          userId: decoded.userId,
          organisationId: decoded.orgId,
          isActive: true,
          status: "Active",
        },
      });
      
      // Allow profile and switchOrg endpoints even if current org is inactive
      // This allows users to switch to another active org
      const isOrgSwitchEndpoint = path.includes('/api/auth/profile') || 
                                   path.includes('/api/auth/switchOrg');
      
      if (!membership && !isOrgSwitchEndpoint) {
        return error(403, "Your organisation membership is inactive");
      }
    }
    
    event.context.user = decoded;
  } catch (err) {
    // If it's already an error response, re-throw it
    if (err.statusCode) {
      throw err;
    }
    console.log('[AUTH] Token verification failed:', err.message);
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
    "/api/chatbot/createAppointment",
    "/api/chatbot/createLead",
  ];
  
  // Exact match or starts with the path (to handle query params and trailing slashes)
  const isPublic = publicPaths.some(publicPath => 
    path === publicPath || path.startsWith(publicPath + '?') || path.startsWith(publicPath + '/')
  );
  
  return isPublic;
};