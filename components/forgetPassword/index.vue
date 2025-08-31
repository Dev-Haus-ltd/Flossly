<template>
  <div class="bg-white">
    <v-container>
      <v-row>
        <!-- Left banner -->
        <v-col
          cols="12"
          md="5"
          class="d-flex align-center justify-center px-4 py-9"
        >
          <div class="background-image rounded-xl pa-10 relative">
            <img src="@/assets/logos/loginLogos/white-logo.svg" alt="Logo" />
            <h1 class="mt-5 login-banner-heading">
              Reset your password to get back on track.
            </h1>
          </div>
        </v-col>

        <!-- Right side form -->
        <v-col
          cols="12"
          md="7" 
          class="d-flex align-center justify-center px-12"
        >
          <div style="width: 100%; max-width: 500px">
            <h2 class="text-center login-heading">Forgot Password?</h2>
            <h2
              class="mb-6 text-center login-sub-heading"
              style="color: #8b8b8b"
            >
              {{
                step === 1
                  ? "Enter your email to receive a reset code."
                  : "Enter the OTP and set a new password."
              }}
            </h2>

            <!-- Step 1: Email -->
            <v-form v-if="step === 1" ref="form" @submit.prevent="submitEmail">
              <v-label>Email</v-label>
              <v-text-field
                v-model="email"
                label="Email"
                type="email"
                :rules="emailRules"
                density="comfortable"
                variant="outlined"
                single-line
                required
                class="mb-4"
              />
              <v-btn
                type="submit"
                color="primary"
                block
                class="mt-2 rounded-lg"
              >
                Send Reset Code
              </v-btn>
            </v-form>

            <!-- Step 2: Reset -->
            <v-form v-else ref="form" @submit.prevent="submitReset">
              <v-label>New Password</v-label>
              <v-text-field
                v-model="newPassword"
                label="New Password"
                :type="showPassword ? 'text' : 'password'"
                :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append-inner="showPassword = !showPassword"
                :rules="passwordRules"
                required
                variant="outlined"
                single-line
                density="comfortable"
              />

              <v-label>Enter OTP</v-label>
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
                class="mt-2 rounded-lg"
                :disabled="otp.length < 6"
              >
                Reset Password
              </v-btn>
            </v-form>

            <div class="mt-4 text-body-2 text-center">
              <v-btn variant="text" color="primary" @click="goToLogin">
                Back to Login
              </v-btn>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";

const authStore = useAuthStore();
const store = useMainStore(); // ✅ main snackbar store
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

// Step 1: request reset
const submitEmail = async () => {
  const { valid } = await form.value.validate();
  if (!valid) return;

  try {
    const res = await authStore.requestReset({ email: email.value });
    if (res.code === 0) {
      step.value = 2;
      store.setSnackbar({
        title: res.message || "Reset code sent to your email",
        type: "success",
      });
    } else {
      store.setSnackbar({
        title: res.message || "Something went wrong",
        type: "error",
      });
    }
  } catch (err) {
    store.setSnackbar({
      title: err.message,
      type: "error",
    });
  }
};

// Step 2: reset password
const submitReset = async () => {
  const { valid } = await form.value.validate();
  if (!valid) return;

  if (otp.value.length < 6) {
    store.setSnackbar({
      title: "Please enter the 6-digit OTP",
      type: "error",
    });
    return;
  }

  try {
    const res = await authStore.resetPassword({
      email: email.value,
      otp: otp.value,
      newPassword: newPassword.value,
    });
    if (res.code === 0) {
      store.setSnackbar({
        title: "Password reset successfully!",
        type: "success",
      });
      router.push("/login");
    } else {
      store.setSnackbar({
        title: res.message || "Something went wrong",
        type: "error",
      });
    }
  } catch (err) {
    store.setSnackbar({
      title: err.message,
      type: "error",
    });
  }
};

onMounted(() => {
  if (localStorage.getItem('route')) {
    step.value = 2
    localStorage.removeItem('route')
  }
})

const goToLogin = () => {
  router.push("/login");
};
</script>

<style scoped>
.background-image {
  background-image: url("/assets/images/loginBanner.svg");
  background-size: cover;
  width: 90%;
  height: 90vh;
}
.login-banner-heading {
  color: #fff;
  font-family: "Poppins";
  font-weight: 600;
  font-size: 30px;
}
.login-heading {
  font-weight: 600;
  font-size: 32px;
}
.login-sub-heading {
  font-weight: 400;
  font-size: 16px;
}
</style>
