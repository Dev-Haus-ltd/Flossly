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
        const profileResponse = await authStore.profile();
        
        // Check if current organization is inactive and switch if needed
        if (profileResponse?.code === 0 && profileResponse?.data) {
          const userData = profileResponse.data;
          
          // If current org is inactive and we have a suggested org, switch to it
          if (!userData.isCurrentOrgActive && userData.suggestedOrgId) {
            try {
              const switchResponse = await authStore.switchOrgnanisation({ 
                orgId: userData.suggestedOrgId 
              });
              
              if (switchResponse.code === 0) {
                // Refresh profile after switching
                await authStore.profile();
                const mainStore = useMainStore();
                mainStore.setSnackbar({
                  title: "Switched to an active organization",
                  type: "info",
                });
              }
            } catch (switchError) {
              console.error('Failed to switch organization:', switchError);
            }
          }
          
          // If no active orgs available, logout
          if (!userData.isCurrentOrgActive && !userData.suggestedOrgId) {
            const { setUser } = useUser();
            setUser(null);
            localStorage.removeItem('user');
            return navigateTo("/logout");
          }
        }
      } catch (e) {
        // If profile fails with 403 and we're not on login/logout page, try to handle it
        const status = e?.statusCode || e?.status || e?.data?.statusCode;
        const message = e?.data?.message || e?.message || '';
        
        if (status === 403 && to.path !== "/logout" && to.path !== "/login") {
          // Try to get user from localStorage to see if we can switch orgs
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            try {
              const userData = JSON.parse(storedUser);
              if (userData.userOrganisations && userData.userOrganisations.length > 0) {
                // Find an active org
                const activeOrg = userData.userOrganisations.find(
                  (uo) => uo.status === "Active"
                );
                
                if (activeOrg) {
                  const orgId = activeOrg.organisationId || activeOrg.organisation?.id;
                  if (orgId) {
                    try {
                      await authStore.switchOrgnanisation({ orgId });
                      // Refresh profile and retry
                      await authStore.profile();
                      return; // Success, continue
                    } catch (switchError) {
                      console.error('Failed to switch organization:', switchError);
                    }
                  }
                }
              }
            } catch (parseError) {
              console.error('Failed to parse stored user:', parseError);
            }
          }
          
          // If we can't switch, logout
          return navigateTo("/logout");
        }
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
