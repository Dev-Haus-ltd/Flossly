<template>
  <div class="login-page">
    <v-row>
      <v-col cols="12" md="6" class="d-flex align-center justify-center px-12">
        <div style="width: 100%; max-width: 500px">
          <img
            src="@/assets/logos/loginLogos/logoWithTitle_1.svg"
            class="d-block mx-auto w-1/3 max-w-[220px] h-auto mb-6"
            :style="{
              width: smAndDown ? '70%' : mdAndUp && !lgAndUp ? '50%' : '33.33%',
              maxWidth: smAndDown ? '280px' : mdAndUp && !lgAndUp ? '250px' : '220px'
            }"
            alt=""
          />
          <h2 class="text-center login-heading">Organization Invitation</h2>
          <h2 class="mb-6 text-center login-sub-heading" style="color: #8b8b8b">
            <span v-if="loading">Loading invitation details...</span>
            <span v-else-if="invitationData && !isProcessed">You've been invited to join a team</span>
            <span v-else-if="invitationData && isProcessed">Invitation processed</span>
            <span v-else>Invalid invitation</span>
          </h2>

          <div v-if="!loading && invitationData">
            <v-alert
              v-if="error"
              type="error"
              class="mb-4"
              closable
              @click:close="error = null"
            >
              {{ error }}
            </v-alert>

            <div v-if="!isProcessed" class="invitation-details">
              <div class="mb-6 pa-4" style="background-color: #f5f5f5; border-radius: 8px;">
                <p class="mb-2 text-body-1">
                  You have been invited to join
                </p>
                <p class="mb-4 text-h6 text-primary">
                  <strong>{{ invitationData.orgName }}</strong>
                </p>
                <p class="text-body-2 text-grey">
                  Invited by: <strong>{{ invitationData.inviterName }}</strong>
                </p>
              </div>

              <div class="d-flex flex-column" style="gap: 12px;">
                <v-btn
                  color="success"
                  size="large"
                  block
                  variant="flat"
                  class="rounded-lg"
                  height="48"
                  @click="acceptInvitation"
                  :loading="accepting"
                  :disabled="declining || accepting"
                >
                  <span v-if="!accepting">Accept Invitation</span>
                  <span v-else>Accepting...</span>
                </v-btn>

                <v-btn
                  color="error"
                  variant="outlined"
                  size="large"
                  block
                  class="rounded-lg"
                  height="48"
                  @click="declineInvitation"
                  :loading="declining"
                  :disabled="accepting || declining"
                >
                  <span v-if="!declining">Decline Invitation</span>
                  <span v-else>Declining...</span>
                </v-btn>
              </div>
            </div>

            <div v-else class="text-center">
              <div v-if="invitationData.status === 'accepted'" class="mb-6">
                <p class="text-h6 mb-2" style="color: #213536;">Invitation accepted successfully!</p>
                <p class="text-body-1" style="color: #8b8b8b;">Login through Flossly to Get Started</p>
              </div>
              <div v-else class="mb-6">
                <p class="text-h6 mb-2" style="color: #213536;">Invitation declined.</p>
              </div>

              <v-btn
                color="primary"
                variant="flat"
                block
                size="large"
                class="rounded-lg"
                height="48"
                @click="goToLogin"
              >
                Go to Login
              </v-btn>
            </div>
          </div>

          <div v-else-if="!loading && !invitationData" class="text-center">
            <v-alert type="error" class="mb-4">
              Invalid or expired invitation link.
            </v-alert>
            <v-btn
              color="primary"
              variant="flat"
              block
              size="large"
              class="rounded-lg"
              height="48"
              @click="goToLogin"
            >
              Go to Login
            </v-btn>
          </div>
        </div>
      </v-col>
      <v-col v-if="!smAndDown" cols="12" md="6" class="d-flex align-center justify-center pa-0">
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
                Join Your Team on Flossly
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
                  Accept the invitation to collaborate with your team</strong
                >
                and start managing your dental practice efficiently.
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
const { smAndDown, mdAndUp, lgAndUp } = useDisplay();

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const mainStore = useMainStore();
const { setUser } = useUser();
const { token } = route.params;

