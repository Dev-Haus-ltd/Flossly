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
      return navigateTo("/onboarding");
    }
  } else {
    if (isAuthenticated() && !currentPath(to.path)) {
      if (to.path !== "/logout") {
        return navigateTo("/");
      }
    }
  }
});
