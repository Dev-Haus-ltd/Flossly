import jwt from 'jsonwebtoken'
import { error } from '../utils/response'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const path = event.path;
  
  // Only check admin routes
  if (!path.includes('/api/admin')) return;
  
  // Get token from Authorization header or cookie
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
    
    // Verify user has admin privileges (roleId = 17)
    if (!decoded.isAdmin) {
      return error(403, "Admin access required.");
    }
    
    // Store admin user info in context
    event.context.admin = decoded;
  } catch (err) {
    return error(401, "Invalid/Expired Token");
  }
});
