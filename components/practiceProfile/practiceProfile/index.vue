<template>
  <div class="mt-5">
    <v-row class="d-flex align-stretch">
      <!-- First Column -->
      <v-col cols="12" md="6" class="d-flex">
        <v-card
          elevation="0"
          class="pa-7 flex-grow-1"
          style="border: 1px solid rgba(var(--v-theme-on-surface), 0.12); border-radius: 12px"
        >
          <!-- Top Section: Avatar + Name + Practice -->
          <div class="d-flex align-center mb-6">
            <CommonAvatar
              :user="{ fullName: organisation.fullName, photo: organisation.logo }"
              size="80"
            />
            <div class="ml-4">
              <p class="user-name">{{ organisation.fullName }}</p>
              <p class="practice-name">{{ organisation.practice }}</p>
            </div>
          </div>

          <!-- Info Section -->
          <div class="info-section">
            <!-- Practice Manager -->
            <div class="mb-1" style="width: 40%">
              <label class="info-label">Practice Manager</label>
              <v-select
                v-model="organisation.managerId"
                :items="practiceManagers"
                item-title="fullName"
                single-line
                title="Select"
                density="compact"
                outlined
                variant="plain"
                item-value="id"
                @update:model-value="markDirty('managerId')"
              ></v-select>
            </div>

            <!-- Substitute Lead Name -->
            <div class="mb-4">
              <label class="info-label">Substitute Lead Name</label>
              <p
                class="editable"
                contenteditable="true"
                @blur="handleEditableChange($event, 'substituteLead')"
              >
                {{ organisation.substituteLead || "Add Substitute Lead Name" }}
              </p>
            </div>

            <!-- Address -->
            <div class="mb-4">
              <label class="info-label">Address</label>
              <p
                class="editable"
                contenteditable="true"
                @blur="handleEditableChange($event, 'address')"
              >
                {{ organisation.address || "Add Address" }}
              </p>
            </div>

            <!-- Telephone -->
            <div class="mb-4">
              <label class="info-label">Telephone</label>
              <p
                class="editable"
                contenteditable="true"
                @blur="handleEditableChange($event, 'contact')"
              >
                {{ organisation.contact || "Add contact" }}
              </p>
            </div>
          </div>
        </v-card>
      </v-col>

      <!-- Second Column -->
      <v-col cols="12" md="6" class="d-flex">
        <v-card
          elevation="0"
          class="pa-7 flex-grow-1"
          style="border: 1px solid rgba(var(--v-theme-on-surface), 0.12); border-radius: 12px"
        >
          <div class="info-section">
            <!-- Staff Count -->
            <div class="mb-4">
              <label class="info-label">Staff</label>
              <p
                class="editable"
                contenteditable="true"
                @blur="handleEditableChange($event, 'teamCount')"
              >
                {{ organisation.teamCount || "Add number" }}
              </p>
            </div>

            <!-- Number of Surgeries -->
            <div class="mb-4">
              <label class="info-label">Number of surgeries</label>
              <p
                class="editable"
                contenteditable="true"
                @blur="handleEditableChange($event, 'surgeryCount')"
              >
                {{ organisation.surgeryCount || "Add Number of surgeries" }}
              </p>
            </div>

            <!-- NHS / Private / Mixed -->
            <div class="mb-4">
              <label class="info-label">NHS / Private / Mixed</label>
              <p
                class="editable"
                contenteditable="true"
                @blur="handleEditableChange($event, 'type')"
              >
                {{ organisation.type || "Select Service Type" }}
              </p>
            </div>

            <!-- Last CQC Inspection Date -->
            <div class="mb-4" style="width: 60%">
              <label class="info-label">Last CQC Inspection Date</label>
              <v-menu
                v-model="menus.cqcInspectionDate"
                :close-on-content-click="false"
                transition="scale-transition"
                offset-y
                min-width="auto"
              >
                <template #activator="{ props }">
                  <p class="editable" v-bind="props">
                    {{ formatDate(organisation.cqcInspectionDate) || "Select Date" }}
                  </p>
                </template>
                <v-date-picker
                  v-model="organisation.cqcInspectionDate"
                  @update:model-value="handleDateUpdate"
                />
              </v-menu>
            </div>

            <!-- PIN Code Verification -->
            <div class="mb-4">
              <label class="info-label">PIN Code Verification</label>
              <div
                class="btn-group pa-1 rounded-lg"
                style="border: 1px solid rgba(var(--v-theme-on-surface), 0.12); width: fit-content"
              >
                <v-btn
                  class="toggle-btn"
                  :class="{ active: organisation.pinCodeVerification === 'yes' }"
                  @click="handlePinVerification('yes')"
                  flat
                  :elevation="0"
                >
                  Yes
                </v-btn>
                <v-btn
                  class="toggle-btn"
                  :class="{ active: organisation.pinCodeVerification === 'no' }"
                  @click="handlePinVerification('no')"
                  flat
                  :elevation="0"
                >
                  No
                </v-btn>
              </div>
            </div>

            <!-- Non-working Days -->
            <div>
              <label class="info-label">Please tick your practice non-working days</label>
              <div class="d-flex flex-wrap mt-2">
                <v-checkbox
                  v-for="day in days"
                  :key="day"
                  :label="day"
                  :value="day"
                  v-model="organisation.nonWorkingDays"
                  hide-details
                  class="day-checkbox mr-4 mb-2"
                  @update:model-value="markDirty('nonWorkingDays')"
                />
              </div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>
    <div class="d-flex justify-end pr-5 pt-3">
      <v-btn
        color="primary"
        rounded="lg"
        size="x-large"
        flat
        @click="updateOrgDetails"
        :disabled="Object.keys(dirtyFields).length === 0"
      >
        Update Details
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { parsedDate } from '~/lib/dateFormatter';

