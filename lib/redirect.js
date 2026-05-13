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
    path.includes('auth/facebook') ||
    path.startsWith('/form/')||
    path.includes('/uploads/') ||
    path.endsWith('.webmanifest') ||
    path.endsWith('.png') ||
    path.endsWith('.jpg') ||
    path.endsWith('.jpeg') ||
    path.endsWith('.svg') ||
    path.endsWith('.ico') ||
    path.endsWith('.avif') ||
    path.endsWith('.webp')
  ) {
    return false;
  }
  return true;
};
 
