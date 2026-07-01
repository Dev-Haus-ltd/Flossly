<template>
  <div class="forgot-page">
    <div class="gradient-bg" />
    <img src="/grids.svg" class="grid-overlay" aria-hidden="true" />

    <!-- Left: Floating glass card -->
    <div class="forgot-card-col d-flex align-center justify-center">
      <div class="d-flex flex-column align-center" style="width: 100%; max-width: 480px;">
        <img src="/white-logo.svg" alt="FlosslyOS" class="page-logo mb-6" />
        <div class="forgot-card pa-10" style="width: 100%">
        <h2 class="welcome-heading text-center mb-2">Forgot Password?</h2>
        <p class="welcome-sub text-center mb-6">
          {{
            step === 1
              ? "Enter your email to receive a reset code."
              : "Enter the OTP and set a new password."
          }}
        </p>

        <!-- Step 1: Email -->
        <v-form v-if="step === 1" ref="form" @submit.prevent="submitEmail">
          <label class="lbl">Email</label>
          <v-text-field
            v-model="email"
            type="email"
            placeholder="you@example.com"
            :rules="emailRules"
            density="comfortable"
            variant="solo"
            single-line
            required
            class="mb-3 input-bordered"
            flat
          />

          <v-btn
            type="submit"
            color="primary"
            block
            class="rounded-lg mb-4"
            height="48"
            flat
          >
            Send Reset Code
          </v-btn>
        </v-form>

        <!-- Step 2: Reset -->
        <v-form v-else ref="form" @submit.prevent="submitReset">
          <label class="lbl">New Password</label>
          <v-text-field
            v-model="newPassword"
            :type="showPassword ? 'text' : 'password'"
            placeholder="*************"
            :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
            @click:append-inner="showPassword = !showPassword"
            :rules="passwordRules"
            required
            variant="solo"
            class="mb-3 input-bordered"
            single-line
            density="comfortable"
            flat
          />

          <label class="lbl">Enter OTP</label>
          <v-otp-input
            v-model="otp"
            length="6"
            type="number"
            class="mb-4 otp-input"
          />

          <v-btn
            type="submit"
            color="primary"
            block
            variant="flat"
            class="rounded-lg"
            height="48"
            :disabled="otp.length < 6"
          >
            Reset Password
          </v-btn>
        </v-form>

        <div class="mt-4 text-body-2 text-center">
          <v-btn variant="text" color="#0061FB" @click="goToLogin">
            Back to Login
          </v-btn>
        </div>
        </div>
      </div>
    </div>

    <!-- Right: Illustration + tagline (hidden on mobile) -->
    <div v-if="!smAndDown" class="right-panel d-flex flex-column align-center justify-center">
      <img
        src="/forgot.png"
        class="right-illustration"
        alt=""
      />
      <div class="right-text text-center px-10 mt-6">
        <h1 class="right-heading text-white mb-4">Reset your password to get back on track.</h1>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";

const { smAndDown } = useDisplay();
const authStore = useAuthStore();
const store = useMainStore();
const router = useRouter();
const step = ref(1);

const email = ref("");
const otp = ref("");
const newPassword = ref("");
const showPassword = ref(false);
const form = ref(null);

const emailRules = [
  (v) => !!v || "Email is required",
  (v) => /.+@.+\..+/.test(v) || "E-mail must be valid",
];

const passwordRules = [
  (v) => !!v || "Password is required",
  (v) => v.length >= 6 || "Password must be at least 6 characters",
];

const submitEmail = async () => {
  const { valid } = await form.value.validate();
  if (!valid) return;

  try {
    const res = await authStore.requestReset({ email: email.value.trim() });
    if (res.code === 0) {
      step.value = 2;
      store.setSnackbar({ title: res.message || "Reset code sent to your email", type: "success" });
    } else {
      store.setSnackbar({ title: res.message || "Something went wrong", type: "error" });
    }
  } catch (err) {
    store.setSnackbar({ title: err.data?.message || err.message || "An error occurred", type: "error" });
  }
};

const submitReset = async () => {
  const { valid } = await form.value.validate();
  if (!valid) return;

  if (otp.value.length < 6) {
    store.setSnackbar({ title: "Please enter the 6-digit OTP", type: "error" });
    return;
  }

  try {
    const res = await authStore.resetPassword({
      email: email.value.trim(),
      otp: otp.value,
      newPassword: newPassword.value,
    });
    if (res.code === 0) {
      store.setSnackbar({ title: "Password reset successfully!", type: "success" });
      router.push("/login");
    } else {
      store.setSnackbar({ title: res.message || "Something went wrong", type: "error" });
    }
  } catch (err) {
    store.setSnackbar({ title: err.data?.message || err.message || "An error occurred", type: "error" });
  }
};

onMounted(() => {
  if (localStorage.getItem("route")) {
    step.value = 2;
    localStorage.removeItem("route");
  }
});

const goToLogin = () => {
  router.push("/login");
};
</script>

<style scoped>
.forgot-page {
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  width: 100%;
  display: flex;
  align-items: stretch;
  overflow: hidden;
}

.grid-overlay {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
  pointer-events: none;
  opacity: 0.6;
}

.gradient-bg {
  position: fixed;
  inset: 0;
  background: linear-gradient(
    157.223deg,
    rgb(255, 169, 119) 0.51%,
    rgb(255, 133, 218) 39.8%,
    rgb(125, 119, 255) 77.18%,
    rgb(104, 236, 230) 116.07%
  );
  z-index: 0;
}

.forgot-card-col {
  position: relative;
  z-index: 1;
  flex: 0 0 50%;
  max-width: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
}

@media (max-width: 959px) {
  .forgot-card-col {
    flex: 0 0 100%;
    max-width: 100%;
  }
}

.forgot-card {
  width: 100%;
  max-width: 480px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(50px);
  -webkit-backdrop-filter: blur(50px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 15px;
  box-shadow: 0px 40px 40px 0px rgba(0, 0, 0, 0.2);
}

.right-panel {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 32px;
}

.right-illustration {
  width: 100%;
  max-width: 520px;
  height: auto;
  object-fit: contain;
}

.right-heading {
  font-family: "Inter", sans-serif;
  font-weight: 700;
  font-size: 26px;
  line-height: 1.3;
  color: #fff;
}

.welcome-heading {
  font-family: "Garnett", sans-serif;
  font-weight: 600;
  font-size: 40px;
  color: #1e1e1e;
  line-height: 1.3;
}

.welcome-sub {
  font-family: "Inter", sans-serif;
  font-weight: 400;
  font-size: 16px;
  color: #1e1e1e;
  line-height: 1.3;
}

.lbl {
  font-family: "Inter", sans-serif;
  font-weight: 400;
  font-size: 16px;
  color: #1e1e1e;
  display: block;
  margin-bottom: 6px;
}

.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 44px;
  font-size: 14px;
}

.otp-input :deep(.v-otp-input__field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
}

.page-logo {
  height: 32px;
  width: auto;
}

@media (max-width: 960px) {
  .forgot-page {
    align-items: flex-start;
  }
}
</style>