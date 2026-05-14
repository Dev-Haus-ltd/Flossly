<template>
  <div class="signup-page">
    <div class="gradient-bg" />
    <img src="/grids.svg" class="grid-overlay" aria-hidden="true" />

    <!-- Left: Floating glass signup card -->
    <div class="signup-card-col d-flex align-center justify-center">
      <div class="signup-card pa-10">
        <template v-if="!isSignedUp">
          <h2 class="welcome-heading text-center mb-2">Sign Up</h2>
          <p class="welcome-sub text-center mb-6">Get started with Flossly to streamline your clinic in minutes.</p>

          <v-form ref="form" @submit.prevent="openConfirmDialog">
            <label class="lbl">Full Name</label>
            <v-text-field
              v-model="signUpDetails.fullName"
              type="text"
              placeholder="John Doe"
              :rules="[
                (v) => !!v || 'Full name is required',
                (v) => (v && v.trim().length > 0) || 'Full name cannot be just spaces'
              ]"
              density="compact"
              variant="solo"
              single-line
              required
              class="mb-2 input-bordered"
              flat
            />

            <label class="lbl">Email</label>
            <v-text-field
              v-model="signUpDetails.email"
              type="email"
              placeholder="you@example.com"
              :rules="emailRules"
              density="compact"
              variant="solo"
              single-line
              required
              class="mb-2 input-bordered"
              flat
            />

            <label class="lbl">Password</label>
            <v-text-field
              v-model="signUpDetails.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="*************"
              :rules="passwordRules"
              required
              variant="solo"
              single-line
              density="compact"
              class="mb-2 input-bordered"
              :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
              @click:append-inner="togglePasswordVisibility"
              flat
            />

            <label class="lbl">Clinic Name</label>
            <v-text-field
              v-model="signUpDetails.organisationName"
              placeholder="Your Clinic Name"
              :rules="[(v) => !!v || 'Clinic name is required']"
              variant="solo"
              required
              single-line
              density="compact"
              class="mb-2 input-bordered"
              flat
            />

            <label class="lbl">Clinic Role</label>
            <v-select
              v-model="signUpDetails.roleId"
              :items="rolesList"
              placeholder="Select Role"
              variant="solo"
              required
              single-line
              item-title="title"
              item-value="id"
              density="compact"
              :rules="[(v) => !!v || 'Role is required']"
              class="mb-2 input-bordered select-bordered"
              flat
            />

            <div class="d-flex align-center mb-4">
              <v-checkbox
                v-model="agreeTerms"
                :rules="[(v) => !!v || 'You must agree to continue']"
                required
                hide-details
                class="mt-n1"
              />
              <div class="agreement-text">
                I agree to the
                <a href="/terms-of-service" target="_blank">Terms and Conditions</a>
              </div>
            </div>

            <v-btn
              type="submit"
              color="primary"
              block
              variant="flat"
              class="rounded-lg mb-4"
              height="48"
              :disabled="!isFormComplete"
            >
              Create My Flossly Account
            </v-btn>

            <div class="mt-4 text-body-2 text-center">
              <span style="color: #1e1e1e">Have an account?</span>
              <v-btn
                class="pa-0 ma-0"
                min-width="0"
                height="auto"
                variant="text"
                color="#0061FB"
                style="vertical-align: baseline; font-weight: 600"
                @click="goToLogin"
              >
                Sign in.
              </v-btn>
            </div>
          </v-form>

          <CommonConfirmDialog
            v-model="showConfirmDialog"
            title="Confirm Signup"
            message="Have you read the Terms and Conditions?"
            confirm-text="Yes"
            @confirm="confirmSignUp"
            @cancel="showConfirmDialog = false"
          />
        </template>

        <template v-else>
          <h2 class="welcome-heading text-center mb-4">Congratulations!</h2>
          <p class="welcome-sub text-center mb-6">
            You are successfully onboarded on Flossly! We have sent you a
            verification link. Please check your inbox and verify your email
            to get started.
          </p>
          <v-btn text flat color="primary" @click="goToLogin">Sign In</v-btn>
        </template>
      </div>
    </div>

    <!-- Right: Illustration + tagline (hidden on mobile) -->
    <div v-if="!smAndDown" class="right-panel d-flex flex-column align-center justify-center">
      <img
        src="/illustration.png"
        class="right-illustration"
        alt=""
      />
      <div class="right-text text-center px-10 mt-6">
        <h1 class="right-heading text-white mb-4">All-in-One CRM and Task Manager</h1>
        <p class="right-sub text-white">
          <strong>Get started with Flossly to streamline your clinic in minutes.</strong>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useDisplay } from "vuetify";
const { smAndDown } = useDisplay();

