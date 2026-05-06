<template>
  <v-overlay
    v-model="anyLoading"
    contained
    class="justify-center align-center full-page"
  >
      <lottie-player
        src="/FlossslyLogoBlue.json"
        background="transparent"
        speed="1"
        style="width: 200px; height: 200px"
        loop
        autoplay
      />
  </v-overlay>
</template>

<script setup>
const authStore = useAuthStore();
const mainStore = useMainStore();
const orgStore = useOrgStore();
const taskStore = useTaskStore();
const crmStore = useCrmStore();
const docStore = useDocStore();
const userStore = useUserStore();
const rotaStore= useRotaStore();
const cpdStore = useCpdStore()
const pointStore=usePointStore();
const diaryStore = useDiaryStore();
const { isLoading: authLoading } = storeToRefs(authStore);
const { isLoading: mainLoading } = storeToRefs(mainStore);
const { isLoading: orgLoadong } = storeToRefs(orgStore);
const { isLoading: taskLoading } = storeToRefs(taskStore);
const { isLoading: crmLoading } = storeToRefs(crmStore);
const { isLoading: docLoading } = storeToRefs(docStore);
const { isLoading: userLoading } = storeToRefs(userStore);
const { isLoading: rotaLoading } = storeToRefs(rotaStore);
const { isLoading: cpdLoading } = storeToRefs(cpdStore);
const { isLoading: pointLoading } = storeToRefs(pointStore);
const { isLoading: diaryLoading } = storeToRefs(diaryStore);



const anyLoading = computed(
  () =>
    authLoading.value ||
    mainLoading.value ||
    orgLoadong.value ||
    taskLoading.value ||
    crmLoading.value ||
    docLoading.value ||
    userLoading.value ||
    rotaLoading.value ||
    cpdLoading.value  ||
    pointLoading.value ||
    diaryLoading.value
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

.full-page {
  position: fixed !important;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
