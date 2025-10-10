<template>
  <div class="init-page bg-secondary" v-if="initialPage">
    <div class="water-mark"></div>
    <div class="init-pg-content">
      <div class="text-center">
        <img
          src="@/assets/logos/loginLogos/logoWithTitle.svg"
          class="mx-auto h-20 w-20 mb-5"
          alt=""
        />

        <v-btn
          class="d-block mx-auto"
          @click="initialPage = false"
          color="secondary-dark"
          flat
          >Sign-in</v-btn
        >
        <h2 class="mt-5">
          Threading clarity into your dental practice with smart workflows and
          clean operations.
        </h2>
      </div>
    </div>
  </div>
  <div class="login-page" v-else>
    <v-row>
      <v-col cols="12" md="6" class="d-flex align-center justify-center px-12">
        <div style="width: 100%; max-width: 500px">
          <h2 class="text-center login-heading">Welcome Back!</h2>
          <h2 class="mb-6 text-center login-sub-heading" style="color: #8b8b8b">
            Let's get signed in securely.
          </h2>
          <v-form ref="form" @submit.prevent="login">
            <label class="lbl">Email</label>
            <v-text-field
              v-model="credentials.email"
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
            <label class="lbl">Password</label>

            <v-text-field
              v-model="credentials.password"
              label="Password"
              :type="showPassword ? 'text' : 'password'"
              :rules="passwordRules"
              required
              variant="solo"
              single-line
              density="comfortable"
              class="input-bordered"
              :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
              @click:append-inner="togglePasswordVisibility"
              flat
            />
            <p v-if="loginError" style="color: red" class="pb-2">
              {{ loginError }}
            </p>
            <div class="d-flex justify-end align-center">
              <v-btn
                color="#266DF0"
                variant="text"
                class="pa-0"
                height="20"
                min-width="0"
                @click="forgetPass"
              >
                Forgot Password
              </v-btn>
            </div>
            <v-btn
              type="submit"
              color="primary"
              block
              variant="flat"
              class="mt-5 rounded-lg"
              height="48"
            >
              Log In & Tidy Up
            </v-btn>
            <div class="agreement-text mt-5">
              By signing up you agree to Flossly&nbsp;
              <a href="/privacy-policy" target="_blank">Terms</a>,&nbsp;
              <a href="/privacy-policy" target="_blank">Privacy Policy</a
              >&nbsp;and&nbsp;
              <a href="/privacy-policy" target="_blank">Security Policy</a>.
            </div>
            <div class="mt-5 text-body-2 text-center" style="height: 48px">
              Don't have an account?
              <v-btn
                class="pa-0 ma-0 v-btn--plain"
                min-width="0"
                height="auto"
                variant="text"
                color="#266DF0"
                style="vertical-align: baseline"
                @click="goToSignup"
              >
                Sign up now.
              </v-btn>
            </div>
          </v-form>
        </div>
      </v-col>
      <v-col cols="12" md="6" class="d-flex align-center justify-center pa-0">
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
                All-in-One CRM and Task Manager
              </h1>

              <!-- Subheading -->
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
                  Automate patient flows, manage staff, and track clinic
                  performance</strong
                >
                with the only dental-specific platform you'll ever need.
              </p>
            </div>
          </div>
        </div>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
const { setUser } = useUser()
const initialPage = ref(true);
const credentials = ref({
  email: "",
  password: "",
});
const showPassword = ref(false);
const form = ref(null);
const router = useRouter();
const authStore = useAuthStore();
const store = useMainStore();
const loginError = ref(null);
const emailRules = [
  (v) => !!v || "Email is required",
  (v) => /.+@.+\..+/.test(v) || "E-mail must be valid",
];

const passwordRules = [
  (v) => !!v || "Password is required",
  (v) => v.length >= 6 || "Password must be at least 6 characters",
];
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

onMounted(() => {
  if (store.loginSkipSplash) {
    initialPage.value = false;
    // clear the flag so direct visits still show splash later
    store.setLoginSkipSplash(false);
  }
});

const login = async () => {
  const formValidation = await form.value.validate();
  if (formValidation.valid) {
    authStore
      .login(credentials.value)
      .then((res) => {
        if (res.code === 0) {
          getProfile();
        } else {
          store.setSnackbar({
            title: res.data.message || res.message,
            type: "error",
          });
          loginError.value = res.data.message;
        }
      })
      .catch((err) => {
        store.setSnackbar({
          title: err.message,
          type: "error",
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
        setUser(user)
        localStorage.setItem("user", JSON.stringify(user));
        store.setSnackbar({
          title: "Login Successful",
          subtitle: `Welcome back, ${user.fullName}!`,
          type: "success",
        });
        if (
          (user.roleId === 8 || user.roleId === 1) &&
          user.profileCompletion <= 1
        ) {
          router.push("/onboarding");
        } else {
          router.push("/");
        }
      } else {
        store.setSnackbar({
          title: res.data.message || res.message,
          type: "error",
        });
        loginError.value = res.data.message;
      }
    })
    .catch((err) => {
      store.setSnackbar({
        title: err.message,
        type: "error",
      });
    });
};
const goToSignup = () => {
  router.push("/signup");
};
const forgetPass = () => {
  router.push("/forgetpassword");
};
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
.login-page .v-container {
  max-width: 100% !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
}
.water-mark {
  background-image: url("/assets/logos/loginLogos/watermark.svg");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  height: 100vh;
  width: 100%;
  opacity: 0.3;
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

.login-page {
  height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  background-color: white;
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
  text-align: center;
  color: #8b8b8b;
  width: 70%;
  margin: auto;
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
</style>
