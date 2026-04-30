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

            <!-- Working Hours - Improved UX Version -->
            <div class="mt-6">
              <div class="d-flex align-center justify-space-between mb-3">
                <label class="info-label">Default Working Hours</label>
                <v-btn
                  variant="text"
                  size="small"
                  prepend-icon="mdi-refresh"
                  @click="resetAllWorkingHours"
                  class="reset-all-btn"
                >
                  Reset All
                </v-btn>
              </div>
              <div class="section-subtitle mb-4">
                Set the default start and end times for each day of the week
              </div>
              
              <v-card variant="outlined" class="working-hours-card">
                <div class="working-hours-header">
                  <div class="header-day">Day</div>
                  <div class="header-hours">Working Hours</div>
                  <div class="header-actions"></div>
                </div>
                
                <div class="working-hours-list">
                  <div 
                    v-for="(day, index) in workingDaysLabels" 
                    :key="day"
                    class="working-hours-row"
                    :class="{ 'has-changes': hasTimeChanges(workingDaysKeys[index]) }"
                  >
                    <div class="day-name">
                      <span>{{ day }}</span>
                      <v-chip 
                        v-if="isNonWorkingDay(workingDaysKeys[index])" 
                        size="x-small" 
                        color="warning" 
                        variant="tonal"
                        class="non-working-badge"
                      >
                        Non-working
                      </v-chip>
                    </div>
                    
                    <div class="time-controls" :class="{ 'disabled-controls': isNonWorkingDay(workingDaysKeys[index]) }">
                      <div class="time-input-group" :class="{ 'disabled': isNonWorkingDay(workingDaysKeys[index]) }">
                        <input
                          type="time"
                          :value="organisation.workingTimings[workingDaysKeys[index]].startTime"
                          :disabled="isNonWorkingDay(workingDaysKeys[index])"
                          @input="updateStartTime(workingDaysKeys[index], $event.target.value)"
                          class="time-input"
                          :class="{ 'time-changed': isTimeChanged(workingDaysKeys[index], 'start') }"
                          :title="isNonWorkingDay(workingDaysKeys[index]) ? 'This day is marked as non-working' : ''"
                        />
                      </div>
                      
                      <span class="time-separator">to</span>
                      
                      <div class="time-input-group" :class="{ 'disabled': isNonWorkingDay(workingDaysKeys[index]) }">
                        <input
                          type="time"
                          :value="organisation.workingTimings[workingDaysKeys[index]].endTime"
                          :disabled="isNonWorkingDay(workingDaysKeys[index])"
                          @input="updateEndTime(workingDaysKeys[index], $event.target.value)"
                          class="time-input"
                          :class="{ 'time-changed': isTimeChanged(workingDaysKeys[index], 'end') }"
                          :title="isNonWorkingDay(workingDaysKeys[index]) ? 'This day is marked as non-working' : ''"
                        />
                      </div>
                    </div>
                    
                    <div class="row-actions">
                      <v-btn
                        v-if="!isDefaultTime(workingDaysKeys[index]) && !isNonWorkingDay(workingDaysKeys[index])"
                        icon="mdi-close-circle"
                        size="small"
                        variant="text"
                        class="clear-time-btn"
                        @click="resetToDefaultTime(workingDaysKeys[index])"
                      />
                    </div>
                  </div>
                </div>
              </v-card>

              <!-- Quick Actions -->
              <!-- <div class="quick-actions mt-3">
                <v-btn
                  variant="text"
                  size="small"
                  prepend-icon="mdi-clock-time-four"
                  @click="applySameHoursToAll"
                  class="quick-action-btn"
                >
                  Apply to all days
                </v-btn>
                <v-btn
                  variant="text"
                  size="small"
                  prepend-icon="mdi-content-copy"
                  @click="copyPreviousDayHours"
                  class="quick-action-btn"
                >
                  Copy from previous day
                </v-btn>
              </div> -->
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-6">
      <v-col cols="12">
        <v-card
          elevation="0"
          class="pa-7"
          style="border: 1px solid rgba(var(--v-theme-on-surface), 0.12); border-radius: 12px"
        >
          <div class="section-title mb-2">Automation Placeholders</div>
          <div class="section-subtitle mb-4">
            These values are used to fill automation templates across email and WhatsApp.
          </div>

          <v-row>
            <v-col cols="12" md="4">
              <label class="info-label">Booking Link</label>
              <v-text-field
                v-model="automationPlaceholders.bookingLink"
                density="compact"
                variant="outlined"
                hide-details
                placeholder="https://..."
                @update:model-value="markAutomationDirty"
              />
            </v-col>
            <v-col cols="12" md="4">
              <label class="info-label">Diary Booking Link</label>
              <v-text-field
                v-model="automationPlaceholders.diaryBookingLink"
                density="compact"
                variant="outlined"
                hide-details
                placeholder="https://..."
                @update:model-value="markAutomationDirty"
              />
            </v-col>
            <v-col cols="12" md="4">
              <label class="info-label">Practice Anniversary Date</label>
              <v-menu
                v-model="menus.practiceAnniversaryDate"
                :close-on-content-click="false"
                transition="scale-transition"
                offset-y
                min-width="auto"
              >
                <template #activator="{ props }">
                  <v-text-field
                    v-bind="props"
                    :model-value="formatDate(organisation.practiceAnniversaryDate)"
                    density="compact"
                    variant="outlined"
                    hide-details
                    placeholder="Select date"
                    readonly
                  />
                </template>
                <v-date-picker
                  v-model="organisation.practiceAnniversaryDate"
                  @update:model-value="handlePracticeAnniversaryUpdate"
                />
              </v-menu>
            </v-col>
          </v-row>

          <v-row class="mt-2">
            <v-col cols="12" md="4">
              <label class="info-label">Local Charity</label>
              <v-text-field
                v-model="automationPlaceholders.localCharity"
                density="compact"
                variant="outlined"
                hide-details
                placeholder="e.g. City Dental Trust"
                @update:model-value="markAutomationDirty"
              />
            </v-col>
            <v-col cols="12" md="4">
              <label class="info-label">Local Business 1</label>
              <v-text-field
                v-model="automationPlaceholders.localBusiness1"
                density="compact"
                variant="outlined"
                hide-details
                placeholder="e.g. High Street Pharmacy"
                @update:model-value="markAutomationDirty"
              />
            </v-col>
            <v-col cols="12" md="4">
              <label class="info-label">Local Business 2</label>
              <v-text-field
                v-model="automationPlaceholders.localBusiness2"
                density="compact"
                variant="outlined"
                hide-details
                placeholder="e.g. Smile Cafe"
                @update:model-value="markAutomationDirty"
              />
            </v-col>
          </v-row>

          <v-row class="mt-2">
            <v-col cols="12" md="4">
              <label class="info-label">Local Business 3</label>
              <v-text-field
                v-model="automationPlaceholders.localBusiness3"
                density="compact"
                variant="outlined"
                hide-details
                placeholder="e.g. Community Clinic"
                @update:model-value="markAutomationDirty"
              />
            </v-col>
          </v-row>

          <v-row class="mt-2">
            <v-col cols="12" md="6">
              <label class="info-label">Parking Details</label>
              <v-textarea
                v-model="automationPlaceholders.parkingDetails"
                density="compact"
                variant="outlined"
                hide-details
                rows="2"
                placeholder="e.g. On-site parking behind the building, or street parking after 6pm."
                @update:model-value="markAutomationDirty"
              />
            </v-col>
            <v-col cols="12" md="6">
              <label class="info-label">Public Transport Details</label>
              <v-textarea
                v-model="automationPlaceholders.publicTransportDetails"
                density="compact"
                variant="outlined"
                hide-details
                rows="2"
                placeholder="e.g. 5-minute walk from Central Station, Bus 21 stop outside."
                @update:model-value="markAutomationDirty"
              />
            </v-col>
          </v-row>
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
const originalWorkingTimings = ref({});

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
  practiceAnniversaryDate: props.practiceDetails.practiceAnniversaryDate || null,
  workingTimings: props.practiceDetails.workingTimings || {
    monday: { startTime: '09:00', endTime: '17:00' },
    tuesday: { startTime: '09:00', endTime: '17:00' },
    wednesday: { startTime: '09:00', endTime: '17:00' },
    thursday: { startTime: '09:00', endTime: '17:00' },
    friday: { startTime: '09:00', endTime: '17:00' },
    saturday: { startTime: '09:00', endTime: '17:00' },
    sunday: { startTime: '09:00', endTime: '17:00' },
  },
});

