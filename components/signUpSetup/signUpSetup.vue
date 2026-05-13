<template>
  <div
    :class="
      step === 1
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
      v-bind="currentComponentProps"
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
        rounded="lg"
        size="x-large"
        style="font-size: 16px;"
      >
        Back
      </v-btn>

      <!-- Step 0: Next -->
      <v-btn
        v-if="step < steps.length - 1"
        color="primary"
        variant="flat"
        height="48"
        width="100"
        class="nav-button"
        @click="nextStep"
        :disabled="isNextDisabled"
        rounded="lg"
        size="x-large"
        style="font-size: 16px;"
      >
        Next
      </v-btn>

      <!-- Step 1 (last): Skip + Finish -->
      <template v-if="step === steps.length - 1">
        <v-btn
          color="grey-darken-1"
          variant="text"
          @click="navigateToDashboard"
          class="me-2 nav-button"
          height="48"
          width="100"
          rounded="lg"
          size="x-large"
          style="font-size: 16px;"
        >
          Skip for now
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          @click="nextStep"
          class="nav-button"
          height="48"
          width="100"
          rounded="lg"
          size="x-large"
          style="font-size: 16px;"
        >
          Finish
        </v-btn>
      </template>
    </div>
  </div>
</template>

<script setup>
import clinicSetup from "./clinicSetup.vue";
import AddTeamMembers from "./addTeamMembers.vue";

const orgStore = useOrgStore();
const authStore = useAuthStore();
const mainStore = useMainStore();
const userStore = useUserStore();
const router = useRouter();
const newPracticeCompleted = ref(false);
const isFinalizingNewPractice = ref(false);

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
];

// Dynamically resolve current component
const currentComponent = computed(() => steps[step.value].component);
const currentComponentProps = computed(() => ({
  showCta: steps[step.value]?.showCta !== false,
}));
// Form refs & models
const stepComponent = ref();
const stepModels = ref([
  { name: "", logo: null, contact: "", address: "", postalCode: "" },
  { users: [{ roleId: null, email: "" }] },
]);

const user = ref({});
const userOrgs = ref([]);
const initialClinicSnapshot = ref(null);

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
    stepModels.value[0].contact = "";
    stepModels.value[0].address = "";
    stepModels.value[0].postalCode = "";
    stepModels.value[0].logo = null;
  } else {
    // For existing org update flow, pre-fill with current org name
    const currentOrg = userOrgs.value.find(
      (x) => x.organisationId === user.value.currentLoggedInOrgId
    );
    stepModels.value[0].name = currentOrg?.organisation?.name || "";
    stepModels.value[0].contact = currentOrg?.organisation?.contact || "";
    stepModels.value[0].address = currentOrg?.organisation?.address || "";
    stepModels.value[0].postalCode = currentOrg?.organisation?.postalCode || "";
    stepModels.value[0].logo = currentOrg?.organisation?.logo || null;

    // snapshot for dirty check
    initialClinicSnapshot.value = {
      name: stepModels.value[0].name,
      contact: stepModels.value[0].contact,
      address: stepModels.value[0].address,
      postalCode: stepModels.value[0].postalCode,
      logo: stepModels.value[0].logo, // string URL
    };
  }
});

const isNextDisabled = computed(() => {
  if (step.value === 0) {
    const clinic = stepModels.value[0];
    return (
      !clinic.name?.trim() ||
      !clinic.contact?.trim() ||
      !clinic.address?.trim()
    );
  }
  return false;
});

// 🔑 dirty check
const isClinicDirty = () => {
  if (isNewPractice.value || !initialClinicSnapshot.value) return true;

  const current = stepModels.value[0];
  const initial = initialClinicSnapshot.value;

  if (current.name !== initial.name) return true;
  if (current.contact !== initial.contact) return true;
  if (current.address !== initial.address) return true;
  if (current.postalCode !== initial.postalCode) return true;

  // new logo selected
  if (
    current.logo &&
    typeof current.logo === "object" &&
    typeof current.logo.name === "string"
  ) {
    return true;
  }

  return false;
};


