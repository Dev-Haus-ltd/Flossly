<script setup>
import { useFCM } from '~/composables/useFCM';

const { setUser } = useUser();
const userStore = useUserStore();
definePageMeta({
  layout: "default",
});
const token = useCookie("accessToken");
const router = useRouter();

const { deleteFCMToken } = useFCM();

if (process.client) {
  try {
    await deleteFCMToken();
  } catch (error) {
    console.error('Error cleaning up FCM token on logout:', error);
  }
}

token.value = null;
onMounted(() => {
  userStore.resetUsers();
});

let savedRoute = "/login";
if (import.meta.client) {
  savedRoute = localStorage.getItem("route");
  localStorage.clear();
}
setUser(null);
if (savedRoute === "forgetpassword") {
  router.push({ name: savedRoute, params: { step: 2 } });
} else {
  router.push("/login");
}
</script>