const automationPlaceholders = reactive({
  bookingLink: props.practiceDetails.automationPlaceholders?.bookingLink || '',
  diaryBookingLink: props.practiceDetails.automationPlaceholders?.diaryBookingLink || '',
  localCharity: props.practiceDetails.automationPlaceholders?.localCharity || '',
  localBusiness1: props.practiceDetails.automationPlaceholders?.localBusiness1 || '',
  localBusiness2: props.practiceDetails.automationPlaceholders?.localBusiness2 || '',
  localBusiness3: props.practiceDetails.automationPlaceholders?.localBusiness3 || '',
  parkingDetails: props.practiceDetails.automationPlaceholders?.parkingDetails || '',
  publicTransportDetails: props.practiceDetails.automationPlaceholders?.publicTransportDetails || '',
});

const practiceManagers = ref([]);
const menus = reactive({ cqcInspectionDate: false, practiceAnniversaryDate: false });
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const workingDaysKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const workingDaysLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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
    practiceAnniversaryDate: organisation.practiceAnniversaryDate || null,
    pinCodeVerification: organisation.pinCodeVerification || 'yes',
    nonWorkingDays: Array.isArray(organisation.nonWorkingDays) ? [...organisation.nonWorkingDays] : [],
    automationPlaceholders: { ...automationPlaceholders },
    workingTimings: organisation.workingTimings ? JSON.parse(JSON.stringify(organisation.workingTimings)) : {},
  };
  originalWorkingTimings.value = JSON.parse(JSON.stringify(organisation.workingTimings));
};

