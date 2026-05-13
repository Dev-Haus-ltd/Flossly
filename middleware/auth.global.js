import { isAuthenticated, profileCompletion, userRole } from "../lib/auth";
import { currentPath } from "~/lib/redirect";

export default defineNuxtRouteMiddleware(async (to, from) => {
  if (!process.client) return;
  if (currentPath(to.path)) {
    if (!isAuthenticated()) {
      return navigateTo("/login");
    }

    const authStore = useAuthStore?.();
    // Only fetch profile if it's not already loaded
    if (authStore && typeof authStore.profile === 'function' && !authStore.loggedUser) {
      try {
        await authStore.profile();
      } catch (e) {
        return;
      }
    }

    // Redirect new org creators to the setup wizard until their profile is complete
    const user = authStore?.loggedUser;
    const preference = Array.isArray(user?.preferences)
      ? user.preferences[0]
      : user?.preferences || null;
    const hasStartedSetup = Number(preference?.setupStepsCompleted || 0) > 0;
    if (
      profileCompletion() <= 1 &&
      !hasStartedSetup &&
      (userRole() === 8 || userRole() === 1) &&
      user?.isOrganisationCreator &&
      to.path !== "/setup" &&
      to.path !== "/onboarding"
    ) {
      if (from.path === "/login" || from.path === "/signup") {
        window.location.href = "/setup";
        return;
      }
      return navigateTo("/setup");
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
