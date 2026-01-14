<template>
  <div
    :class="
      steps[step].key === 3
        ? 'form-container py-3 py-md-5 px-3 d-flex flex-column'
        : step === 1
        ? 'form-container py-3 py-md-5 px-3 d-flex flex-column align-start ml-0 ml-md-6 buttons-bottom'
        : 'form-container py-3 py-md-5 px-3 d-flex flex-column align-start ml-0 ml-md-6'
    "
  >
    <div class="form-content-wrapper">
      <h2 class="mb-3 mb-md-4 title">{{ steps[step].title }}</h2>
      <h2 class="mb-3 mb-md-4 sub-title">{{ steps[step].subTitle }}</h2>

      <!-- Dynamic Step Component -->
    <component
      :is="currentComponent"
      ref="stepComponent"
      v-model="stepModels[step]"
      :show-cta="step !== steps.length - 1"
      @back="handleBack"
    />
    </div>

    <!-- Navigation Buttons -->
    <div class="button-container">
      <v-btn
        color="grey-darken-1"
        variant="tonal"
        @click="handleBack"
        class="me-2 nav-button"
        height="48"
        width="100"
        rounded="lg" size="x-large"
        style="font-size: 16px;"
      >
        Back
      </v-btn>

      <v-btn 
        color="primary"
        variant="flat" 
        height="48"
        width="100"
        class="nav-button"
        @click="nextStep" 
        v-if="step < steps.length - 1"
        rounded="lg" size="x-large"
        style="font-size: 16px;"
      >
        Next
      </v-btn>

      <v-btn
        v-if="step === 1"
        color="grey-darken-1"
        variant="text"
        @click="step++"
        class="me-2 nav-button"
        height="48"
        width="100"
        rounded="lg" size="x-large"
        style="font-size: 16px;"
      >
      Skip for now
      </v-btn>

      <template v-if="step === steps.length - 1">
        <v-btn
          color="primary"
          @click="handlePricingCheckout"
          height="48"
          width="150"
          class="nav-button"
          rounded="lg"
          size="x-large"
          variant="flat"
          style="font-size: 16px;"
        >
          Buy Now
        </v-btn>
        <v-btn
          color="primary"
          variant="text"
          @click="navigateToDashboard"
          class="nav-button trial-link"
          height="48"
          rounded="lg"
        >
          Start your free trial
        </v-btn>
      </template>
    </div>
  </div>
</template>

<script setup>
import clinicSetup from "./clinicSetup.vue";
import AddTeamMembers from "./addTeamMembers.vue";
import Pricing from "./pricing.vue";

const orgStore = useOrgStore();
const authStore = useAuthStore();
const mainStore = useMainStore();
const userStore = useUserStore();
const router = useRouter();

// Define emit to send current step to parent
const emit = defineEmits(['update:currentStep', 'go-to-initial-screen']);

// Steps metadata
const step = ref(0);

// Watch step changes and emit to parent
watch(step, (newStep) => {
  emit('update:currentStep', newStep);
}, { immediate: true });
const steps = [
  {
    key: 1,
    title: "Quick Clinic Setup",
    subTitle:
      "Enter your clinic details to personalise your Flossly workspace.",
    component: clinicSetup,
  },
  {
    key: 2,
    title: "Add Team Members",
    subTitle:
      "Enhance your team's collaboration and efficiency by inviting new members to your Flossly workspace.",
    component: AddTeamMembers,
  },
  {
    key: 3,

    title: "",
    subTitle: "",
    component: Pricing,
  },
];

// Dynamically resolve current component
const currentComponent = computed(() => steps[step.value].component);
// Form refs & models
const stepComponent = ref();
const stepModels = ref([
  { name: "", logo: null, contact: "", address: "" }, // Clinic model  // removed , type: ""
  { users: [{ roleId: null, email: "" }] }, // Team model
  {}, // Pricing model
]);

const user = ref({});
const userOrgs = ref([]);

// Check if this is a new practice creation flow (from Add Practice in sidebar)
const isNewPractice = computed(() => orgStore.getIsNewPractice);

