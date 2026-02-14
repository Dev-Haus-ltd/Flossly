export const currentPath = (path) => {
  if (
    path === "/login" ||
    path.includes("/password") ||
    path === "/signup" ||
    path === "/forgetpassword" ||
    path.includes("/verifyemail") ||
    path.includes("profile") ||
    path.includes('logout')||
    path.includes('inviteverification') ||
    path.includes('invite') ||
    path.includes('invitation') ||
    path.includes('privacy-policy') ||
    path.includes('terms-of-use') ||
    path.includes('terms-of-service') ||
    path.includes('security-policy') ||
    path.includes('auth/facebook') 
  ) {
    return false;
  }
  return true;
};
 
