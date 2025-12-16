import { isAuthenticated, profileCompletion, userRole } from "../lib/auth";
import { currentPath } from "~/lib/redirect";

export default defineNuxtRouteMiddleware((to, from) => {
  if (!process.client) return;
  if (currentPath(to.path)) {
    if (!isAuthenticated()) {
      return navigateTo("/login");
    }
    if (
      profileCompletion() <= 1 &&
      (userRole() === 8 || userRole() === 1) &&
      to.path !== "/onboarding"
    ) {
      // Force a full page refresh when redirecting to onboarding from login/signup
      if (from.path === "/login" || from.path === "/signup") {
        window.location.href = "/onboarding";
        return;
      }
      return navigateTo("/onboarding");
    }
  } else {
    // Allow logged-in users to access invitation pages to accept/decline invitations
    const isInvitationPath = to.path.includes('/invitation');
    if (isAuthenticated() && !currentPath(to.path) && !isInvitationPath) {
      if (to.path !== "/logout") {
        return navigateTo("/");
      }
    }
  }
});
