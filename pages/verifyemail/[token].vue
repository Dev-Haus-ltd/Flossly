<template>
  <v-container class="full-height d-flex" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" md="6" class="text-center">
        <!-- Loader -->
        <div v-if="loading" class="loader-wrapper">
          <div class="loader"></div>
        </div>

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
const mainstore = useMainStore();

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
      mainstore.setSnackbar({
        title: "Email verified successfully!",
        type: "success",
      });
    } else {
      console.error('Verification failed - unexpected response:', res);
      success.value = false;
      const message = res?.data?.message || res?.message || "Email verification failed";
      mainstore.setSnackbar({
        title: message,
        type: "error",
      });
    }
  } catch (err) {
    console.error('Verification error:', err);
    success.value = false;
    loading.value = false;
    const errorMessage = err.data?.message || err.message || "An error occurred during email verification";
    mainstore.setSnackbar({
      title: errorMessage,
      type: "error",
    });
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

.loader-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 120px;
}

.loader {
  height: 30px;
  aspect-ratio: 6;

  --c: transparent 64%,
       #0061FB 66% 98%,
       transparent 101%;

  background:
    radial-gradient(35% 146% at 50% 159%, var(--c)) 0 0,
    radial-gradient(35% 146% at 50% -59%, var(--c)) 25% 100%;
  background-size: calc(100% / 3) 50%;
  background-repeat: repeat-x;
  clip-path: inset(0 100% 0 0);
  animation: l5 1.5s infinite linear;
}

@keyframes l5 {
  50% { clip-path: inset(0) }
  to  { clip-path: inset(0 0 0 100%) }
}


</style>
