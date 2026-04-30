<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="600"
    scrollable
    :persistent="isLoading"
  >
    <v-card rounded="xl" elevation="4" style="overflow: hidden">
      <!-- Header -->
      <v-toolbar flat color="white" height="56">
        <v-toolbar-title class="title-text pl-2">
          {{ isEditMode ? "Edit Zone" : "New Zone" }}
        </v-toolbar-title>
        <v-spacer />
        <v-btn icon variant="text" size="small" @click="closeModal">
          <v-icon size="18">mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-divider />

      <!-- Body -->
      <v-card-text
        class="pa-5"
        style="background: #f9fafb; max-height: 70vh; overflow-y: auto"
      >
        <!-- Summary -->
        <div class="summary-row mb-4">
          <div class="summary-dot"></div>
          <div>
            <div class="text-body-2 font-weight-medium">
              {{ isEditMode ? "Edit Zone" : "Create Zone" }}
            </div>
            <div class="text-caption text-grey">
              Configure zone timing, color and repetition
            </div>
          </div>
        </div>

        <!-- Form Card -->
        <v-card elevation="0" rounded="lg" class="pa-4" color="white">
          <v-form ref="formRef">
            <v-row dense>
              <!-- Title -->
              <v-col cols="12">
                <label class="fld-lbl">Zone Title *</label>
                <v-text-field
                  v-model="form.title"
                  variant="outlined"
                  density="compact"
                  placeholder="e.g. Lunch Break"
                  class="mt-1"
                  :error="!!validationErrors.title"
                  :error-messages="validationErrors.title"
                  @input="clearFieldError('title')"
                />
              </v-col>

              <!-- Color -->
              <v-col cols="6">
                <label class="fld-lbl">Color *</label>
                <div class="d-flex align-center mt-2" style="gap: 10px">
                  <input
                    type="color"
                    v-model="form.color"
                    class="color-input"
                    @change="clearFieldError('color')"
                  />
                  <v-text-field
                    v-model="form.color"
                    density="compact"
                    variant="outlined"
                    hide-details
                    :error="!!validationErrors.color"
                    @input="clearFieldError('color')"
                  />
                </div>
                <div v-if="validationErrors.color" class="text-error text-caption mt-1">
                  {{ validationErrors.color }}
                </div>
              </v-col>

              <!-- Dentist -->
              <v-col cols="6">
                <label class="fld-lbl">Practitioner *</label>
                <v-autocomplete
                  v-model="form.dentistId"
                  :items="dentists"
                  item-title="name"
                  item-value="id"
                  variant="outlined"
                  density="compact"
                  class="mt-1"
                  :error="!!validationErrors.dentistId"
                  :error-messages="validationErrors.dentistId"
                  @update:model-value="clearFieldError('dentistId')"
                />
              </v-col>

              <!-- Time -->
              <v-col cols="6">
                <label class="fld-lbl">Start Time *</label>
                <v-text-field
                  v-model="form.startTime"
                  type="time"
                  variant="outlined"
                  density="compact"
                  class="mt-1"
                  :error="!!validationErrors.startTime"
                  :error-messages="validationErrors.startTime"
                  @input="clearFieldError('startTime')"
                />
              </v-col>

              <v-col cols="6">
                <label class="fld-lbl">End Time *</label>
                <v-text-field
                  v-model="form.endTime"
                  type="time"
                  variant="outlined"
                  density="compact"
                  class="mt-1"
                  :error="!!validationErrors.endTime"
                  :error-messages="validationErrors.endTime"
                  @input="clearFieldError('endTime')"
                />
              </v-col>

              <!-- Days -->
              <v-col cols="12">
                <label class="fld-lbl">Days *</label>
                <v-select
                  v-model="form.selectedDays"
                  :items="dayOptions"
                  item-title="title"
                  item-value="value"
                  multiple
                  chips
                  closable-chips
                  variant="outlined"
                  density="compact"
                  class="mt-1"
                  placeholder="Select days"
                  :error="!!validationErrors.selectedDays"
                  :error-messages="validationErrors.selectedDays"
                  @update:model-value="clearFieldError('selectedDays')"
                />
              </v-col>

              <!-- Dates -->
              <!-- Start Date -->
              <v-col cols="6">
                <label class="fld-lbl">Start Date *</label>
                <v-menu v-model="startDateMenu" :close-on-content-click="false">
                  <template #activator="{ props }">
                    <v-text-field
                      v-bind="props"
                      :model-value="
                        form.startDate ? formatDateDDMMYYYY(form.startDate) : ''
                      "
                      variant="outlined"
                      density="compact"
                      class="mt-1"
                      readonly
                      :error="!!validationErrors.startDate"
                      :error-messages="validationErrors.startDate"
                      @click="clearFieldError('startDate')"
                    >
                      <template #append-inner>
                        <v-icon size="16" @click.stop="startDateMenu = true">
                          mdi-calendar
                        </v-icon>
                      </template>
                    </v-text-field>
                  </template>

                  <v-date-picker
                    v-model="form.startDate"
                    @update:model-value="handleStartDateChange"
                    color="primary"
                  />
                </v-menu>
              </v-col>

              <!-- End Date -->
              <v-col cols="6">
                <label class="fld-lbl">End Date *</label>
                <v-menu v-model="endDateMenu" :close-on-content-click="false">
                  <template #activator="{ props }">
                    <v-text-field
                      v-bind="props"
                      :model-value="
                        form.endDate ? formatDateDDMMYYYY(form.endDate) : ''
                      "
                      variant="outlined"
                      density="compact"
                      class="mt-1"
                      readonly
                      :error="!!validationErrors.endDate"
                      :error-messages="validationErrors.endDate"
                      @click="clearFieldError('endDate')"
                    >
                      <template #append-inner>
                        <v-icon size="16" @click.stop="endDateMenu = true">
                          mdi-calendar
                        </v-icon>
                      </template>
                    </v-text-field>
                  </template>

                  <v-date-picker
                    v-model="form.endDate"
                    @update:model-value="handleEndDateChange"
                    color="primary"
                  />
                </v-menu>
              </v-col>

              <!-- Repeat -->
              <v-col cols="6">
                <label class="fld-lbl">Repeat *</label>
                <v-select
                  v-model="form.repeatPattern"
                  :items="repeatPatterns"
                  variant="outlined"
                  density="compact"
                  class="mt-1"
                  :error="!!validationErrors.repeatPattern"
                  :error-messages="validationErrors.repeatPattern"
                  @update:model-value="clearFieldError('repeatPattern')"
                />
              </v-col>

              <!-- Display -->
              <v-col cols="6">
                <label class="fld-lbl">Display *</label>
                <v-select
                  v-model="form.displayType"
                  :items="displayTypes"
                  variant="outlined"
                  density="compact"
                  class="mt-1"
                  :error="!!validationErrors.displayType"
                  :error-messages="validationErrors.displayType"
                  @update:model-value="clearFieldError('displayType')"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card>
      </v-card-text>

      <v-divider />

      <!-- Footer -->
      <v-card-actions class="pa-4" style="gap: 12px">
        <v-btn
          variant="outlined"
          color="#6b7280"
          style="flex: 1; border-radius: 10px"
          @click="closeModal"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          style="flex: 1; border-radius: 10px"
          :loading="isLoading"
          @click="handleSubmit"
        >
          {{ isEditMode ? "Save Changes" : "Create Zone" }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { formatDateDDMMYYYY } from "@/lib/dateFormatter";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  zone: {
    type: Object,
    default: null,
  },
  dentists: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["update:modelValue", "save", "close"]);

