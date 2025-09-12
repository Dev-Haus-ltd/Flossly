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

    <!-- Popup -->
    <CommonPopup ref="popupRef" />

    <!-- Bulk Action Bar -->
    <CommonBulkactionbar
      :isOpen="bulkBar.isOpen"
      :count="bulkBar.ids?.length || 0"
      :icon1="bulkBar.icon1"
      :icon2="bulkBar.icon2"
      :action1Label="bulkBar.action1Label"
      :action2Label="bulkBar.action2Label"
      @action1="onBulkAction1"
      @action2="onBulkAction2"
      @close="onBulkClose"
    />

  </v-layout>
</template>

<script setup>
import { useBus } from "~/composables/useBus";

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
const menuItems = ref([]);
onMounted(() => {
  if (localStorage.getItem("user")) {
    user.value = JSON.parse(localStorage.getItem("user"));
    if (user.value.roleId === 8 || user.value.roleId === 1) {
      menuItems.value = mainStore.getManagerOptions;
    } else {
      menuItems.value = mainStore.getuserOptions;
    }
  }
});

// Popup service: expose methods via provide (not the raw ref)
const popupRef = ref(null)
const popup = {
  ask: (opts) => popupRef.value?.ask?.(opts),
  confirm: () => popupRef.value?.confirm?.(),
  cancel: () => popupRef.value?.cancel?.(),
  setLoading: (v) => popupRef.value?.setLoading?.(v),
}
provide("popup", popup)

// Bulk Action Bar shared state (provided to children)
const bulkBar = ref({
  isOpen: false,
  ids: [],
  context: null,
  icon1: "mdi-dots-horizontal", // default fallback
  icon2: "",
  action1Label: "",
  action2Label: "",
  clear() {
    this.ids = []
    this.isOpen = false
    this.context = null
    this.action1Label = ""
    this.action2Label = ""
    this.icon1 = "mdi-dots-horizontal"
    this.icon2 = ""
  }
})
provide("bulkBar", bulkBar)

// Event bus for coordinating bulk actions
const bus = useBus()

function onBulkAction1() {
  if (!bulkBar.value.isOpen || !bulkBar.value.ids?.length) return
  bus.emit("bulk:execute", {
    context: bulkBar.value.context,
    ids: bulkBar.value.ids,
    action1Label: bulkBar.value.action1Label,
  })
}

function onBulkAction2() {
  if (!bulkBar.value.isOpen || !bulkBar.value.ids?.length) return
  // Emit a delete intent so feature modules (e.g., rota) can handle confirmation & API
  bus.emit("bulk:delete", {
    context: bulkBar.value.context,
    ids: bulkBar.value.ids,
    action2Label: bulkBar.value.action2Label,
  })
}

function onBulkClose() {
  bulkBar.value.clear()
  // Inform children to clear their table selections
  bus.emit("bulk:clear-selection", { context: bulkBar.value.context || "rota" })
}


</script>

<style scoped>
.v-list-item__overlay {
  opacity: 0 !important;
}
</style>