import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  
  // Skip non-API routes
  if (!event.path.includes('/api')) return;
  
  // Check if this is a public path BEFORE checking for auth
  if (isPublicPath(event.path)) return;
  
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
    console.log(err)
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
    "/api/misc/getRoles",
    "/api/meta/callback",
    "/api/meta/webhook",
  ];
  
  // Check for exact match or if path starts with the public path
  return publicPaths.some(publicPath => 
    path === publicPath || path.startsWith(publicPath + '/')
  );
};