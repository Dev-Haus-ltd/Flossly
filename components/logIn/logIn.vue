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
    <v-container>
      <v-row>
        <v-col
          cols="12"
          md="6"
          class="d-flex align-center justify-center px-12"
        >
          <div style="width: 100%; max-width: 500px">
            <h2 class="text-center login-heading">Welcome Back!</h2>
            <h2
              class="mb-6 text-center login-sub-heading"
              style="color: #8b8b8b"
            >
              Let's get signed in securely.
            </h2>
            <v-form ref="form" @submit.prevent="login">
              <v-label>Email</v-label>
              <v-text-field
                v-model="credentials.email"
                label="Email"
                type="email"
                :rules="emailRules"
                density="comfortable"
                variant="outlined"
                single-line
                required
                class="mb-2"
              />
              <v-label>Password</v-label>
              <v-text-field
                v-model="credentials.password"
                label="Password"
                :type="showPassword ? 'text' : 'password'"
                :rules="passwordRules"
                required
                variant="outlined"
                single-line
                density="comfortable"
                :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append-inner="togglePasswordVisibility"
              />
              <p v-if="loginError" style="color: red" class="pb-2">
                {{ loginError }}
              </p>
              <div class="d-flex justify-space-between align-center " style="height: 48px;">
                <v-row align="center" class="py-0" style="height:48px;" no-gutters>
                  <v-col cols="auto" class="pa-0 text-right">
                    <v-switch
                      label="Remember me"
                      color="#266DF0"
                      density="compact"
                      inset
                      hide-details
                    />
                  </v-col>

                  <!-- This will expand and push the next col to the far right -->
                  <v-spacer />

                  <v-col cols="auto">
                    <v-btn
                      color="#266DF0"
                      variant="text"
                      class="pa-0"
                      min-width="0"
                      @click="forgetPass"
                    >
                      Forgot Password
                    </v-btn>
                  </v-col>
                </v-row>
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
              <div class="mt-5 text-body-2 text-center " style="height: 48px;">
                Don't have an account?
                <v-btn class="pa-0 ma-0 v-btn--plain" min-width="0" height="auto" variant="text" color="#266DF0" style="vertical-align: baseline;" @click="goToSignup">
                  Sign up now.
                </v-btn>
              </div>
            </v-form>
          </div>
        </v-col>
        <v-col
          cols="12"
          md="6"
          class="d-flex align-center justify-center px-4"
        >
        <div class="background-image rounded-xl pa-10 relative d-flex align-center justify-center">
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
        font-family: 'Garnett Semibold';
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
    <strong> Automate patient flows, manage staff, and track clinic performance</strong>
      with the only dental-specific platform you'll ever need.
    </p>
  </div>
</div>

        </v-col>
     
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
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
  max-width: 500px;
  width: 100%;
  text-align: left;
  border-radius: 15px;
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
  width: 80%;
  height: 90vh;
}
.login-heading {
  font-weight: 600;
  font-size: 50px;
}
.login-sub-heading {
  font-weight: 400;
  font-size: 16px;
}


</style>
