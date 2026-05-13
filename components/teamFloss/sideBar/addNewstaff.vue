<template>
  <v-navigation-drawer
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    location="right"
    temporary
    :width="600"
  >
    <!-- Header -->
    <v-toolbar flat color="white">
      <v-toolbar-title class="title-text"> Add New Staff </v-toolbar-title>
      <v-spacer />
      <v-btn
        icon
        variant="outlined"
        color="#8B8B8B"
        @click="handleClose"
        class="mr-4"
        style="
          width: 20px;
          height: 20px;
          min-width: 20px;
          border-radius: 50%;
          padding: 0;
        "
      >
        <v-icon size="14">mdi-close</v-icon>
      </v-btn>
    </v-toolbar>

    <!-- Body -->
    <div
      class="pa-4"
      style="
        background-color: #f5f5f5;
        height: calc(100% - 64px - 64px);
        overflow-y: auto;
      "
    >
      <v-card class="pa-4" color="white" elevation="0" style="height: 80vh">
        <v-alert
          v-if="memberUsage"
          :type="isAtMemberLimit ? 'warning' : 'info'"
          variant="tonal"
          density="comfortable"
          class="mb-4"
          rounded="lg"
        >
          <div class="d-flex align-center justify-space-between flex-wrap ga-3">
            <div>
              <div class="font-weight-medium">Team seats</div>
              <div class="text-caption">
                {{ memberUsage.current }} of {{ memberUsage.max ?? 'Unlimited' }} seats used
              </div>
            </div>
            <v-chip size="small" :color="isAtMemberLimit ? 'warning' : 'primary'" variant="tonal">
              {{ seatsRemaining }} remaining
            </v-chip>
          </div>
          <v-progress-linear
            v-if="memberUsage.max"
            :model-value="memberUsagePct"
            :color="isAtMemberLimit ? 'warning' : 'primary'"
            bg-color="#e8eefc"
            rounded
            height="8"
            class="mt-3"
          />
          <div v-if="isAtMemberLimit" class="text-caption mt-3">
            Flossy Lite includes up to 3 team members. Upgrade to CRM to add more staff.
          </div>
        </v-alert>
        <v-form ref="formRef" @submit.prevent="onSubmit">
          <v-row>
            <!-- Name -->
            <v-col cols="12">
              <label class="mb-1 fld-lbl">Name</label>
              <v-text-field
                v-model="form.fullName"
                variant="solo"
                density="compact"
                class="mb-1 input-bordered"
                bg-color="white"
                :rules="requiredRule"
                required
                flat
              />
            </v-col>
            <v-col cols="12">
              <label class="mb-1 fld-lbl">Email</label>
              <v-text-field
                v-model="form.email"
                variant="solo"
                density="compact"
                class="mb-1 input-bordered"
                bg-color="white"
                :rules="[...requiredRule, emailRule, selfInviteRule]"
                :error-messages="selfInviteError"
                @input="validateSelfInvitation"
                @blur="validateSelfInvitation"
                required
                flat
              />
            </v-col>
            <!-- Role -->
            <v-col cols="12">
              <label class="mb-1 fld-lbl">Role</label>
              <v-select
                v-model="form.roleId"
                :items="rolesList"
                item-title="title"
                item-value="id"
                variant="solo"
                density="compact"
                class="mb-1 input-bordered"
                :rules="requiredRule"
                bg-color="white"
                required
                flat
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card>
    </div>

    <!-- Footer -->
    <div
      class="d-flex justify-space-between align-center px-4 py-2"
      style="background-color: white; height: 64px"
    >
      <v-btn
        color="white"
        class="text-primary"
        style="width: 48%; border-radius: 8px; border: 1px solid #dfdfdf"
        @click="handleClose"
        flat
      >
        Back
      </v-btn>

      <v-btn
        color="primary"
        class="text-white"
        style="width: 48%; border-radius: 8px"
        @click="onSubmit()"
        :disabled="isAtMemberLimit"
        flat
      >
        Save
      </v-btn>
    </div>
  </v-navigation-drawer>