onMounted(() => {
  if (localStorage.getItem("user")) {
    user.value = JSON.parse(localStorage.getItem("user"));
    userOrgs.value = user.value.userOrganisations;
  }

  // For new practice flow, start with empty name (no org exists yet)
  if (isNewPractice.value) {
    stepModels.value[0].name = "";
  } else {
    // For existing org update flow, pre-fill with current org name
    const currentOrg = userOrgs.value.find(
      (x) => x.organisationId === user.value.currentLoggedInOrgId
    );
    stepModels.value[0].name = currentOrg?.organisation?.name || "";
  }
});

const nextStep = async () => {
  const component = stepComponent.value;
  if (component?.validate) {
    const isValid = await component.validate();
    if (!isValid) return;
  }
  if (step.value === 0) {
    const data = stepModels.value[0];
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("contact", data.contact);
    // formData.append("type", data.type);
    formData.append("address", data.address);
    formData.append("origin", "onboarding");
    if (data.logo) {
      formData.append("logo", data.logo, data.logo?.name);
    }

    // Determine which API to call based on whether this is a new practice creation
    const apiCall = isNewPractice.value
      ? orgStore.createOrganisationForUser(formData)
      : orgStore.updateOrganisation(formData);

    apiCall
      .then(async (res) => {
        if (res.code === 0) {
          const profileCompletion = useCookie("profileCompletion");
          profileCompletion.value = 50;

          // For new practice creation, switch to the new organization
          if (isNewPractice.value && res.data.organisationId) {
            const switchRes = await authStore.switchOrgnanisation({
              orgId: res.data.organisationId,
            });

            if (switchRes.code !== 0) {
              mainStore.setSnackbar({
                title: switchRes.message || "Failed to switch to new workspace",
                type: "Error",
              });
              return;
            }

            // Refresh profile to get updated org list
            await authStore.profile();

            // Reload user data from localStorage after profile refresh
            if (localStorage.getItem("user")) {
              user.value = JSON.parse(localStorage.getItem("user"));
              userOrgs.value = user.value.userOrganisations;
            }

            // Clear the new practice mode flag after successful creation and switch
            orgStore.clearNewPracticeMode();
          } else {
            // For update flow, just update the local org data
            user.value.userOrganisations.find(
              (x) => x.organisationId === user.value.currentLoggedInOrgId
            ).organisation = res.data;
            localStorage.setItem("user", JSON.stringify(user.value));
          }

          step.value++;
        } else {
          mainStore.setSnackbar({
            title: res.data?.message || res.message || "Failed to save clinic details",
            type: "Error",
          });
        }
      })
      .catch((err) => {
        let errorMessage = err.message;

        // Handle specific error cases for logo upload
        if (err.response?.status === 413) {
          errorMessage = "Logo image is too large. Please choose an image smaller than 5MB.";
        } else if (err.response?.status === 400) {
          errorMessage = "Invalid image format. Please upload a valid image file (JPG, PNG, GIF).";
        }

        mainStore.setSnackbar({
          title: errorMessage,
          type: "Error",
        });
      });
  } else if (step.value === 1) {
    const data = stepModels.value[1];
    data.origin = "onboarding";
    authStore
      .inviteMembers(data)
      .then((res) => {
        if (res.code === 0) {
          // Reset the user cache to ensure new invited users will be fetched when they become active
          userStore.resetUsers();
          step.value++;
        } else {
          // Extract error message from response
          const errorMessage = res?.data?.message || res?.message || "Failed to invite team members.";
          mainStore.setSnackbar({
            title: errorMessage,
            type: "error",
          });
        }
      })
      .catch((err) => {
        // Extract error message from the nested error response structure
        // Error structure: { data: { message: { data: { message: "..." } } } }
        let errorMessage = "Failed to invite team members.";
        
        // Try to extract from nested structure: err.data.message.data.message
        if (err?.data?.message?.data?.message && typeof err.data.message.data.message === 'string' && err.data.message.data.message.trim() !== '') {
          errorMessage = err.data.message.data.message;
        }
        // Fallback: err.data.message (if it's a string)
        else if (err?.data?.message && typeof err.data.message === 'string' && err.data.message.trim() !== '') {
          errorMessage = err.data.message;
        }
        // Fallback: err.data.message.message
        else if (err?.data?.message?.message && typeof err.data.message.message === 'string' && err.data.message.message.trim() !== '') {
          errorMessage = err.data.message.message;
        }
        // Fallback: err.message
        else if (err?.message && typeof err.message === 'string' && err.message.trim() !== '') {
          errorMessage = err.message;
        }
        // Additional fallback: check if message is directly in data
        else if (err?.data?.data?.message && typeof err.data.data.message === 'string' && err.data.data.message.trim() !== '') {
          errorMessage = err.data.data.message;
        }
        
        mainStore.setSnackbar({
          title: errorMessage,
          type: "error",
        });
      });
  }
};