const props = defineProps({
  practiceDetails: {
    type: Object,
    required: true,
  },
});

const mainStore = useMainStore();
const userStore = useUserStore();
const orgStore = useOrgStore();

// Store original values for diff comparison
const originalData = ref({});

// Track which fields have been modified
const dirtyFields = reactive({});

const organisation = reactive({
  logo: props.practiceDetails.logo || null,
  fullName: props.practiceDetails.name || '',
  id: props.practiceDetails.id || null,
  managerId: props.practiceDetails.managerId || null,
  substituteLead: props.practiceDetails.substituteLead || '',
  address: props.practiceDetails.address || '',
  contact: props.practiceDetails.contact || '',
  teamCount: props.practiceDetails.teamCount || null,
  surgeryCount: props.practiceDetails.surgeryCount || null,
  type: props.practiceDetails.type || '',
  cqcInspectionDate: props.practiceDetails.cqcInspectionDate || null,
  pinCodeVerification: props.practiceDetails.pinCodeVerification || 'yes',
  nonWorkingDays: props.practiceDetails.nonWorkingDays || [],
});

const practiceManagers = ref([]);
const menus = reactive({ cqcInspectionDate: false });
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Initialize original data and validate types
const initializeOriginalData = () => {
  originalData.value = {
    managerId: organisation.managerId !== null ? Number(organisation.managerId) : null,
    substituteLead: organisation.substituteLead || '',
    address: organisation.address || '',
    contact: organisation.contact || '',
    teamCount: organisation.teamCount !== null ? Number(organisation.teamCount) : null,
    surgeryCount: organisation.surgeryCount !== null ? Number(organisation.surgeryCount) : null,
    type: organisation.type || '',
    cqcInspectionDate: organisation.cqcInspectionDate || null,
    pinCodeVerification: organisation.pinCodeVerification || 'yes',
    nonWorkingDays: Array.isArray(organisation.nonWorkingDays) ? [...organisation.nonWorkingDays] : [],
  };
};

// Mark a field as dirty
const markDirty = (fieldName) => {
  dirtyFields[fieldName] = true;
};