const formRef = ref(null);
const showColorPicker = ref(false);
const isLoading = ref(false);
const startDateMenu = ref(false);
const endDateMenu = ref(false);
const validationErrors = ref({});

const getToday = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

const getTodayDayIndex = () => {
  const day = new Date().getDay();
  return day === 0 ? 6 : day - 1;
};

const form = ref({
  id: undefined,
  title: "",
  color: "#0061FB",
  dentistId: null,
  startTime: "09:00",
  endTime: "10:00",
  selectedDays: [getTodayDayIndex()],
  startDate: getToday(),
  endDate: getToday(),
  repeatPattern: "weekly",
  displayType: "background",
});

const colorPresets = [
  "#0061FB", // Primary
  "#FF6B6B", // Red
  "#4ECDC4", // Teal
  "#FFE66D", // Yellow
  "#95E1D3", // Mint
  "#F38181", // Pink
  "#AA96DA", // Purple
  "#FCBAD3", // Light Pink
];

const dayOptions = [
  { title: "Monday", value: 0 },
  { title: "Tuesday", value: 1 },
  { title: "Wednesday", value: 2 },
  { title: "Thursday", value: 3 },
  { title: "Friday", value: 4 },
  { title: "Saturday", value: 5 },
  { title: "Sunday", value: 6 },
];

