<template>
  <div class="mt-5">
    <v-row>
      <v-col cols="12">
        <v-card
          elevation="0"
          class="pa-7"
          style="border: 1px solid #dbdbdb; border-radius: 12px"
        >
          <v-row>
            <v-col cols="12" md="4">
              <form @submit.prevent="onSave">
                <!-- Current Password -->
                <label class="input-label">Current Password</label>
                <v-text-field
                  v-model="form.oldPassword"
                  type="password"
                  density="comfortable"
                  variant="solo"
                  single-line
                  :rules="[rules.required]"
                  class="mb-2 custom-input"
                  flat
                />

                <!-- Forgot Password -->
                <div class="forgot-line">
                  Forgot your password?
                  <a  class="reset-link" @click="resetPassword">Reset password via email</a>
                </div>

                <!-- New Password -->
                <label class="input-label">New Password</label>
                <v-text-field
                  v-model="form.newPassword"
                  type="password"
                  density="comfortable"
                  variant="solo"
                  single-line
                  :rules="[rules.required]"
                  class="mb-2 custom-input"
                  flat
                />

                <!-- Confirm New Password -->
                <label class="input-label">Confirm New Password</label>
                <v-text-field
                  v-model="form.confirmPassword"
                  type="password"
                  density="comfortable"
                  variant="solo"
                  single-line
                  :rules="[rules.required, rules.matchPassword]"
                  class="mb-4 custom-input"
                  flat
                />

                <!-- Save Button -->
                <v-btn
                  :color="isFormValid ? 'primary' : ''"
                  class="px-6 w-100"
                  style="height: 48px"
                  :disabled="!isFormValid"
                  type="submit"
                >
                  Save
                </v-btn>
              </form>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>

const { user } = defineProps({
  user: Object,
});

const authStore= useAuthStore();
const store=useMainStore();
const router= useRouter();
const form = reactive({
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const rules = {
  required: (value) => !!value || "This field is required",
  matchPassword: (value) =>
    value === form.newPassword || "Passwords do not match",
};

const isFormValid = computed(() => {
  return (
    form.oldPassword &&
    form.newPassword &&
    form.confirmPassword 
  );
});

async function onSave() { 
  if (!isFormValid.value) return;
  console.log("Saving new password:", form); 

  try {
    const res = await authStore.updatePassword({
      oldPassword: form.oldPassword,
      newPassword: form.newPassword,
    });

    if (res.code === 0) {
      store.setSnackbar({
        title: res.data?.message || res.message || "Password updated successfully",
        type: "success",
      });

      form.oldPassword = "";
      form.newPassword = "";
      form.confirmPassword =""
    } else {
      store.setSnackbar({
        title: res.data?.message || res.message || "Failed to update password",
        type: "error",
      });
    }
  } catch (err) {
    console.error("Error updating password:", err);

    store.setSnackbar({
      title: err?.response?.data?.message || err?.message || "Failed to update password",
      type: "error",
    });
  }
}
const resetPassword= async()=>{
  try {
    const res = await authStore.requestReset({ email: user.email });
    if (res.code === 0) {
      
      store.setSnackbar({
        title: res.message || "Reset code sent to your email",
        type: "success",
      });
      localStorage.setItem("route", "forgetpassword");
      router.push("/logout");

    } else {
      store.setSnackbar({
        title: res.message || "Something went wrong",
        type: "error",
      });
    }
  } catch (err) {
    store.setSnackbar({
      title: err.message,
      type: "error",
    });
  }
}

</script>


<style scoped>
.input-label {
  display: block;
  font-family: "Poppins";
  font-weight: 400;
  font-size: 14px;
  margin-bottom: 4px;
  color: #737373;
}

.custom-input :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
  font-family: "Poppins", sans-serif;
}

.forgot-line {
  font-family: "Poppins";
  font-weight: 400;
  font-size: 16px;
  margin: 8px 0 16px;
  color: #1e1e1e;
}

.reset-link {
  display: block;
  margin-top: 4px;
  font-family: Poppins;
  font-weight: 400;
  font-size: 16px;
  color: #1976d2; /* primary blue link */
  text-decoration: none;
  cursor: pointer;
}
.reset-link:hover {
  text-decoration: underline;
}
</style>
