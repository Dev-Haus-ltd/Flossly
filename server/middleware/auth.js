import jwt from 'jsonwebtoken'

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
    event.context.user = decoded;
  } catch (err) {
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
    "/api/auth/exchangeShortToken",
    "/api/auth/resendVerificationEmail",
    "/api/misc/getRoles",
    "/api/meta/callback",
    "/api/meta/webhook",
  ];
  
  // Exact match or starts with the path (to handle query params and trailing slashes)
  const isPublic = publicPaths.some(publicPath => 
    path === publicPath || path.startsWith(publicPath + '?') || path.startsWith(publicPath + '/')
  );
  
  return isPublic;
};