// Handle editable div changes with proper value validation
const handleEditableChange = (e, key) => {
  const value = e.target.innerText.trim();
  
  // Numeric fields: convert and validate
  if (['teamCount', 'surgeryCount', 'managerId'].includes(key)) {
    if (value === '') {
      organisation[key] = null;
    } else {
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue)) {
        organisation[key] = numValue;
      } else {
        // Revert to previous value on invalid input
        e.target.innerText = originalData.value[key] !== null ? originalData.value[key] : 'Add number';
        return;
      }
    }
  } else {
    // Text fields: keep as string
    organisation[key] = value || null;
  }
  
  markDirty(key);
};

// Handle date updates
const handleDateUpdate = (val) => {
  menus.cqcInspectionDate = false;
  organisation.cqcInspectionDate = val;
  markDirty('cqcInspectionDate');
};

// Handle PIN verification toggle
const handlePinVerification = (val) => {
  organisation.pinCodeVerification = val;
  markDirty('pinCodeVerification');
};

// Format date for display
const formatDate = (date) => {
  return parsedDate(date);
};

// Fetch practice managers
const getPracticeManagers = () => {
  userStore.getUserList({ roleId: 8 }).then((res) => {
    if (res.code === 0) {
      practiceManagers.value = res.data;
    }
  });
};

// Build payload with only dirty fields
const buildUpdatePayload = () => {
  const payload = new FormData();

  Object.keys(dirtyFields).forEach((fieldName) => {
    let value = organisation[fieldName];

    // Handle different field types
    if (fieldName === 'fullName') {
      payload.append('name', value || '');
    } else if (['managerId', 'teamCount', 'surgeryCount'].includes(fieldName)) {
      // Send numeric fields as numbers or null
      payload.append(fieldName, value !== null ? value : '');
    } else if (fieldName === 'nonWorkingDays') {
      // Serialize array as JSON
      payload.append(fieldName, JSON.stringify(value || []));
    } else if (fieldName === 'cqcInspectionDate') {
      // Send date as-is (backend will handle formatting)
      payload.append(fieldName, value || '');
    } else {
      // Text fields
      payload.append(fieldName, value || '');
    }
  });

  // Always include ID
  payload.append('id', organisation.id);

  return payload;
};

// Update organisation details
const updateOrgDetails = () => {
  // Validate that at least one field is dirty
  if (Object.keys(dirtyFields).length === 0) {
    mainStore.setSnackbar({
      title: 'No changes to update',
      type: 'info',
    });
    return;
  }

  const payload = buildUpdatePayload();

  orgStore
    .updateOrganisation(payload)
    .then((res) => {
      if (res.code === 0) {
        mainStore.setSnackbar({
          title: res?.data?.message || 'Organisation updated successfully',
          type: 'success',
        });
        // Reset dirty fields after successful update
        Object.keys(dirtyFields).forEach((key) => delete dirtyFields[key]);
        // Update original data to reflect new state
        initializeOriginalData();
      } else {
        mainStore.setSnackbar({
          title: res?.data?.message || res?.message || 'Failed to update organisation',
          type: 'error',
        });
      }
    })
    .catch((err) => {
      mainStore.setSnackbar({
        title: err.message || 'Something went wrong',
        type: 'error',
      });
    });
};

onMounted(() => {
  getPracticeManagers();
  initializeOriginalData();
});
</script>

<style scoped>
.user-name {
  font-weight: 400;
  font-size: 24px;
  margin: 0;
}

.practice-name {
  font-weight: 400;
  font-size: 13px;
  color: #737373;
  margin: 0;
}

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
  width: 60%;
}

.editable:focus {
  border: 1px solid #dfdfdf;
  padding: 4px 6px;
}

/* PIN toggle */
.toggle-btn {
  text-transform: none;
  background: #f5f5f5;
  color: #1e1e1e;
  font-weight: 500;
  font-size: 13px;
  border-radius: 6px;
}

.toggle-btn.active {
  background: #213536 !important;
  color: #ffffff !important;
}

/* Checkbox style */
.day-checkbox .v-input--selection-controls__input {
  border: 1px solid #dfdfdf !important;
}
</style>