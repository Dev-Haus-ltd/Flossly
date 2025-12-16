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
                :rules="requiredRule"
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
        flat
      >
        Save
      </v-btn>
    </div>
  </v-navigation-drawer>
</template>

<script setup>

const { modelValue, rolesList } = defineProps({
  modelValue: Boolean,
  rolesList: Array
});

const mainStore = useMainStore();
const userStore = useUserStore();

const emit = defineEmits(["close", "success", "update:modelValue"]);
const formRef = ref(null);
const requiredRule = [(v) => !!v || "This field is required"];
const authStore = useAuthStore();
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
  const formValidation = await formRef.value.validate();
  if (formValidation.valid) {
    authStore.inviteMembers({users: [form.value]}).then((res) => {
      if (res.code === 0) {
        // Reset the user cache to ensure new invited users will be fetched when they become active
        userStore.resetUsers();
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
      if (err?.data?.message?.data?.message && typeof err.data.message.data.message === 'string') {
        errorMessage = err.data.message.data.message;
      }
      // Fallback: err.data.message (if it's a string)
      else if (err?.data?.message && typeof err.data.message === 'string' && err.data.message.trim() !== '') {
        errorMessage = err.data.message;
      }
      // Fallback: err.data.message.message
      else if (err?.data?.message?.message && typeof err.data.message.message === 'string') {
        errorMessage = err.data.message.message;
      }
      // Fallback: err.message
      else if (err?.message && typeof err.message === 'string' && err.message.trim() !== '') {
        errorMessage = err.message;
      }
      
      setSnack("error", errorMessage);
    });
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
