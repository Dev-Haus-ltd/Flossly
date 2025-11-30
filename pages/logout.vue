<script setup>
const { setUser } = useUser();
const userStore = useUserStore()
definePageMeta({
  layout: "default",
});
const token = useCookie("accessToken");
const router = useRouter();

token.value = null;
onMounted(() => {

userStore.resetUsers()
})
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
