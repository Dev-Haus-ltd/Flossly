<template>
  <div>
    <!-- Show loader while checking authentication -->
    <div v-if="isCheckingAuth" class="auth-loader-overlay">
      <div class="auth-loader-content">
        <lottie-player
          src="/FlossslyLogoBlue.json"
          background="transparent"
          speed="1"
          style="width: 200px; height: 200px"
          loop
          autoplay
        />
      </div>
    </div>
    <!-- Only render dashboard after auth check is complete and user is authenticated -->
    <DashBoard v-else-if="isAuthenticated" />
  </div>
</template>

<script setup>
import { isAuthenticated as checkAuth } from "~/lib/auth";

definePageMeta({
  layout: "home",
});

const isCheckingAuth = ref(true);
const isAuthenticated = ref(false);

onMounted(() => {
  // Small delay to ensure cookies are loaded
  nextTick(() => {
    isAuthenticated.value = checkAuth();
    isCheckingAuth.value = false;
  });
});
</script>

<style scoped>
.auth-loader-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.auth-loader-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}
</style>