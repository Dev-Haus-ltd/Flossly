<template>
  <div class="bg-white parent">
   
      <v-row>
        <!-- Left banner -->
        <v-col 
          cols="12"
          md="6" 
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
              <v-label class="lbl">Email</v-label>
              <v-text-field
                v-model="email"
                label="Email"
                type="email"
                :rules="emailRules"
                density="comfortable"
                variant="solo"
                single-line
                required
                class="mb-2 input-bordered"
                flat
              />
              <v-btn
                type="submit"
                color="primary"
                block
                class="mt-2 rounded-lg"
                height="48"
                flat
              >
                Send Reset Code
              </v-btn>
            </v-form>

            <!-- Step 2: Reset -->
            <v-form v-else ref="form" @submit.prevent="submitReset">
              <v-label class="lbl">New Password</v-label>
              <v-text-field
                v-model="newPassword"
                label="New Password"
                :type="showPassword ? 'text' : 'password'"
                :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append-inner="showPassword = !showPassword"
                :rules="passwordRules"
                required
                variant="solo"
                class="input-bordered"
                single-line
                density="comfortable"
                flat
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
                variant="flat"
                class="mt-5 rounded-lg"
                height="48"
                :disabled="otp.length < 6"
              >
                Reset Password
              </v-btn>
            </v-form>

            <div class="mt-5 text-body-2 text-center" style="height: 48px">
              <v-btn variant="text" color="primary" @click="goToLogin">
                Back to Login
              </v-btn>
            </div>
          </div>
        </v-col>
          <!-- Right side form -->
          <v-col v-if="mdAndUp" cols="12" md="6" class="d-flex align-center justify-center pa-0">
        <div class="px-4 w-100">
          <div
            class="background-image relative d-flex align-center justify-center"
          >
            <!-- Centered content box -->
            <div class="overlay-box pa-8">
              <!-- Logo -->
              <img
                src="@/assets/logos/loginLogos/white-logo.svg"
                alt="My Logo"
                class="mb-6"
                style="max-width: 180px"
              />

              <!-- Heading -->
              <h1
                style="
                  font-family: 'Garnett';
                  font-weight: 600;
                  font-size: 40px;
                  color: #fff;
                  margin-bottom: 16px;
                  text-align: left;
                "
              >
                A  Reset your password to get back on track.
              </h1>

             
            </div>
          </div>
        </div>
      </v-col>

      
      
      </v-row>
   
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import { useDisplay } from 'vuetify';

const { mdAndUp } = useDisplay();
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
    console.log('Forgot password error:', err); // Debug log
    const errorMessage = err.data?.message || err.message || 'An error occurred';
    store.setSnackbar({
      title: errorMessage,
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
    console.log('Forgot password error:', err); // Debug log
    const errorMessage = err.data?.message || err.message || 'An error occurred';
    store.setSnackbar({
      title: errorMessage,
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
.parent{
  height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
}
.background-image {
  background-image: url("/assets/images/loginBanner.svg");
  background-size: cover;
  width: 100%;
  height: 99vh;
  border-radius: 12px;
}
.login-banner-heading {
  color: #fff;
  
  font-weight: 600;
  font-size: 30px;
}
.login-heading {
  font-family: "Garnett";

  font-weight: 600;
  font-size: 32px;
}
.login-sub-heading {
  font-weight: 400;
  font-size: 16px;
}
.overlay-box {
  border: 1px solid #fff;
  background-color: rgba(255, 255, 255, 0.1); /* translucent white */
  backdrop-filter: blur(10px); /* blur effect */
  -webkit-backdrop-filter: blur(10px); /* Safari support */
  max-width: 530px;
  width: 100%;
  text-align: left;
  border-radius: 15px;
}
.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
  
}
.lbl {
  font-family: "Inter";
  font-weight: 400;
  font-style: "Regular";
  font-size: 16px;
  color: #1e1e1e;
}
</style>
