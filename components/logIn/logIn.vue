<template>
  <div class="login-page">
    <!-- Full-screen gradient background -->
    <div class="gradient-bg" />
    <!-- Grid overlay -->
    <img src="/grids.svg" class="grid-overlay" aria-hidden="true" />

    <!-- Left: Floating glass login card -->
    <div class="login-card-col d-flex align-center justify-center">
      <div class="d-flex flex-column align-center" style="width: 100%; max-width: 480px;">
        <img src="/white-logo.svg" alt="FlosslyOS" class="page-logo mb-6" />
      <div class="login-card pa-10" style="width: 100%">
        <h2 class="welcome-heading text-center mb-2">Welcome Back!</h2>
        <p class="welcome-sub text-center mb-6">Let's get signed in securely.</p>

        <v-form ref="form" @submit.prevent="login">
          <label class="lbl">Email</label>
          <v-text-field
            v-model="credentials.email"
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

          <label class="lbl">Password</label>
          <v-text-field
            v-model="credentials.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="*************"
            :rules="passwordRules"
            required
            variant="solo"
            single-line
            density="comfortable"
            class="mb-1 input-bordered"
            :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
            @click:append-inner="togglePasswordVisibility"
            flat
          />

          <!-- Email not verified error -->
          <div
            v-if="showResendButton"
            class="error-box pa-3 mb-4"
          >
            <p class="mb-2" style="color: #856404">{{ loginError }}</p>
            <v-btn
              @click="resendVerificationEmail"
              variant="outlined"
              size="small"
              color="primary"
            >
              Resend Verification Email
            </v-btn>
          </div>

          <!-- Forgot password -->
          <div class="d-flex justify-end mb-4">
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

          <!-- Login button -->
          <v-btn
            type="submit"
            color="primary"
            block
            variant="flat"
            class="rounded-lg mb-4"
            height="48"
          >
            Log In &amp; Tidy Up
          </v-btn>

          <!-- Terms -->
          <div class="agreement-text">
            By signing up you agree to Flossly&nbsp;
            <a href="/terms-of-service" target="_blank">Terms</a>,&nbsp;
            <a href="/privacy-policy" target="_blank">Privacy Policy</a>&nbsp;and&nbsp;
            <a href="/security-policy" target="_blank">Security Policy</a>.
          </div>

          <!-- Sign up link -->
          <div class="mt-4 text-body-2 text-center">
            <span style="color: #1e1e1e">Don't have an account?</span>
            <v-btn
              class="pa-0 ma-0"
              min-width="0"
              height="auto"
              variant="text"
              color="#0061FB"
              style="vertical-align: baseline; font-weight: 600"
              @click="goToSignup"
            >
              Sign up now.
            </v-btn>
          </div>
        </v-form>
      </div>
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
          <strong>Automate patient flows, manage staff, and track clinic performance</strong>
          with the only dental-specific platform you'll ever need.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
const { setUser } = useUser()
import { useDisplay } from "vuetify";
const { smAndDown } = useDisplay();

const credentials = ref({ email: "", password: "" });
const showPassword = ref(false);
const form = ref(null);
const router = useRouter();
const authStore = useAuthStore();
const store = useMainStore();
const loginError = ref(null);
const showResendButton = ref(false);

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
    loginError.value = null;
    showResendButton.value = false;
    credentials.value.email = credentials.value.email.trim();
    authStore
      .login(credentials.value)
      .then((res) => {
        if (res.code === 0) {
          getProfile();
        } else {
          const errorMessage = res.data?.message || res.message || "Login failed";
          loginError.value = errorMessage;
          if (errorMessage.toLowerCase().includes("email not verified")) {
            showResendButton.value = true;
          }
          store.setSnackbar({ title: errorMessage, type: "error" });
        }
      })
      .catch((err) => {
        const errorMessage = err.data?.message || err.message || "Login failed";
        loginError.value = errorMessage;
        if (errorMessage.toLowerCase().includes("email not verified")) {
          showResendButton.value = true;
        }
        store.setSnackbar({ title: errorMessage, type: "error" });
      });
  }
};

