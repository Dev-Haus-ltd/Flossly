<template>
  <v-container class="full-height d-flex" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" md="6" class="text-center">
        <!-- Loading Spinner -->
        <v-progress-circular
          v-if="loading"
          indeterminate
          size="64"
          color="primary"
        />

        <!-- No Token Found -->
        <div v-else-if="!hasToken && !success">
          <v-icon color="error" size="48">mdi-alert-circle-outline</v-icon>
          <h2 class="mt-4">Verification link not found.</h2>
        </div>

        <!-- Verification Successful -->
        <div v-else-if="success">
          <v-icon color="success" size="48">mdi-check-circle-outline</v-icon>
          <h2 class="mt-4">Great! Your email has been verified successfully!</h2>
          <h3>Please login to continue onboarding process.</h3>
          <v-btn class="mt-6" variant="flat" color="primary" @click="navigateToLogin">
            Go to Login
          </v-btn>
        </div>

        <!-- Verification Failed -->
        <div v-else>
          <v-icon color="error" size="48">mdi-close-circle-outline</v-icon>
          <h2 class="mt-4">Verification failed.</h2>
          <p>Your email link is either expired or invalid.</p>
          <v-btn class="mt-6" variant="flat" color="primary" @click="navigateToLogin">
            Home
          </v-btn>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const loading = ref(true);
const success = ref(false);
const hasToken = ref(false);

const verifyEmail = async (link) => {
  try {
    const res = await authStore.verifyEmail({ link });
    loading.value = false;
    console.log('Verification response:', res);
    
    // Check for successful verification - either code 0 or success true
    if (res && (res.code === 0 || res.success === true)) {
      success.value = true;
    } else {
      console.error('Verification failed - unexpected response:', res);
      success.value = false;
    }
  } catch (err) {
    console.error('Verification error:', err);
    success.value = false;
    loading.value = false;
  }
};

onMounted(() => {
  const token = route.params.token;
  if (!token) {
    loading.value = false;
    hasToken.value = false;
    success.value = false;
    return;
  }
  hasToken.value = true;
  verifyEmail(token);
});

const navigateToLogin = () => {
  router.push("/login");
};
</script>

<style scoped>
.full-height {
  height: 100vh;
}
</style>