const nextStep = async () => {
  const component = stepComponent.value;
  if (component?.validate) {
    const isValid = await component.validate();
    if (!isValid) return;
  }
  if (step.value === 0) {
    // ⛔ update flow + no changes → skip API
    if (!isNewPractice.value && !isClinicDirty()) {
      step.value++;
      return;
    }
    const data = stepModels.value[0];
    if (isNewPractice.value) {
      step.value++;
      return;
    }
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("contact", data.contact);
    // formData.append("type", data.type);
    formData.append("address", data.address);
    formData.append("postalCode", data.postalCode || "");
    formData.append("origin", "onboarding");
    if (
      data.logo &&
      typeof data.logo === "object" &&
      typeof data.logo.name === "string"
    ) {
      formData.append("logo", data.logo, data.logo.name);
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
    // Last step — validate invites then navigate to dashboard (finalization happens there)
    if (isNewPractice.value) {
      await navigateToDashboard();
      return;
    }
    const data = stepModels.value[1];
    data.origin = "onboarding";
    authStore
      .inviteMembers(data)
      .then((res) => {
        if (res.code === 0) {
          userStore.resetUsers();
          navigateToDashboard();
        } else {
          const errorMessage = res?.data?.message || res?.message || "Failed to invite team members.";
          mainStore.setSnackbar({ title: errorMessage, type: "error" });
        }
      })
      .catch((err) => {
        const errorMessage =
          err?.data?.message?.data?.message ||
          (typeof err?.data?.message === 'string' ? err.data.message : null) ||
          err?.data?.message?.message ||
          err?.message ||
          err?.data?.data?.message ||
          "Failed to invite team members.";
        mainStore.setSnackbar({ title: errorMessage, type: "error" });
      });
  }
};

const buildOrgFormData = () => {
  const data = stepModels.value[0];
  const formData = new FormData();
  formData.append("name", data.name);
  formData.append("contact", data.contact);
  // formData.append("type", data.type);
  formData.append("address", data.address);
  formData.append("postalCode", data.postalCode || "");
  formData.append("origin", "onboarding");
  if (data.logo) {
    formData.append("logo", data.logo, data.logo?.name);
  }
  return formData;
};

const getInvitePayload = () => {
  const data = stepModels.value[1] || {};
  const users = Array.isArray(data.users) ? data.users : [];
  const validUsers = users.filter((u) => u?.email && String(u.email).trim());
  if (!validUsers.length) return null;
  return { ...data, users: validUsers, origin: "onboarding" };
};

const finalizeNewPractice = async () => {
  if (!isNewPractice.value || newPracticeCompleted.value || isFinalizingNewPractice.value) {
    return true;
  }
  isFinalizingNewPractice.value = true;
  try {
    const formData = buildOrgFormData();
    const res = await orgStore.createOrganisationForUser(formData);
    if (res.code !== 0) {
      mainStore.setSnackbar({
        title: res.data?.message || res.message || "Failed to create practice",
        type: "Error",
      });
      return false;
    }

    const profileCompletion = useCookie("profileCompletion");
    profileCompletion.value = 50;

    if (res.data?.organisationId) {
      const switchRes = await authStore.switchOrgnanisation({
        orgId: res.data.organisationId,
      });

      if (switchRes.code !== 0) {
        mainStore.setSnackbar({
          title: switchRes.message || "Failed to switch to new workspace",
          type: "Error",
        });
        return false;
      }
    }

    await authStore.profile();
    if (localStorage.getItem("user")) {
      user.value = JSON.parse(localStorage.getItem("user"));
      userOrgs.value = user.value.userOrganisations;
    }

    const invitePayload = getInvitePayload();
    if (invitePayload) {
      const inviteRes = await authStore.inviteMembers(invitePayload);
      if (inviteRes.code === 0) {
        userStore.resetUsers();
      } else {
        const errorMessage =
          inviteRes?.data?.message || inviteRes?.message || "Failed to invite team members.";
        mainStore.setSnackbar({
          title: errorMessage,
          type: "error",
        });
      }
    }

    orgStore.clearNewPracticeMode();
    newPracticeCompleted.value = true;
    return true;
  } catch (err) {
    mainStore.setSnackbar({
      title: err.message || "Failed to finish practice setup",
      type: "error",
    });
    return false;
  } finally {
    isFinalizingNewPractice.value = false;
  }
};

const navigateToDashboard = async () => {
  if (isNewPractice.value) {
    const ok = await finalizeNewPractice();
    if (!ok) return;
  }
  router.push("/");
};

const handleBack = () => {
  if (step.value === 0) {
    if (isNewPractice.value) {
      orgStore.clearNewPracticeMode();
      router.push("/");
    } else {
      emit('go-to-initial-screen');
    }
    return;
  }
  step.value--;
};

onBeforeRouteLeave(() => {
  if (isNewPractice.value && !newPracticeCompleted.value) {
    orgStore.clearNewPracticeMode();
  }
});
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