const getProfile = () => {
  authStore
    .profile()
    .then((res) => {
      if (res.code === 0) {
        const user = res.data;
        setUser(user);
        localStorage.setItem("user", JSON.stringify(user));
        if (process.client) {
          window.dispatchEvent(new Event("user-authenticated"));
        }
        store.setSnackbar({
          title: "Login Successful",
          subtitle: `Welcome back, ${user.fullName}!`,
          type: "success",
        });
        const preference = Array.isArray(user.preferences)
          ? user.preferences[0]
          : user.preferences || null;
        const hasStartedSetup = Number(preference?.setupStepsCompleted || 0) > 0;
        if (
          (user.roleId === 8 || user.roleId === 1) &&
          user.profileCompletion <= 1 &&
          user.isOrganisationCreator &&
          !hasStartedSetup
        ) {
          window.location.href = "/onboarding";
        } else {
          router.push("/");
        }
      } else {
        store.setSnackbar({ title: res.data.message || res.message, type: "error" });
        loginError.value = res.data.message;
      }
    })
    .catch((err) => {
      store.setSnackbar({ title: err.message, type: "error" });
    });
};

const goToSignup = () => router.push("/signup");
const forgetPass = () => router.push("/forgetpassword");
const resendVerificationEmail = async () => {
  showResendButton.value = false;
  authStore
    .resendVerificationEmail({ email: credentials.value.email })
    .then((res) => {
      if (res.code === 0) {
        store.setSnackbar({
          title: "Verification email sent successfully!",
          subtitle: "Please check your inbox and verify your email.",
          type: "success",
        });
        loginError.value = null;
      } else {
        store.setSnackbar({
          title: res.data?.message || res.message || "Failed to send verification email",
          type: "error",
        });
        showResendButton.value = true;
      }
    })
    .catch((err) => {
      store.setSnackbar({
        title: err.data?.message || err.message || "Failed to send verification email",
        type: "error",
      });
      showResendButton.value = true;
    });
};
</script>

<style scoped>
/* ── Layout ─────────────────────────────────────────────────── */
.login-page {
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  width: 100%;
  display: flex;
  align-items: stretch;
  overflow: hidden;
}

/* Grid overlay — sits on top of gradient, behind all content */
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

/* Full-screen gradient — sits behind everything */
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

/* ── Left column ────────────────────────────────────────────── */
.login-card-col {
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
  .login-card-col {
    flex: 0 0 100%;
    max-width: 100%;
  }
}

/* Glass card */
.login-card {
  width: 100%;
  max-width: 480px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(50px);
  -webkit-backdrop-filter: blur(50px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 15px;
  box-shadow: 0px 40px 40px 0px rgba(0, 0, 0, 0.2);
}

/* ── Right column ────────────────────────────────────────────── */
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

/* ── Page logo above card ───────────────────────────────────── */
.page-logo {
  height: 32px;
  width: auto;
}

/* ── Typography ─────────────────────────────────────────────── */
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

/* ── Inputs ─────────────────────────────────────────────────── */
.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 44px;
  font-size: 14px;
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

/* ── OR divider ─────────────────────────────────────────────── */
.or-divider {
  width: 100%;
}

.divider-line {
  flex: 1;
  height: 1px;
  background-color: #bdbdbd;
}

.or-text {
  font-family: "Inter", sans-serif;
  font-size: 16px;
  color: #000;
  white-space: nowrap;
}

/* ── Error box ──────────────────────────────────────────────── */
.error-box {
  background-color: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 8px;
}

/* ── Agreement text ─────────────────────────────────────────── */
.agreement-text {
  font-family: "Inter", sans-serif;
  font-weight: 400;
  font-size: 14px;
  text-align: center;
  color: #8b8b8b;
  width: 80%;
  margin: 0 auto;
  line-height: 1.4;
}

.agreement-text a {
  color: #8b8b8b;
  text-decoration: underline;
}
</style>
