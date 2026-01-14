<template>
  <v-layout>
    <!-- App Bar -->
    <appBar
      :rail="rail"
      :drawer="drawer"
      :user="user"
      @small-screen-drawer="onDrawerChange"
    />
    <!-- side bar -->
    <leftSideBar
      v-if="!(smAndDown && rail)"
      :rail="rail"
      :drawer="drawer"
      :menuItems="menuItems"
      @update:drawer="updateDrawer"
      @update:rail="updateRail"
    />
    <v-main :style="{ paddingTop: 'calc(70px + var(--trial-banner-height, 0px))' }">
      <slot />
    </v-main>
  </v-layout>
</template>

<script setup>
import { useDisplay } from "vuetify";

const { smAndDown } = useDisplay();
const drawer = ref(true);
const rail = ref(false);
const onDrawerChange = () => {
  drawer.value = !drawer.value ;
};
const updateDrawer = (val) => {
  drawer.value = val;
};
const updateRail = (val) => {
  rail.value = val;
};
watch(
  () => smAndDown.value,
  (isSmall) => {
    if (isSmall) {
      // On mobile, close drawer by default
      drawer.value = false;
    } else {
      // On desktop, open drawer by default
      drawer.value = true;
    }
  },
  { immediate: true } 
);
const { user, isManager, setUser } = useUser();
const mainStore = useMainStore();
const userStore = useUserStore();
const router = useRouter()
const menuItems = computed(() => {
  // Read license type to refresh menu when preferences change.
  const licenseType = user.value?.preferences?.licenseType;
  if (!user.value) return [];
  return isManager.value ? mainStore.getManagerOptions : mainStore.getuserOptions;
});
const preloadUsers = async () => {
  try {
    await userStore.getUserList({ roleId: null });
  } catch (e) {
    console.error('Failed to preload users', e);
  }
};
onMounted(async () => {
  await preloadUsers();
  if (!user.value && process.client) {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      return;
    }
  }
  if (!user.value) {
    router.push("/logout");
  }
});
</script>

<style scopped>
.v-list-item__overlay {
  opacity: 0 !important;
}</style>