const navigateToDashboard = () => {
  router.push("/");
};

const handlePricingCheckout = () => {
  const pricingRef = stepComponent.value;
  if (pricingRef?.startCheckout) {
    const started = pricingRef.startCheckout();
    if (!started) {
      mainStore.setSnackbar({
        title: "Please select a plan to continue.",
        type: "error",
      });
    }
    return;
  }
  navigateToDashboard();
};

// Handle back navigation with awareness of Pricing payment modal
const handleBack = () => {
  // If on first step (step 0), go back to initial screen
  if (step.value === 0) {
    emit('go-to-initial-screen');
    return;
  }
  
  // Pricing step is index 2 (0-based)
  if (step.value === 2) {
    const pricingRef = stepComponent.value;
    // If payment modal is open, close it instead of moving to previous step
    if (pricingRef?.isPaymentOpen) {
      if (pricingRef.isPaymentOpen) {
        pricingRef.cancelPaymentFlow?.();
        return;
      }
    }
  }
  step.value--;
};
</script>
<style scoped>
.form-container {
  width: 100%;
  min-height: 100%;
}

.form-content-wrapper {
  width: 100%;
  max-width: 600px;
}

.title {
  font-weight: 600;
  font-size: 40px;
  line-height: 60px;
  letter-spacing: 0%;
  color: #1e1e1e;
}

.sub-title {
  font-weight: 400;
  font-size: 16px;
  line-height: 100%;
  color: #8b8b8b;
}

/* Button container */
.button-container {
  margin-left: 14px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

/* For Add Team Members step (step 1), move buttons to bottom */
.form-container.buttons-bottom {
  min-height: calc(100vh - 96px);
}

.form-container.buttons-bottom .button-container {
  margin-top: auto;
  padding-top: 24px;
}

/* Button font size */
.nav-button {
  font-size: 16px !important;
}

.trial-link {
  text-transform: none !important;
}

/* Mobile Responsive Adjustments */
@media (max-width: 959px) {
  .form-container {
    padding-left: 16px !important;
    padding-right: 16px !important;
  }
  
  .title {
    font-size: 28px;
    line-height: 1.3;
  }
  
  .sub-title {
    font-size: 14px;
    line-height: 1.4;
  }
  
  .button-container {
    margin-left: 0;
  }
}

/* Tablet Adjustments (600px - 959px) */
@media (min-width: 600px) and (max-width: 959px) {
  .title {
    font-size: 32px;
    line-height: 1.3;
  }
  
  .sub-title {
    font-size: 15px;
  }
}

/* Small Mobile (320px - 599px) */
@media (max-width: 599px) {
  .form-container {
    padding-left: 12px !important;
    padding-right: 12px !important;
  }
  
  .title {
    font-size: 24px;
    line-height: 1.25;
  }
  
  .sub-title {
    font-size: 13px;
  }
  
  .form-content-wrapper {
    max-width: 100%;
  }
  
  .button-container {
    width: 100%;
    justify-content: flex-start;
  }
  
  .nav-button {
    min-width: 80px !important;
  }
}

/* Medium Laptop (960px - 1279px) */
@media (min-width: 960px) and (max-width: 1279px) {
  .title {
    font-size: 36px;
    line-height: 1.3;
  }
}
</style>
