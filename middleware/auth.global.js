import { isAuthenticated, profileCompletion, userRole } from "../lib/auth";
import { currentPath } from "~/lib/redirect";

export default defineNuxtRouteMiddleware((to, from) => {
  if (!process.client) return;
  
  const { completeAuthCheck } = useAuthCheck();
  
  if (currentPath(to.path)) {
    if (!isAuthenticated()) {
      completeAuthCheck();
      return navigateTo("/login");
    }
    if (
      profileCompletion() <= 1 &&
      (userRole() === 8 || userRole() === 1) &&
      to.path !== "/onboarding"
    ) {
      completeAuthCheck();
      return navigateTo("/onboarding");
    }
  } else {
    if (isAuthenticated() && !currentPath(to.path)) {
      if (to.path !== "/logout") {
        completeAuthCheck();
        return navigateTo("/");
      }
    }
  }
  
  // Complete auth check if we get here (no redirect needed)
  completeAuthCheck();
});
