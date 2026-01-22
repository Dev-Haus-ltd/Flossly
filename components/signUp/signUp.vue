<template>
  <div class="signup-page">
    <v-row>
      <v-col cols="12" md="6" class="d-flex align-center justify-center px-12">
        <div class="form-scroll" style="width: 100%; max-width: 500px">
          <template v-if="!isSignedUp">
            <h2 class="text-center login-heading">Sign Up</h2>
            <h2
              class="mb-6 text-center login-sub-heading"
              style="color: #8b8b8b"
            >
              Get started with Flossly to streamline your clinic in minutes.
            </h2>
            <v-form ref="form" @submit.prevent="openConfirmDialog">
              <label class="lbl">Full Name</label>
              <v-text-field
                v-model="signUpDetails.fullName"
                label="Full Name"
                single-line
                density="comfortable"
                :rules="[
                  (v) => !!v || 'Full name is required',
                  (v) => (v && v.trim().length > 0) || 'Full name cannot be just spaces'
                ]"
                variant="solo"
                required
                class="mb-2 input-bordered"
                flat
              />
              <label class="lbl">Email</label>
              <v-text-field
                v-model="signUpDetails.email"
                label="Email"
                type="email"
                single-line
                density="comfortable"
                :rules="emailRules"
                variant="solo"
                required
                class="mb-2 input-bordered"
                flat
              />
              <label class="lbl">Password</label>
              <v-text-field
                v-model="signUpDetails.password"
                label="Password"
                :type="showPassword ? 'text' : 'password'"
                :rules="passwordRules"
                required
                variant="solo"
                single-line
                density="comfortable"
                class="mb-2 input-bordered"
                :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append-inner="togglePasswordVisibility"
                flat
              />
              <label class="lbl">Clinic Name</label>
              <v-text-field
                v-model="signUpDetails.organisationName"
                label="Clinic Name"
                :rules="[(v) => !!v || 'Clinic name is required']"
                variant="solo"
                required
                single-line
                density="comfortable"
                class="mb-2 input-bordered"
                flat
              />
              <label class="lbl">Clinic Role</label>
              <v-select
                v-model="signUpDetails.roleId"
                :items="rolesList"
                label="Clinic Role"
                variant="solo"
                required
                title="Select Role"
                single-line
                item-title="title"
                item-value="id"
                density="comfortable"
                :rules="[(v) => !!v || 'Role is required']"
                class="input-bordered"
                flat
              />
              <div class="d-flex align-center">
                <v-checkbox
                  v-model="agreeTerms"
                  :rules="[(v) => !!v || 'You must agree to continue']"
                  required
                  hide-details
                  class="mt-n1"
                />
                <div class="agreement-text">
                  I agree to the 
                  <a href="/terms-of-use" target="_blank">Terms and Conditions</a>
                </div>
              </div>

              <v-btn
                type="submit"
                color="primary"
                block
                variant="flat"
                class="mt-5 rounded-lg"
                height="48"
                :disabled="!isFormComplete"
              >
                Create My Flossly Account
              </v-btn>
              <div class="mt-5 text-body-2 text-center" style="height: 48px">
                Have an account?
                <v-btn
                  class="pa-0 ma-0 v-btn--plain"
                  min-width="0"
                  height="auto"
                  variant="text"
                  style="vertical-align: baseline"
                  color="primary"
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
            <h1>Congratulations!</h1>
            <br />
            <p style="max-width: 100%; line-height: 1.5;">
              You are successfully onboarded on Flossly! We have sent you a
              verification link. Please check your inbox and verify your email
              to get started.
            </p>
            <br />
            <v-btn text flat color="primary" @click="goToLogin">Sign In</v-btn>
          </template>
        </div>
      </v-col>
      <v-col v-if="!smAndDown" cols="12" md="6" class="d-flex align-center justify-center pa-0">
        <div class="px-4 w-100">
          <div
            class="background-image relative d-flex align-center justify-center"
          >
            <div class="overlay-box pa-8">
              <img
                src="@/assets/logos/loginLogos/white-logo.svg"
                alt="My Logo"
                class="mb-6"
                style="max-width: 180px"
              />
              <h1
                style="
                  font-family: 'Garnett';
                  font-weight: 600;
                  font-size: 44px;
                  color: #fff;
                  margin-bottom: 16px;
                  text-align: left;
                "
              >
                All-in-One CRM and Task Manager
              </h1>
              <p
                style="
                  font-size: 18px;
                  line-height: 1.5;
                  color: #fff;
                  text-align: left;
                  max-width: 600px;
                "
              >
                <strong>
                  Get started with Flossly to streamline your clinic in
                  minutes.</strong
                >
              </p>
            </div>
          </div>
        </div>
      </v-col>
    </v-row>

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
        mainStore.setSnackbar({
          title: "Verification Email Sent",
          type: "success",
        });
      } else {
        mainStore.setSnackbar({
          title: res.data.message || res.message,
          type: "error",
        });
      }
    })
    .catch((err) => {
      const errorMessage =
        err.data?.message || err.message || "An error occurred during signup";
      mainStore.setSnackbar({
        title: errorMessage,
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
  height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  background-color: white;
}

.signup-page :deep(.v-row) {
  height: 100%;
}

.form-scroll {
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  padding-top: 24px;
  padding-bottom: 24px;
}

.form-scroll::-webkit-scrollbar {
  width: 6px;
}

.form-scroll::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.form-scroll::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.form-scroll::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.overlay-box {
  border: 1px solid #fff;
  background-color: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  max-width: 530px;
  width: 100%;
  text-align: left;
  border-radius: 15px;
}

.background-image {
  background-image: url("/assets/images/loginBanner.svg");
  background-size: cover;
  width: 100%;
  height: 99vh;
  border-radius: 12px;
}

.login-heading {
  font-family: "Garnett";
  font-weight: 600;
  font-size: 44px;
}
.login-sub-heading {
  font-family: "Inter";
  font-weight: 400;
  font-size: 16px;
}
.lbl {
  font-family: "Inter";
  font-weight: 400;
  font-style: "Regular";
  font-size: 16px;
  color: #1e1e1e;
}

.agreement-text {
  font-family: "Inter";
  font-weight: 400;
  font-style: normal;
  font-size: 14px;
  color: #8b8b8b;
}

.agreement-text a {
  color: #8b8b8b;
  text-decoration: underline;
}
.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
}

/* Vertically center input text, selections and icons across all fields */
.input-bordered :deep(.v-field__input) {
  align-items: center;
  padding-top: 0;
  padding-bottom: 0;
}
.input-bordered :deep(.v-field__append-inner),
.input-bordered :deep(.v-field__prepend-inner) {
  align-self: center;
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
  .form-scroll {
    max-height: none;
    overflow: visible;
    padding-top: 16px;
    padding-bottom: 32px;
  }
}
</style>