// Mark a field as dirty
const markDirty = (fieldName) => {
  dirtyFields[fieldName] = true;
};

// Working hours helper functions
const isDefaultTime = (dayKey) => {
  const timings = organisation.workingTimings[dayKey];
  return timings.startTime === '09:00' && timings.endTime === '17:00';
};

const isTimeChanged = (dayKey, type) => {
  const original = originalWorkingTimings.value[dayKey];
  const current = organisation.workingTimings[dayKey];
  if (!original) return false;
  return type === 'start' ? original.startTime !== current.startTime : original.endTime !== current.endTime;
};

const hasTimeChanges = (dayKey) => {
  // Non-working days should not show as having changes
  if (isNonWorkingDay(dayKey)) {
    return false;
  }
  return isTimeChanged(dayKey, 'start') || isTimeChanged(dayKey, 'end');
};

const isNonWorkingDay = (dayKey) => {
  const dayMap = {
    monday: 'Mon',
    tuesday: 'Tue',
    wednesday: 'Wed',
    thursday: 'Thu',
    friday: 'Fri',
    saturday: 'Sat',
    sunday: 'Sun'
  };
  return organisation.nonWorkingDays.includes(dayMap[dayKey]);
};

const updateStartTime = (dayKey, value) => {
  // Prevent updates for non-working days
  if (isNonWorkingDay(dayKey)) {
    mainStore.setSnackbar({
      title: 'Cannot update working hours for non-working days',
      type: 'warning',
    });
    return;
  }
  organisation.workingTimings[dayKey].startTime = value;
  markWorkingHoursDirty();
};

const updateEndTime = (dayKey, value) => {
  // Prevent updates for non-working days
  if (isNonWorkingDay(dayKey)) {
    mainStore.setSnackbar({
      title: 'Cannot update working hours for non-working days',
      type: 'warning',
    });
    return;
  }
  organisation.workingTimings[dayKey].endTime = value;
  markWorkingHoursDirty();
};

const resetToDefaultTime = (dayKey) => {
  organisation.workingTimings[dayKey].startTime = '09:00';
  organisation.workingTimings[dayKey].endTime = '17:00';
  markWorkingHoursDirty();
};

const resetAllWorkingHours = () => {
  workingDaysKeys.forEach(dayKey => {
    organisation.workingTimings[dayKey].startTime = '09:00';
    organisation.workingTimings[dayKey].endTime = '17:00';
  });
  markWorkingHoursDirty();
};

const applySameHoursToAll = () => {
  const firstDayKey = workingDaysKeys[0];
  const { startTime, endTime } = organisation.workingTimings[firstDayKey];
  workingDaysKeys.forEach(dayKey => {
    organisation.workingTimings[dayKey].startTime = startTime;
    organisation.workingTimings[dayKey].endTime = endTime;
  });
  markWorkingHoursDirty();
};

