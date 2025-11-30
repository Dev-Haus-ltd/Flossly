<template>
  <div class="mt-5">
    <v-row>
      <v-col cols="12">
        <v-card
          elevation="0"
          class="pa-7"
          style="border: 1px solid #dbdbdb; border-radius: 12px"
        >
          <div class="info-section">
            <!-- Bank Name -->
            <div class="mb-4" style="width: 40%">
              <label class="info-label">Bank Name</label>
              <p
                class="editable"
                contenteditable="true"
                @blur="logValue($event, 'bankName')"
              >
                {{ bankInfo?.bankName || "Add Bank Name" }}
              </p>
            </div>

            <!-- Sort Code -->
            <div class="mb-4" style="width: 40%">
              <label class="info-label">Sort Code</label>
              <p
                class="editable"
                contenteditable="true"
                @blur="logValue($event, 'sortCode')"
              >
                {{ bankInfo?.sortCode || "Add Sort Code" }}
              </p>
            </div>

            <!-- Account Number -->
            <div class="mb-4" style="width: 40%">
              <label class="info-label">Account Number</label>
              <p
                class="editable"
                contenteditable="true"
                @blur="logValue($event, 'accountNumber')"
              >
                {{ bankInfo?.accountNumber || "Add Account Number" }}
              </p>
            </div>

            <!-- Bank Account Holder Name -->
            <div style="width: 40%">
              <label class="info-label">Bank Account Holder Name</label>
              <p
                class="editable"
                contenteditable="true"
                @blur="logValue($event, 'accountTitle')"
              >
                {{ bankInfo?.accountTitle || "Add Account Holder Name" }}
              </p>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>
    <div class="d-flex justify-end pa-2">
      <v-btn @click="updateProfile" color="primary" variant="flat">Update Details</v-btn>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const emit = defineEmits(["update"]);
const authStore = useAuthStore();
const mainStore = useMainStore();

const { bankDetails } = defineProps({
  bankDetails: Object
});

const bankInfo = ref({...bankDetails} || {});

// Watch for prop changes and update local copy
watch(() => bankDetails, (newVal) => {
  if (newVal) {
    bankInfo.value = {...newVal};
  }
}, { deep: true });

function logValue(e, key) {
  bankInfo.value[key] = e.target.innerText.trim();
  // Emit the updated bankInfo, not the old bankDetails
  emit("update", bankInfo.value);
}

const updateProfile = () => {
  authStore
    .updateAccountDetails(bankInfo.value)
    .then((res) => {
      if (res.code === 0) {
        // Update parent prop after successful API call
        emit("update", bankInfo.value);
        mainStore.setSnackbar({
          title: res?.data?.message || "Account details updated successfully",
          type: "success",
        });
      } else {
        mainStore.setSnackbar({
          title: res?.data?.message || res?.message || "Failed to update account details",
          type: "error",
        });
      }
    })
    .catch((err) => {
      mainStore.setSnackbar({
        title: err?.message || "Something went wrong",
        type: "error",
      });
    });
};
</script>

<style scoped>
.info-label {
  display: block;
  
  font-weight: 600;
  font-size: 13px;
  color: #1e1e1e;
  margin-bottom: 4px;
}

.editable {
  
  font-weight: 400;
  font-size: 14px;
  color: #101010;
  outline: none;
  cursor: text;
  min-height: 20px;
  border: 1px solid transparent;
  border-radius: 6px;
}
.editable:focus {
  border: 1px solid #dfdfdf;
  padding: 4px 6px;
}
</style>