const repeatPatterns = [
  { title: "Weekly", value: "weekly" },
  { title: "Biweekly", value: "bi-weekly" },
  { title: "Monthly", value: "monthly" },
];

const displayTypes = [
  { title: "Background", value: "background" },
  { title: "Border", value: "border" },
  { title: "Both", value: "both" },
];

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const isEditMode = computed(() => !!form.value.id);

// Validation function
const validateForm = () => {
  const errors = {};
  
  // Validate Title
  if (!form.value.title || form.value.title.trim() === "") {
    errors.title = "Zone title is required";
  } else if (form.value.title.length < 2) {
    errors.title = "Zone title must be at least 2 characters";
  } else if (form.value.title.length > 50) {
    errors.title = "Zone title must be less than 50 characters";
  }
  
  // Validate Color
  if (!form.value.color) {
    errors.color = "Color is required";
  } else if (!/^#[0-9A-Fa-f]{6}$/.test(form.value.color)) {
    errors.color = "Please select a valid color";
  }
  
  // Validate Dentist
  if (!form.value.dentistId) {
    errors.dentistId = "Practitioner is required";
  }
  
  // Validate Start Time
  if (!form.value.startTime) {
    errors.startTime = "Start time is required";
  }
  
  // Validate End Time
  if (!form.value.endTime) {
    errors.endTime = "End time is required";
  } else if (form.value.startTime && form.value.endTime) {
    // Check if end time is after start time
    if (form.value.endTime <= form.value.startTime) {
      errors.endTime = "End time must be after start time";
    }
  }
  
  // Validate Days
  if (!form.value.selectedDays || form.value.selectedDays.length === 0) {
    errors.selectedDays = "Please select at least one day";
  }
  
  // Validate Start Date
  if (!form.value.startDate) {
    errors.startDate = "Start date is required";
  }
  
  // Validate End Date
  if (!form.value.endDate) {
    errors.endDate = "End date is required";
  } else if (form.value.startDate && form.value.endDate) {
    if (form.value.endDate < form.value.startDate) {
      errors.endDate = "End date cannot be before start date";
    }
  }
  
  // Validate Repeat Pattern
  if (!form.value.repeatPattern) {
    errors.repeatPattern = "Repeat pattern is required";
  }
  
  // Validate Display Type
  if (!form.value.displayType) {
    errors.displayType = "Display type is required";
  }
  
  validationErrors.value = errors;
  return Object.keys(errors).length === 0;
};

// Clear error for a specific field
const clearFieldError = (fieldName) => {
  if (validationErrors.value[fieldName]) {
    delete validationErrors.value[fieldName];
  }
};

// Clear all errors
const clearAllErrors = () => {
  validationErrors.value = {};
};

// Handle start date change
const handleStartDateChange = (value) => {
  form.value.startDate = value;
  startDateMenu.value = false;
  clearFieldError('startDate');
  
  if (!form.value.endDate || form.value.endDate < value) {
    form.value.endDate = value;
    clearFieldError('endDate');
  }
  
  if (form.value.selectedDays.length <= 1) {
    const date = new Date(value);
    const day = date.getDay();
    const index = day === 0 ? 6 : day - 1;
    form.value.selectedDays = [index];
  }
};