</template>

<script setup>
import { resetUsageState } from '~/composables/useUsageSummary'

const { modelValue, rolesList } = defineProps({
  modelValue: Boolean,
  rolesList: Array
});

const mainStore = useMainStore();
const userStore = useUserStore();
const { usage, isLite, isAtLimit, fetchUsage } = useUsageSummary()
onMounted(() => fetchUsage())

const emit = defineEmits(["close", "success", "update:modelValue"]);
const formRef = ref(null);
const requiredRule = [(v) => !!v || "This field is required"]; 
const emailRule = (v) => {
  if (!v) return true; // requiredRule will catch empty
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(String(v).trim()) || "Please enter a valid email address";
};
const authStore = useAuthStore();
const selfInviteError = ref("");
const memberUsage = computed(() => usage.value?.members || null)
const memberUsagePct = computed(() => {
  const current = Number(memberUsage.value?.current || 0)
  const max = Number(memberUsage.value?.max || 0)
  if (!max) return 0
  return Math.min(100, Math.round((current / max) * 100))
})
const isAtMemberLimit = computed(() => isLite.value && isAtLimit('members'))
const seatsRemaining = computed(() => {
  if (!memberUsage.value?.max) return 'Unlimited'
  return Math.max(0, Number(memberUsage.value.max || 0) - Number(memberUsage.value.current || 0))
})

// Get current user's email from auth store
const currentUserEmail = authStore.getLoggedUser?.email?.toLowerCase();

// Self-invitation validation rule
const selfInviteRule = (v) => {
  if (!v || !currentUserEmail) return true;
  return v.toLowerCase() !== currentUserEmail || "You cannot invite yourself";
};

// Validate self-invitation
const validateSelfInvitation = () => {
  if (!form.value.email || !currentUserEmail) {
    selfInviteError.value = "";
    return;
  }
  
  if (form.value.email.toLowerCase() === currentUserEmail) {
    selfInviteError.value = "You cannot invite yourself";
  } else {
    selfInviteError.value = "";
  }
};

const form = ref({
  fullName: "",
  email: "",
  roleId: null,
});

const resetForm = () => {
  form.value = {
    fullName: "",
    email: "",
    roleId: null,
  };
  selfInviteError.value = "";
  if (formRef.value) {
    formRef.value.reset();
    formRef.value.resetValidation();
  }
};

const handleClose = () => {
  resetForm();
  emit("update:modelValue", false);
  emit("close");
};

const onSubmit = async () => {
  if (isAtMemberLimit.value) {
    setSnack("error", "Flossy Lite includes up to 3 team members. Upgrade to CRM to add more staff.");
    return;
  }
  // Validate self-invitation before form validation
  validateSelfInvitation();
  
  const formValidation = await formRef.value.validate();
  // Block submit if email invalid
  const emailValid = !form.value.email || emailRule(form.value.email) === true;
  if (formValidation.valid && emailValid && !selfInviteError.value) {
    authStore.inviteMembers({users: [form.value]}).then((res) => {
      if (res.code === 0) {
        userStore.resetUsers();
        resetUsageState();
        setSnack("success", "User Invited Successfully");
        resetForm();
        emit("update:modelValue", false);
        emit("success");
      } else {
        const errorMessage = res?.data?.message || res?.message || "User is not Invited.";
        setSnack("error", errorMessage);
      }
    }).catch((err) => {
      // Extract error message from the nested error response structure
      // Error structure: { data: { message: { data: { message: "..." } } } }
      let errorMessage = "Failed to invite user.";
      
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
      
      setSnack("error", errorMessage);
    });
  } else if (selfInviteError.value) {
    // Show specific error for self-invitation
    setSnack("error", selfInviteError.value);
  }
};

const setSnack = (type, title) => {
  mainStore.setSnackbar({
    type,
    title,
  });
};
</script>

<style scoped>
.title-text {
  
  font-weight: 600;
  font-size: 16px;
}
.fld-lbl {
  
  font-weight: 400;
  font-size: 14px;
  color: #737373;
}
.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
  
}
</style>
