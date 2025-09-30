<template>
  <div
    :class="
      steps[step].key === 3
        ? 'py-5 d-flex flex-column fill-height'
        : 'parent py-5 d-flex flex-column fill-height align-start ml-6'
    "
  >
    <div class="w-100">
      <h2 class="mb-4 title">{{ steps[step].title }}</h2>
      <h2 class="mb-4 sub-title">{{ steps[step].subTitle }}</h2>

      <!-- Dynamic Step Component -->
      <component
        :is="currentComponent"
        ref="stepComponent"
        v-model="stepModels[step]"
      />
    </div>

    <!-- Navigation Buttons -->
    <div class="mt-6 mt-auto" style="margin-left: 14px">
      <v-btn
        color="grey-darken-1"
        variant="outlined"
        :disabled="step === 0"
        @click="step--"
        class="me-2"
        height="48"
        width="100"
      >
        Back
      </v-btn>
      <v-btn
        v-if="step === 1"
        color="grey-darken-1"
        variant="outlined"
        @click="step++"
        class="me-2"
          height="48"
        width="100"
      >
        Skip
      </v-btn>

      <v-btn color="primary" 
      height="48"
      width="100"
        
        @click="nextStep" v-if="step < steps.length - 1">
        Next
      </v-btn>

      <v-btn
        v-if="step === steps.length - 1"
        color="primary"
        @click="navigateToDashboard"
        height="48"
        width="150"
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
// Steps metadata
const step = ref(0);
const steps = [
  {
    key: 1,
    title: "Quick Clinic Setup",
    subTitle:
      "Enter your clinic details to personalize your Flossly workspace.",
    component: clinicSetup,
  },
  {
    key: 2,
    title: "Add Team Members",
    subTitle:
      "Enhance your team's collaboration and efficiency by inviting new members to your Key Stone platform.",
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
.parent {
  width: 70%;
  
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
</style>
