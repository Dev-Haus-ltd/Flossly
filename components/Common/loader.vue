<template>
  <v-overlay
    v-model="anyLoading"
    contained
    class="justify-center align-center full-page"
  >
    <div class="loader">
      <lottie-player
        src="/Loader.json"
        background="transparent"
        speed="1"
        style="width: 200px; height: 200px"
        loop
        autoplay
      />
    </div>
  </v-overlay>
</template>

<script setup>
const authStore = useAuthStore();
const mainStore = useMainStore();
const orgStore = useOrgStore();
const taskStore = useTaskStore();
const docStore = useDocStore();
const userStore = useUserStore();
const { isLoading: authLoading } = storeToRefs(authStore);
const { isLoading: mainLoading } = storeToRefs(mainStore);
const { isLoading: orgLoadong } = storeToRefs(orgStore);
const { isLoading: taskLoading } = storeToRefs(taskStore);
const { isLoading: docLoading } = storeToRefs(docStore);
const { isLoading: userLoading } = storeToRefs(userStore);

const anyLoading = computed(
  () =>
    authLoading.value ||
    mainLoading.value ||
    orgLoadong.value ||
    taskLoading.value ||
    docLoading.value ||
    userLoading.value
);
</script>

<style scoped>
.loader-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.loader {
  width: 100px;
}

.full-page {
  position: fixed !important; /* Override position for full-page */
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>
