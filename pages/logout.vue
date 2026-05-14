<script setup>
import { useFCM } from "~/composables/useFCM";
import { resetUsageState } from "~/composables/useUsageSummary";

definePageMeta({
  layout: false,
});

const { setUser } = useUser();
const authStore = useAuthStore();
const userStore = useUserStore();
const { deleteFCMToken } = useFCM();

const accessToken = useCookie("accessToken");
const loggedUserId = useCookie("loggedUserId");
const profileCompletion = useCookie("profileCompletion");
const role = useCookie("role");

const clearAuthState = () => {
  let savedRoute = "/login";

  accessToken.value = null;
  loggedUserId.value = null;
  profileCompletion.value = null;
  role.value = null;

  authStore.$reset();
  userStore.resetUsers();
  setUser(null);
  resetUsageState();

  if (import.meta.client) {
    savedRoute = localStorage.getItem("route") || "/login";
    localStorage.clear();
    sessionStorage.clear();

    if (savedRoute === "forgetpassword") {
      localStorage.setItem("route", "forgetpassword");
    }
  }

  return savedRoute;
};

const redirectToPublicPage = (savedRoute) => {
  if (!import.meta.client) return;

  const target = savedRoute === "forgetpassword" ? "/forgetpassword" : "/login";
  window.location.replace(target);
};

onMounted(async () => {
  try {
    await deleteFCMToken();
  } catch (error) {
    console.error("Error cleaning up FCM token on logout:", error);
  } finally {
    const savedRoute = clearAuthState();
    redirectToPublicPage(savedRoute);
  }
});
</script>
