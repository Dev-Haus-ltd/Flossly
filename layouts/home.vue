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
    <v-main>
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
  rail.value = !rail.value ;
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
      // rail.value = false   
    }
  },
  { immediate: true } 
)
const user = ref(null);
const { setUser } = useUser();
const mainStore = useMainStore();
const userStore = useUserStore();
const router = useRouter()
const menuItems = ref([]);
const preloadUsers = async () => {
  try {
    await userStore.getUserList({ roleId: null });
  } catch (e) {
    console.error('Failed to preload users', e);
  }
};
onMounted(async () => {
  await preloadUsers();
  if (localStorage.getItem("user")) {
    user.value = JSON.parse(localStorage.getItem("user"));
    setUser(user.value)
    if (user.value.roleId === 8 || user.value.roleId === 1) {
      menuItems.value = mainStore.getManagerOptions;
    } else {
      menuItems.value = mainStore.getuserOptions;
    }
  } else {
    router.push('/logout')
  }
});
</script>

<style scopped>
.v-list-item__overlay {
  opacity: 0 !important;
}</style>
