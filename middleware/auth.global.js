import { isAuthenticated, profileCompletion, userRole } from "../lib/auth";
import { currentPath } from "~/lib/redirect";

export default defineNuxtRouteMiddleware(async (to, from) => {
  if (!process.client) return;
  if (currentPath(to.path)) {
    if (!isAuthenticated()) {
      return navigateTo("/login");
    }

    // Validate active membership client-side to block deactivated users
    const authStore = useAuthStore?.();
    if (authStore && typeof authStore.profile === 'function') {
      try {
        await authStore.profile();
      } catch (e) {
        // authStore.profile handles redirect/snackbar on 403; just stop here
        return;
      }
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