const copyPreviousDayHours = () => {
  for (let i = workingDaysKeys.length - 1; i > 0; i--) {
    const currentDay = workingDaysKeys[i];
    const previousDay = workingDaysKeys[i - 1];
    organisation.workingTimings[currentDay].startTime = organisation.workingTimings[previousDay].startTime;
    organisation.workingTimings[currentDay].endTime = organisation.workingTimings[previousDay].endTime;
  }
  markWorkingHoursDirty();
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

const handlePracticeAnniversaryUpdate = (val) => {
  menus.practiceAnniversaryDate = false;
  organisation.practiceAnniversaryDate = val;
  markDirty('practiceAnniversaryDate');
};

const markAutomationDirty = () => {
  markDirty('automationPlaceholders');
};

const markWorkingHoursDirty = () => {
  markDirty('workingTimings');
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
    } else if (fieldName === 'practiceAnniversaryDate') {
      payload.append(fieldName, value || '');
    } else if (fieldName === 'automationPlaceholders') {
      payload.append(fieldName, JSON.stringify(automationPlaceholders));
    } else if (fieldName === 'workingTimings') {
      payload.append(fieldName, JSON.stringify(organisation.workingTimings));
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
        
        // Update local organisation object with response data to sync frontend state
        if (res.data) {
          // Merge response data into local organisation reactive object
          Object.keys(res.data).forEach((key) => {
            if (key in organisation) {
              organisation[key] = res.data[key];
            }
          });
          
          // Also update mainStore with latest organisation data
          mainStore.organisation = res.data;
        }
        
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

// Watch for prop changes to sync practice details
watch(
  () => props.practiceDetails,
  (newPracticeDetails) => {
    if (newPracticeDetails && newPracticeDetails.id) {
      // Sync prop changes into local organisation object
      Object.keys(newPracticeDetails).forEach((key) => {
        if (key === 'name') {
          organisation.fullName = newPracticeDetails.name;
        } else if (key === 'automationPlaceholders' && newPracticeDetails[key]) {
          Object.assign(automationPlaceholders, newPracticeDetails[key]);
        } else if (key in organisation) {
          organisation[key] = newPracticeDetails[key];
        }
      });
      // Reinitialize original data since props have changed
      initializeOriginalData();
    }
  },
  { deep: true }
);

// Watch for changes to non-working days
watch(
  () => organisation.nonWorkingDays,
  (newNonWorkingDays) => {
    // When a day is marked as non-working, its hours shouldn't be editable
    // This is a UI-level enforcement; backend will also validate
    markDirty('nonWorkingDays');
  },
  { deep: true }
);
</script>

<style scoped>
.section-title {
  font-weight: 600;
  font-size: 16px;
  color: #111827;
}

.section-subtitle {
  font-size: 13px;
  color: #6b7280;
}

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

/* Working hours styles - Improved UX */
.working-hours-card {
  border-radius: 12px !important;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.working-hours-header {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  font-weight: 600;
  font-size: 13px;
  color: #6b7280;
}

.header-day {
  flex: 0 0 120px;
}

.header-hours {
  flex: 1;
}

.header-actions {
  flex: 0 0 40px;
}

.working-hours-list {
  background: white;
}

.working-hours-row {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.2s ease;
}

.working-hours-row:hover {
  background-color: #fafafa;
}

.working-hours-row.has-changes {
  background-color: #fefce8;
}

.working-hours-row:last-child {
  border-bottom: none;
}

.day-name {
  flex: 0 0 120px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  font-size: 14px;
  color: #1e1e1e;
}

.non-working-badge {
  font-size: 10px;
  padding: 2px 6px;
}

.time-controls {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.time-controls.disabled-controls {
  opacity: 0.5;
  pointer-events: none;
}

.time-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 6px 12px;
  transition: all 0.2s ease;
}

.time-input-group:hover {
  border-color: #213536;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.time-input-group.disabled {
  background: #f9fafb;
  border-color: #d1d5db;
  opacity: 0.7;
  cursor: not-allowed;
}

.time-icon {
  color: #9ca3af;
}

.time-input {
  border: none;
  background: transparent;
  font-size: 14px;
  font-family: inherit;
  color: #1e1e1e;
  outline: none;
  width: 100px;
  cursor: pointer;
}

.time-input:disabled {
  color: #9ca3af;
  cursor: not-allowed;
  opacity: 0.6;
}

.time-input.time-changed {
  color: #d97706;
  font-weight: 500;
}

.time-input.time-changed:disabled {
  color: #9ca3af;
}

.time-input::-webkit-calendar-picker-indicator {
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  opacity: 0.5;
  transition: opacity 0.2s ease;
}

.time-input::-webkit-calendar-picker-indicator:hover {
  background-color: #f3f4f6;
  opacity: 1;
}

.time-separator {
  color: #9ca3af;
  font-size: 13px;
  font-weight: 500;
}

.row-actions {
  flex: 0 0 40px;
  display: flex;
  justify-content: flex-end;
}

.clear-time-btn {
  opacity: 0.5;
  transition: opacity 0.2s ease;
}

.clear-time-btn:hover {
  opacity: 1;
}

.quick-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.quick-action-btn {
  font-size: 12px;
  text-transform: none;
  color: #6b7280;
}

.quick-action-btn:hover {
  color: #213536;
  background-color: #f3f4f6;
}

.reset-all-btn {
  font-size: 12px;
  text-transform: none;
  color: #ef4444;
}

.reset-all-btn:hover {
  background-color: #fee2e2;
}

/* Responsive design */
@media (max-width: 768px) {
  .working-hours-header {
    display: none;
  }
  
  .working-hours-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
  }
  
  .day-name {
    flex: auto;
    width: 100%;
  }
  
  .time-controls {
    flex: auto;
    width: 100%;
    flex-wrap: wrap;
  }
  
  .time-input-group {
    flex: 1;
  }
  
  .time-input {
    width: auto;
    flex: 1;
  }
  
  .row-actions {
    flex: auto;
    width: 100%;
    justify-content: flex-start;
  }
  
  .quick-actions {
    flex-direction: column;
  }
}
</style>