const signUpDetails = ref({
  email: "",
  password: "",
  fullName: "",
  organisationName: "",
  roleId: null,
});
const isSignedUp = ref(false);
const showConfirmDialog = ref(false);
const agreeTerms = ref(false);
const showPassword = ref(false);
const form = ref(null);
const router = useRouter();
const rolesList = ref([]);

const emailRules = [
  (v) => !!v || "Email is required",
  (v) => /.+@.+\..+/.test(v) || "E-mail must be valid",
];
const passwordRules = [
  (v) => !!v || "Password is required",
  (v) => v.length >= 6 || "Password must be at least 6 characters",
];

const authStore = useAuthStore();
const mainStore = useMainStore();

onMounted(() => {
  mainStore
    .getRoles()
    .then((res) => {
      if (res.code === 0 && res.data) {
        rolesList.value = res.data.filter(
          (x) =>
            x.title === "Principal Dentist / Practice Owner" ||
            x.title === "Practice Manager"
        );
      }
    })
    .catch((err) => {
      return err;
    });
});

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

const confirmSignUp = async () => {
  showConfirmDialog.value = false;
  authStore
    .requestSignUp(signUpDetails.value)
    .then((res) => {
      if (res.code === 0) {
        isSignedUp.value = true;
        mainStore.setSnackbar({ title: "Verification Email Sent", type: "success" });
      } else {
        mainStore.setSnackbar({ title: res.data.message || res.message, type: "error" });
      }
    })
    .catch((err) => {
      mainStore.setSnackbar({
        title: err.data?.message || err.message || "An error occurred during signup",
        type: "error",
      });
    });
};

const isFormComplete = computed(() => {
  return (
    signUpDetails.value.fullName.trim() !== "" &&
    signUpDetails.value.email.trim() !== "" &&
    signUpDetails.value.password.trim() !== "" &&
    signUpDetails.value.organisationName.trim() !== "" &&
    signUpDetails.value.roleId !== null &&
    agreeTerms.value === true
  );
});

const openConfirmDialog = async () => {
  const formValidation = await form.value.validate();
  if (formValidation.valid) {
    showConfirmDialog.value = true;
  }
};

const goToLogin = () => {
  mainStore.setLoginSkipSplash(true);
  router.push("/login");
};
</script>

<style scoped>
.signup-page {
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

.signup-card-col {
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
  .signup-card-col {
    flex: 0 0 100%;
    max-width: 100%;
  }
}

.signup-card {
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(50px);
  -webkit-backdrop-filter: blur(50px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 15px;
  box-shadow: 0px 40px 40px 0px rgba(0, 0, 0, 0.2);
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.15) transparent;
}

.signup-card::-webkit-scrollbar {
  width: 4px;
}
.signup-card::-webkit-scrollbar-track {
  background: transparent;
}
.signup-card::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.15);
  border-radius: 4px;
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

.right-sub {
  font-size: 18px;
  line-height: 1.5;
  color: #fff;
  max-width: 560px;
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
  max-height: 44px;
  font-size: 14px;
}

.select-bordered :deep(.v-field__input) {
  min-height: 44px !important;
  max-height: 44px !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  display: flex !important;
  align-items: center !important;
}

.select-bordered :deep(input[placeholder]) {
  align-self: center !important;
  margin-top: 0 !important;
}

.select-bordered :deep(.v-select__selection-text),
.select-bordered :deep(.v-field__input input) {
  font-size: 14px;
  line-height: 44px;
}

.agreement-text {
  font-family: "Inter", sans-serif;
  font-weight: 400;
  font-size: 14px;
  color: #8b8b8b;
  line-height: 1.4;
}

.agreement-text a {
  color: #8b8b8b;
  text-decoration: underline;
}

.input-bordered :deep(.v-field__input) {
  display: flex !important;
  align-items: center !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  min-height: 44px !important;
}

.input-bordered :deep(.v-field__input input),
.input-bordered :deep(.v-field__input input::placeholder) {
  align-self: center;
  margin-top: 0 !important;
  line-height: normal;
}

.input-bordered :deep(.v-field__append-inner),
.input-bordered :deep(.v-field__prepend-inner) {
  align-self: center;
  padding-top: 0 !important;
}

.input-bordered
  :deep(.v-field--variant-solo.v-field--focused .v-field__overlay),
.input-bordered :deep(.v-field--variant-solo.v-field--dirty .v-field__overlay),
.input-bordered :deep(.v-field--variant-solo.v-field--active .v-field__overlay),
.input-bordered :deep(.v-field--selected .v-field__overlay) {
  background-color: rgba(38, 109, 240, 0.06) !important;
}

@media (max-width: 960px) {
  .signup-page {
    align-items: flex-start;
  }
}
</style>