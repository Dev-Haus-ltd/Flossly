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
            <!-- Contract Type -->
            <div class="mb-4" style="width: 40%">
              <label class="info-label">Contract Type</label>
              <p
                class="editable"
                contenteditable="true"
                @blur="logValue($event, 'contractType')"
              >
                {{ contractInfo?.contractType || "Add Contract Type" }}
              </p>
            </div>

            <!-- Start Date -->
            <div class="mb-4" style="width: 40%">
              <label class="info-label">Start Date</label>
              <p
                class="editable"
                contenteditable="true"
                @blur="logValue($event, 'contractStartDate')"
              >
                {{ contractInfo?.contractStartDate || "Add Start Date" }}
              </p>
            </div>

            <!-- Hours Worked -->
            <div class="mb-4" style="width: 40%">
              <label class="info-label">Hours Worked (weekly)</label>
              <p
                class="editable"
                contenteditable="true"
                @blur="logValue($event, 'weeklyHours')"
              >
                {{ contractInfo?.weeklyHours || "Add Weekly Hours" }}
              </p>
            </div>

            <!-- Salary -->
            <div class="mb-4" style="width: 40%">
              <label class="info-label">Salary (per hour)</label>
              <p
                class="editable"
                contenteditable="true"
                @blur="logValue($event, 'salaryPerHour')"
              >
                {{ contractInfo?.salaryPerHour || "Add Salary Per Hour" }}
              </p>
            </div>

            <!-- Probation Period End -->
            <div class="mb-4" style="width: 40%">
              <label class="info-label">Probation Period End</label>
              <p
                class="editable"
                contenteditable="true"
                @blur="logValue($event, 'probEndDate')"
              >
                {{ contractInfo?.probEndDate || "Add Probation End Date" }}
              </p>
            </div>

            <!-- Holiday Entitlement -->
            <div class="mb-4" style="width: 40%">
              <label class="info-label">Holiday Entitlement (days)</label>
              <p
                class="editable"
                contenteditable="true"
                @blur="logValue($event, 'holidaysEntitled')"
              >
                {{ contractInfo?.holidaysEntitled || "Add Holiday Entitlement" }}
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
const userStore = useUserStore();
const mainStore = useMainStore();

const { user, contractDetails } = defineProps({
  user: Object,
  contractDetails: Object
});

const contractInfo = ref({...contractDetails} || {});

// Watch for prop changes and update local copy
watch(() => contractDetails, (newVal) => {
  if (newVal) {
    contractInfo.value = {...newVal};
  }
}, { deep: true });

function logValue(e, key) {
  contractInfo.value[key] = e.target.innerText.trim();
  console.log(contractInfo.value);
  // Emit the updated contractInfo, not the old contractDetails
  emit("update", contractInfo.value);
}

const updateProfile = () => {
  userStore
    .updateContract({
      userId: user.id,
      organisationId: user.currentLoggedInOrgId,
      details: contractInfo.value
    })
    .then((res) => {
      if (res.code === 0) {
        // Update parent prop after successful API call
        emit("update", contractInfo.value);
        mainStore.setSnackbar({
          title: res?.data?.message || "Contract details updated successfully",
          type: "success",
        });
      } else {
        mainStore.setSnackbar({
          title: res?.data?.message || res?.message || "Failed to update contract details",
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