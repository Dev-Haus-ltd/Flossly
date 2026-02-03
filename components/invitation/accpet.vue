<template>
  <div class="login-page">
    <v-row>
      <v-col cols="12" md="6" class="d-flex align-center justify-center px-12">
        <div style="width: 100%; max-width: 500px">
          <h2 class="text-center login-heading">Welcome to Flossly</h2>
          <h2 class="mb-6 text-center login-sub-heading" style="color: #8b8b8b">
            Let's create your credentials.
          </h2>
          <v-form ref="form" @submit.prevent="acceptInvite">
            <label class="lbl">Full Name</label>
            <v-text-field
              v-model="credentials.fullName"
              density="comfortable"
              variant="solo"
              :rules="nameRules"
              single-line
              required
              class="mb-2 input-bordered"
              flat
            />
            <label class="lbl">Password</label>
            <v-text-field
              v-model="credentials.password"
              :type="showPassword ? 'text' : 'password'"
              :rules="passwordRules"
              required
              variant="solo"
              single-line
              class="input-bordered"
              density="comfortable"
              :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
              @click:append-inner="togglePasswordVisibility"
              flat
            />
            <label class="lbl">Confirm Password</label>
            <v-text-field
              ref="confirmPasswordRef"
              v-model="credentials.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              :rules="confirmPasswordRules"
              required
              variant="solo"
              single-line
              class="input-bordered"
              density="comfortable"
              :append-inner-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
              @click:append-inner="toggleConfirmPasswordVisibility"
              flat
            />
            <p v-if="loginError" style="color: red" class="pb-2">
              {{ loginError }}
            </p>
            <v-btn
              type="submit"
              color="primary"
              block
              height="48"
              variant="flat"
              class="mt-5 rounded-lg"
            >
              Continue
            </v-btn>
          </v-form>
        </div>
      </v-col>
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
                  font-size: 44px;
                  color: #fff;
                  margin-bottom: 16px;
                  text-align: left;
                "
              >
                Setup credentials to keep your clinic running clean & clear.
              </h1>
            </div>
          </div>
        </div>
      </v-col>
    </v-row>
  </div>
</template>
<script setup>
import { useDisplay } from 'vuetify';

const { mdAndUp } = useDisplay();
const credentials = ref({
  fullName: "",
  password: "",
  inviteToken: null,
});
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const confirmPasswordRef = ref(null);
const form = ref(null);
const router = useRouter();
const authStore = useAuthStore();
const store = useMainStore();
const userStore = useUserStore();
const loginError = ref(null);
const route = useRoute();
const nameRules = [
  (v) => !!v || "Name is required",
  (v) => (v && v.trim().length > 0) || "Name cannot be just spaces",
  // (v) => /.+@.+\..+/.test(v) || "Name must be valid",
];

const passwordRules = [
  (v) => !!v || "Password is required",
  (v) => v.length >= 6 || "Password must be at least 6 characters",
];
const confirmPasswordRules = [
  (v) => !!v || "Confirm password is required",
  (v) => v.length >= 6 || "Password must be at least 6 characters",
  (v) => v === credentials.value.password || "Passwords do not match",
];
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};
const toggleConfirmPasswordVisibility = () => {
  showConfirmPassword.value = !showConfirmPassword.value;
};

onMounted(() => {
  const { token } = route.params;
  credentials.value.inviteToken = token;
});

const acceptInvite = async () => {
  const formValidation = await form.value.validate();
  if (formValidation.valid) {
    authStore
      .accpetInvite(credentials.value)
      .then((res) => {
        if (res.code === 0) {
          // Reset the user cache to ensure the new active user appears in task assignment
          userStore.resetUsers();
          getProfile();
        } else {
          loginError.value = res.data.message;
        }
      })
      .catch((err) => {
        store.setSnackbar({
          title: err.message,
          type: "Error",
        });
      });
  }
};

const getProfile = () => {
  authStore
    .profile()
    .then((res) => {
      if (res.code === 0) {
        const user = res.data;
        localStorage.setItem("user", JSON.stringify(user));
        if (
          user.profileCompletion === 1 &&
          (user.roleId === 1 || user.roleId === 8) &&
          user.isOrganisationCreator
        ) {
          // Force a full page refresh when redirecting to onboarding
          window.location.href = "/onboarding";
        } else {
          router.push("/");
        }
      } else {
        loginError.value = res.data.message;
      }
    })
    .catch((err) => {
      store.setSnackbar({
        title: err.message,
        type: "Error",
      });
    });
};

watch(
  () => credentials.value.password,
  () => {
    if (credentials.value.confirmPassword) {
      confirmPasswordRef.value?.validate();
    }
  }
);

</script>

<style scoped>
.init-page {
  position: relative;
}
.init-pg-content {
  margin: 0;
  position: absolute;
  top: 50%;
  left: 50%;
  -ms-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
  max-width: 700px;
}
.water-mark {
  background-image: url("/assets/logos/loginLogos/watermark.svg");
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  height: 100vh;
  width: 100%;
  opacity: 0.3;
}
.login-banner-heading {
  color: #fff;
  font-family: "Garnett";
  font-weight: 600;
  font-size: 30px;
}

.login-page {
  height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
}
.logoimg {
  width: 250px;
}

.background-image {
  background-image: url("/assets/images/loginBanner.svg");
  background-size: cover;
  width: 100%;
  height: 99vh;
  border-radius: 12px;
}
.login-heading {
  font-family: "Garnet";
  font-weight: 600;
  font-size: 50px;
}
.login-sub-heading {
  font-weight: 400;
  font-size: 16px;
}
/* .horizontal-wat-mark{
    position: absolute;
    bottom: 0;
    left: 0;
  } */
.lbl {
  font-family: "Inter";
  font-weight: 400;
  font-style: "Regular";
  font-size: 16px;
  color: #1e1e1e;
}
.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
  
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
</style>