// Handle end date change
const handleEndDateChange = (value) => {
  form.value.endDate = value;
  endDateMenu.value = false;
  clearFieldError('endDate');
};

const toggleDay = (dayIndex) => {
  const index = form.value.selectedDays.indexOf(dayIndex);
  if (index > -1) {
    form.value.selectedDays.splice(index, 1);
  } else {
    form.value.selectedDays.push(dayIndex);
    form.value.selectedDays.sort((a, b) => a - b);
  }
  clearFieldError('selectedDays');
};

const closeModal = () => {
  clearAllErrors();
  isOpen.value = false;
  emit("close");
};

const handleSubmit = async () => {
  // Run validation
  const isValid = validateForm();
  
  if (!isValid) {
    // Scroll to first error
    const firstErrorField = Object.keys(validationErrors.value)[0];
    if (firstErrorField) {
      const errorElement = document.querySelector(`[data-field="${firstErrorField}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    return;
  }
  
  isLoading.value = true;
  try {
const payload = {
  ...form.value,
  startDate: form.value.startDate,
  endDate: form.value.endDate,
};
    // Clean up payload
    payload.title = payload.title.trim();
    emit("save", payload);
    clearAllErrors();
    isOpen.value = false;
  } catch (err) {
    console.error("Error saving zone:", err);
  } finally {
    isLoading.value = false;
  }
};

// Watch for zone prop changes (edit/duplicate)
watch(
  () => props.zone,
  (newZone) => {
    clearAllErrors();
    if (newZone) {
      form.value = {
        id: newZone.id,
        title: newZone.title || "",
        color: newZone.color || "#0061FB",
        dentistId: newZone.dentistId || null,
        startTime: newZone.startTime || "09:00",
        endTime: newZone.endTime || "10:00",
        selectedDays: Array.isArray(newZone.selectedDays)
          ? [...newZone.selectedDays]
          : [1, 2, 3, 4, 5],
        startDate: newZone.startDate || "",
        endDate: newZone.endDate || "",
        repeatPattern: newZone.repeatPattern || "weekly",
        displayType: newZone.displayType || "background",
      };
    } else {
      // Reset form for create
      form.value = {
        id: undefined,
        title: "",
        color: "#0061FB",
        dentistId: null,
        startTime: "09:00",
        endTime: "10:00",
        selectedDays: [getTodayDayIndex()],
        startDate: getToday(),
        endDate: getToday(),
        repeatPattern: "weekly",
        displayType: "background",
      };
    }
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
.title-text {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.fld-lbl {
  font-size: 12px;
  font-weight: 500;
  color: #4b5563;
}

.summary-row {
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  border-radius: 10px;
  padding: 10px 14px;
  border: 1px solid #e5e7eb;
}

.summary-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #60a5fa, #3b82f6);
}

.color-input {
  width: 40px;
  height: 34px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
}

.text-error {
  color: #dc2626;
}

.color-preview {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  cursor: pointer;
  border: 2px solid #e5e7eb;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.05);
  }
}

.color-palette {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.color-dot {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 3px solid transparent;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: scale(1.1);
  }

  &.active {
    border-color: #111827;
  }
}

.time-picker {
  max-height: 300px;
}

.preview-box {
  padding: 12px;
  background-color: #f9fafb;
  border-radius: 8px;
}

.preview-item {
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  border: 2px solid;
  text-align: center;
  flex: 1;
}

.preview-background {
  background-color: var(--color-bg, #f0f0f0);
  border-color: var(--color-border, #ccc);
  color: #111827;
}

.preview-border {
  background-color: transparent;
  border-color: currentColor;
  color: #111827;
}

.preview-both {
  background-color: var(--color-bg, #f0f0f0);
  border-color: var(--color-border, #ccc);
  color: #111827;
}

.grid-cols-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.gap-3 {
  gap: 12px;
}

.gap-2 {
  gap: 8px;
}

.cursor-pointer {
  cursor: pointer;
}
</style>