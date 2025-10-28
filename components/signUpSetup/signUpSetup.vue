<template>
  <div
    :class="
      steps[step].key === 3
        ? 'form-container py-3 py-md-5 px-3 d-flex flex-column'
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
      />
    </div>

    <!-- Navigation Buttons -->
    <div class="button-container">
      <v-btn
        color="grey-darken-1"
        variant="tonal"
        :disabled="step === 0"
        @click="step--"
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

      <v-btn
        v-if="step === steps.length - 1"
        color="primary"
        @click="navigateToDashboard"
        height="48"
        width="150"
        class="nav-button"
        rounded="lg" size="x-large"
        variant="flat"
        style="font-size: 16px;"
      >
        Go to Dashboard
      </v-btn>
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
const router = useRouter();

// Define emit to send current step to parent
const emit = defineEmits(['update:currentStep']);

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
      "Enter your clinic details to personlise your Flossly workspace.",
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
  { name: "", logo: null, contact: "", address: "", type: "" }, // Clinic model
  { users: [{ roleId: 1, email: "" }] }, // Team model
  {}, // Pricing model
]);

const user = ref({});
const userOrgs = ref([]);

onMounted(() => {
  if (localStorage.getItem("user")) {
    user.value = JSON.parse(localStorage.getItem("user"));
    userOrgs.value = user.value.userOrganisations;
  }
  stepModels.value[0].name = userOrgs.value.find(
    (x) => x.organisationId === user.value.currentLoggedInOrgId
  ).organisation?.name;
});

const nextStep = async () => {
  const component = stepComponent.value;
  if (component?.validate) {
    await component.validate();
    if (!component.valid) return;
  }
  if (step.value === 0) {
    const data = stepModels.value[0];
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("contact", data.contact);
    formData.append("type", data.type);
    formData.append("address", data.address);
    formData.append("origin", "onboarding");
    if (data.logo) {
      formData.append("logo", data.logo, data.logo?.name);
    }
    orgStore
      .updateOrganisation(formData)
      .then((res) => {
        if (res.code === 0) {
          const profileCompletion = useCookie("profileCompletion");
          profileCompletion.value = 50;
          user.value.userOrganisations.find(
            (x) => x.organisationId === user.value.currentLoggedInOrgId
          ).organisation = res.data;
          localStorage.setItem("user", JSON.stringify(user.value));
          step.value++;
        } else {
          mainStore.setSnackbar({
            title: res.data.message,
            type: "Error",
          });
        }
      })
      .catch((err) => {
        mainStore.setSnackbar({
          title: err.message,
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
          step.value++;
        } else {
          mainStore.setSnackbar({
            title: res.data.message || res.message,
            type: "Error",
          });
        }
      })
      .catch((err) => {
        mainStore.setSnackbar({
          title: err.message,
          type: "Error",
        });
      });
  }
};

const navigateToDashboard = () => {
  router.push("/");
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
