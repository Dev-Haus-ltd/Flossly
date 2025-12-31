import { isAuthenticated, profileCompletion, userRole } from "../lib/auth";
import { currentPath } from "~/lib/redirect";

export default defineNuxtRouteMiddleware(async (to, from) => {
  if (!process.client) return;
  if (currentPath(to.path)) {
    if (!isAuthenticated()) {
      return navigateTo("/login");
    }

    const authStore = useAuthStore?.();
    if (authStore && typeof authStore.profile === 'function') {
      try {
        await authStore.profile();
      } catch (e) {
        return;
      }
    }

    if (
      profileCompletion() <= 1 &&
      (userRole() === 8 || userRole() === 1) &&
      to.path !== "/onboarding"
    ) {
      if (from.path === "/login" || from.path === "/signup") {
        window.location.href = "/onboarding";
        return;
      }
      return navigateTo("/onboarding");
    }
  } else {
    const isInvitationPath = to.path.includes('/invitation');
    if (isAuthenticated() && !currentPath(to.path) && !isInvitationPath) {
      if (to.path !== "/logout") {
        return navigateTo("/");
      }
    }
  }
});