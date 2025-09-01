<template>
     <div class="login-page">
    <v-container>
      <v-row>
        <v-col
          cols="12"
          md="5"
          class="d-flex align-center justify-center px-4 py-9"
        >
          <div class="background-image rounded-xl pa-10 relative">
            <img src="@/assets/logos/loginLogos/white-logo.svg" alt="My Logo" />
            <h1 class="mt-5 login-banner-heading">
              Setup credentials to keep your clinic running clean & clear.
            </h1>
            <!-- <img src="/assets/watermark/horizontal-wat-mrk.svg" alt="wat-mark" class="horizontal-wat-mark"> -->
          </div>
        </v-col>
        <v-col
          cols="12"
          md="7"
          class="d-flex align-center justify-center px-12"
        >
          <div style="width: 100%; max-width: 500px">
            <h2 class="text-center login-heading">Welcome Back!</h2>
            <h2
              class="mb-6 text-center login-sub-heading"
              style="color: #8b8b8b"
            >
              Let's create your credentials.
            </h2>
            <v-form ref="form" @submit.prevent="acceptInvite">
              <v-label>Full Name</v-label>
              <v-text-field
                v-model="credentials.fullName"
                density="comfortable"
                variant="outlined"
                :rules="nameRules"
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
              <v-btn
                type="submit"
                color="primary"
                block
                variant="flat"
                class="mt-5 rounded-lg"
              >
                Continue
              </v-btn>
            </v-form>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>
<script setup>

const credentials = ref({
    fullName: "",
    password: "",
    inviteToken: null
  });
  const showPassword = ref(false);
  const form = ref(null);
  const router = useRouter();
  const authStore = useAuthStore();
  const store = useMainStore();
  const loginError = ref(null);
  const route = useRoute();
  const nameRules = [
    (v) => !!v || "Name is required",
    // (v) => /.+@.+\..+/.test(v) || "Name must be valid",
  ];
  
  const passwordRules = [
    (v) => !!v || "Password is required",
    (v) => v.length >= 6 || "Password must be at least 6 characters",
  ];
  const togglePasswordVisibility = () => {
    showPassword.value = !showPassword.value;
  };

  onMounted(() => {
    const { token } = route.params
    credentials.value.inviteToken = token
  })
  
  const acceptInvite = async () => {
    const formValidation = await form.value.validate();
    if (formValidation.valid) {
      authStore
        .accpetInvite(credentials.value)
        .then((res) => {
          if (res.code === 0) {
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
          if (user.profileCompletion === 1 && (user.roleId === 1 || user.roleId === 8)) {
            router.push("/onboarding");
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
    font-family: "Poppins";
    font-weight: 600;
    font-size: 30px;
  }
  
  .login-page {
    height: 100vh;
    width: 100%;
  }
  .logoimg {
    width: 250px;
  }
  
  .background-image {
    background-image: url("/assets/images/loginBanner.svg");
    background-size: cover;
    width: 90%;
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
  /* .horizontal-wat-mark{
    position: absolute;
    bottom: 0;
    left: 0;
  } */
  </style>