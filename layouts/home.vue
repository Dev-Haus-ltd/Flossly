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
const drawer = ref(true);
const rail = ref(false);
const onDrawerChange = () => {
  drawer.value = !drawer.value;
};
const updateDrawer = (val) => {
  drawer.value = val;
};
const updateRail = (val) => {
  rail.value = val;
};
watch(drawer, (newVal) => {
  console.log("Drawer changed:", newVal);
});
const user = ref(null);
const mainStore = useMainStore();
const router = useRouter()
const menuItems = ref([]);
onMounted(() => {
  if (localStorage.getItem("user")) {
    user.value = JSON.parse(localStorage.getItem("user"));
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