const loading = ref(true);
const accepting = ref(false);
const declining = ref(false);
const error = ref(null);
const invitationData = ref(null);
const isProcessed = ref(false);

// Verify token and get invitation details
const verifyToken = async () => {
  try {
    loading.value = true;
    const response = await authStore.verifyInvitationToken({ token });

    if (response.code === 0) {
      invitationData.value = response.data;
      isProcessed.value = response.data.status !== 'pending';
    } else {
      error.value = response.message || 'Invalid invitation token';
    }
  } catch (err) {
    error.value = err.message || 'Failed to verify invitation';
  } finally {
    loading.value = false;
  }
};

// Get user profile after login
const getProfile = () => {
  authStore
    .profile()
    .then((res) => {
      if (res.code === 0) {
        const user = res.data;
        setUser(user);
        localStorage.setItem("user", JSON.stringify(user));
        mainStore.setSnackbar({
          type: 'success',
          title: 'Invitation accepted successfully!',
          subtitle: `Welcome, ${user.fullName}!`,
        });
        // Redirect based on profile completion
        if (
          (user.roleId === 8 || user.roleId === 1) &&
          user.profileCompletion <= 1 &&
          user.isOrganisationCreator
        ) {
          // Force a full page refresh when redirecting to onboarding
          window.location.href = "/onboarding";
        } else {
          router.push("/");
        }
      } else {
        error.value = res.data?.message || res.message || 'Failed to load user profile';
        mainStore.setSnackbar({
          type: 'error',
          title: res.data?.message || res.message || 'Failed to load user profile',
        });
      }
    })
    .catch((err) => {
      error.value = err.message || 'Failed to load user profile';
      mainStore.setSnackbar({
        type: 'error',
        title: err.message || 'Failed to load user profile',
      });
    });
};

// Accept invitation
const acceptInvitation = async () => {
  try {
    accepting.value = true;
    error.value = null;

    const response = await authStore.acceptOrganisationInvitation({
      token,
    });

    if (response.code === 0) {
      const responseData = response.data;
      
      // Check if auto-login is enabled (user was logged out)
      if (responseData?.autoLogin === true) {
        // Token is already set as cookie by backend, just fetch profile
        getProfile();
        return; // Don't set isProcessed here, let getProfile handle redirect
      } else {
        // User is already logged in, just show success message
        mainStore.setSnackbar({
          type: 'success',
          title: 'Invitation accepted successfully!',
        });
        isProcessed.value = true;
        invitationData.value = { ...invitationData.value, status: 'accepted' };
      }
    } else {
      error.value = response.message || 'Failed to accept invitation';
    }
  } catch (err) {
    error.value = err.message || 'An error occurred while accepting the invitation';
  } finally {
    accepting.value = false;
  }
};

// Decline invitation
const declineInvitation = async () => {
  try {
    declining.value = true;
    error.value = null;

    const response = await authStore.declineOrganisationInvitation({
      token,
    });

    if (response.code === 0) {
      mainStore.setSnackbar({
        type: 'info',
        title: 'Invitation declined',
      });
      isProcessed.value = true;
      invitationData.value = { ...invitationData.value, status: 'declined' };
    } else {
      error.value = response.message || 'Failed to decline invitation';
      declining.value = false; // Reset loading state on error
    }
  } catch (err) {
    error.value = err.message || 'An error occurred while declining the invitation';
    declining.value = false; // Reset loading state on error
  }
};

const goToLogin = () => {
  router.push('/login');
};

onMounted(() => {
  verifyToken();
});
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.invitation-details {
  text-align: center;
}

.background-image {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  width: 100%;
  position: relative;
}

.overlay-box {
  z-index: 1;
  text-align: left;
}

.login-heading {
  font-family: 'Garnett';
  font-weight: 600;
  font-size: 32px;
  color: #213536;
  margin-bottom: 8px;
}

.login-sub-heading {
  font-size: 16px;
  color: #8b8b8b;
  font-weight: 400;
}
</style>
