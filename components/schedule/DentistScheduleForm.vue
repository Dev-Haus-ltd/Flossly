<template>
  <div class="schedule-form-container">
    <!-- Form Card -->
    <v-card
      elevation="0"
      class="pa-6"
      style="border: 1px solid #e5e7eb; border-radius: 8px"
    >
      <!-- Header -->
      <div class="mb-6">
        <h2 class="text-h6 text-grey-darken-3 font-weight-bold">
          {{
            isEditMode ? "Edit Dentist Schedule" : "Create New Dentist Schedule"
          }}
        </h2>
        <p class="text-caption text-grey mt-1">
          {{
            isEditMode
              ? "Update schedule settings and working hours"
              : "Set up working hours and breaks for a dentist"
          }}
        </p>
      </div>

      <!-- Stepper -->
      <v-stepper
        v-model="currentStep"
        class="mb-6"
        style="background: transparent"
      >
        <v-stepper-header>
          <v-stepper-item
            :complete="currentStep > 1"
            :value="1"
            @click="goToStep(1)"
            editable
          >
            <template #title>
              <div class="d-flex align-center">
                <v-icon
                  size="18"
                  class="mr-2"
                  :color="currentStep === 1 ? 'primary' : 'grey'"
                  >mdi-information-outline</v-icon
                >
                <span>Basic Info</span>
              </div>
            </template>
          </v-stepper-item>

          <v-divider />

          <v-stepper-item
            :complete="currentStep > 2"
            :value="2"
            @click="goToStep(2)"
            editable
          >
            <template #title>
              <div class="d-flex align-center">
                <v-icon
                  size="18"
                  class="mr-2"
                  :color="currentStep === 2 ? 'primary' : 'grey'"
                  >mdi-calendar-week</v-icon
                >
                <span>Weekly Config</span>
              </div>
            </template>
          </v-stepper-item>

          <v-divider />

          <v-stepper-item :value="3" @click="goToStep(3)" editable>
            <template #title>
              <div class="d-flex align-center">
                <v-icon
                  size="18"
                  class="mr-2"
                  :color="currentStep === 3 ? 'primary' : 'grey'"
                  >mdi-eye-outline</v-icon
                >
                <span>Preview</span>
              </div>
            </template>
          </v-stepper-item>
        </v-stepper-header>
      </v-stepper>

      <!-- Step Content -->
      <div class="form-content">
        <!-- Step 1: Basic Info -->
        <div v-show="currentStep === 1">
          <BasicInfoStep
            :form="form"
            :errors="errors"
            @update:form="updateForm"
            @update:errors="updateErrors"
            @validate="validateField"
          />
        </div>

        <!-- Step 2: Weekly Config -->
        <div v-show="currentStep === 2">
          <WeeklyConfigStep
            :week-days="form.weekDays"
            :errors="weeklyErrors"
            :is-edit-mode="isEditMode"
            :schedule-id="scheduleId"
            @update:week-days="updateWeekDays"
            @update:errors="updateWeeklyErrors"
            @break-added="onBreakAdded"
            @break-updated="onBreakUpdated"
            @break-deleted="onBreakDeleted"
          />
        </div>

        <!-- Step 3: Schedule Preview -->
        <div v-show="currentStep === 3">
          <SchedulePreviewStep :form="form" :schedule="currentSchedule" />
        </div>
      </div>

      <!-- Action Buttons -->
      <div
        class="mt-6 d-flex gap-2 justify-space-between"
        style="border-top: 1px solid #e5e7eb; padding-top: 24px"
      >
        <div>
          <v-btn v-if="currentStep > 1" variant="tonal" @click="previousStep">
            <v-icon class="mr-1" size="16">mdi-chevron-left</v-icon>
            Back
          </v-btn>
        </div>
        <div class="d-flex gap-2">
          <v-btn variant="tonal" @click="resetForm"> Reset </v-btn>
          <v-btn
            v-if="currentStep < 3"
            variant="flat"
            color="primary"
            @click="nextStep"
          >
            Continue
            <v-icon class="ml-1" size="16">mdi-chevron-right</v-icon>
          </v-btn>
          <v-btn
            v-if="currentStep === 3"
            variant="flat"
            color="primary"
            :loading="isSaving"
            @click="saveSchedule"
          >
            <v-icon class="mr-2" size="18">mdi-check</v-icon>
            {{ isEditMode ? "Update Schedule" : "Create Schedule" }}
          </v-btn>
        </div>
      </div>

      <!-- Error Display -->
      <v-alert
        v-if="error"
        type="error"
        variant="tonal"
        closable
        class="mt-4"
        @click:close="error = null"
      >
        {{ error }}
      </v-alert>
    </v-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useMainStore } from "@/stores/index";
import { useScheduleStore } from "@/stores/schedule";
import BasicInfoStep from "./BasicInfo.vue";
import WeeklyConfigStep from "./WeeklyConfig.vue";
import SchedulePreviewStep from "./ScheduleReview.vue";

const props = defineProps({
  dentistId: { type: Number, required: true },
  organisationId: { type: Number, required: true },
  scheduleId: { type: Number, default: null },
});

const emit = defineEmits(["schedule-saved", "schedule-created"]);

const mainStore = useMainStore();
const scheduleStore = useScheduleStore();

const currentStep = ref(1);
const isSaving = ref(false);
const error = ref(null);

const isEditMode = computed(() => !!props.scheduleId);
const currentSchedule = computed(() => scheduleStore.getCurrentSchedule);

// Initialize form
const form = reactive({
  scheduleName: "",
  description: "",
  startDate: new Date().toISOString().split("T")[0],
  endDate: null,
  repeatPattern: "weekly",
  isActive: true,
  weekDays: initializeWeekDays(),
});

const errors = reactive({
  scheduleName: "",
  startDate: "",
  endDate: "",
});

const weeklyErrors = reactive({});

// Helper functions
function initializeWeekDays() {
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  return days.map((name, index) => ({
    dayOfWeek: index,
    dayName: name,
    isWorkingDay: index < 5,
    startTime: "09:00",
    endTime: "17:00",
    breaks: [],
  }));
}

function updateForm(newForm) {
  Object.assign(form, newForm);
}

function updateErrors(newErrors) {
  Object.assign(errors, newErrors);
}

function updateWeeklyErrors(newErrors) {
  Object.assign(weeklyErrors, newErrors);
}

function updateWeekDays(newWeekDays) {
  form.weekDays = newWeekDays;
}

function validateField(field) {
  switch (field) {
    case "scheduleName":
      if (!form.scheduleName?.trim()) {
        errors.scheduleName = "Schedule name is required";
      } else {
        errors.scheduleName = "";
      }
      break;
    case "startDate":
      if (!form.startDate) {
        errors.startDate = "Start date is required";
      } else {
        errors.startDate = "";
      }
      break;
    case "endDate":
      if (form.endDate && form.startDate && form.endDate < form.startDate) {
        errors.endDate = "End date must be after start date";
      } else {
        errors.endDate = "";
      }
      break;
  }
}

function validateBasicInfo() {
  let isValid = true;

  if (!form.scheduleName?.trim()) {
    errors.scheduleName = "Schedule name is required";
    isValid = false;
  }

  if (!form.startDate) {
    errors.startDate = "Start date is required";
    isValid = false;
  }

  if (form.endDate && form.startDate && form.endDate < form.startDate) {
    errors.endDate = "End date must be after start date";
    isValid = false;
  }

  return isValid;
}

function validateWeeklySetup() {
  let isValid = true;

  form.weekDays.forEach((day, index) => {
    if (day.isWorkingDay) {
      if (!day.startTime || !day.endTime) {
        weeklyErrors[`day-${index}`] = "Both start and end times are required";
        isValid = false;
      } else if (timeToMinutes(day.startTime) >= timeToMinutes(day.endTime)) {
        weeklyErrors[`day-${index}`] = "Start time must be before end time";
        isValid = false;
      }
    }
  });

  return isValid;
}

function timeToMinutes(time) {
  if (!time) return 0;
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + (minutes || 0);
}

// Step navigation
function goToStep(step) {
  if (step === 2 && !validateBasicInfo()) {
    mainStore?.setSnackbar?.({
      message: "Please fill all required fields in Basic Info",
      color: "error",
    });
    return;
  }

  if (step === 3 && !validateWeeklySetup()) {
    mainStore?.setSnackbar?.({
      message: "Please fix all validation errors in Weekly Config",
      color: "error",
    });
    return;
  }

  currentStep.value = step;
}

function nextStep() {
  if (currentStep.value === 1 && !validateBasicInfo()) {
    mainStore?.setSnackbar?.({
      message: "Please fill all required fields",
      color: "error",
    });
    return;
  }

  if (currentStep.value === 2 && !validateWeeklySetup()) {
    mainStore?.setSnackbar?.({
      message: "Please fix all validation errors",
      color: "error",
    });
    return;
  }

  if (currentStep.value < 3) {
    currentStep.value++;
  }
}

function previousStep() {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
}

// Break handlers
function onBreakAdded(payload) {
  // Handle break added - maybe update some summary stats
  console.log("Break added:", payload);
}

function onBreakUpdated(payload) {
  console.log("Break updated:", payload);
}

function onBreakDeleted(payload) {
  console.log("Break deleted:", payload);
}

function resetForm() {
  form.scheduleName = "";
  form.description = "";
  form.startDate = new Date().toISOString().split("T")[0];
  form.endDate = null;
  form.repeatPattern = "weekly";
  form.isActive = true;
  form.weekDays = initializeWeekDays();

  Object.keys(errors).forEach((key) => (errors[key] = ""));
  Object.keys(weeklyErrors).forEach((key) => delete weeklyErrors[key]);

  currentStep.value = 1;
}

// Save schedule
async function saveSchedule() {
  if (!validateBasicInfo() || !validateWeeklySetup()) {
    mainStore?.setSnackbar?.({
      message: "Please fix all validation errors",
      color: "error",
    });
    return;
  }

  if (!props.organisationId) {
    error.value = "Organization not found. Please log in.";
    return;
  }

  if (!props.dentistId) {
    error.value = "Dentist not selected.";
    return;
  }

  isSaving.value = true;
  error.value = null;

  try {
    const payload = {
      organisationId: Number(props.organisationId),
      dentistId: Number(props.dentistId),
      scheduleName: form.scheduleName.trim(),
      description: form.description || "",
      startDate: form.startDate,
      endDate: form.endDate || null,
      repeatPattern: form.repeatPattern,
      isActive: form.isActive,
      weekDays: form.weekDays.map((day) => ({
        dayOfWeek: day.dayOfWeek,
        dayName: day.dayName,
        isWorkingDay: day.isWorkingDay,
        startTime: day.isWorkingDay ? day.startTime : null,
        endTime: day.isWorkingDay ? day.endTime : null,
        breaks: (day.breaks || []).map((breakItem) => ({
          breakName: breakItem.breakName,
          startTime: breakItem.startTime,
          endTime: breakItem.endTime,
        })),
      })),
    };

    let savedSchedule;

    if (isEditMode.value) {
      const basicUpdatePayload = {
        scheduleId: props.scheduleId,
        scheduleName: form.scheduleName.trim(),
        startDate: form.startDate,
        endDate: form.endDate || null,
        repeatPattern: form.repeatPattern,
        isActive: form.isActive,
        description: form.description,
      };

      await scheduleStore.updateSchedule(basicUpdatePayload);
      savedSchedule = await scheduleStore.fetchSchedule(props.scheduleId);
    } else {
      savedSchedule = await scheduleStore.createSchedule(payload);
    }

    mainStore?.setSnackbar?.({
      message: isEditMode.value
        ? "Schedule updated successfully!"
        : "Schedule created successfully!",
      color: "success",
    });

    emit("schedule-saved", savedSchedule);
    emit("schedule-created", savedSchedule);
    if (!isEditMode.value) {
      resetForm();
    }
  } catch (err) {
    console.error("Save error:", err);
    error.value = err.message || "Failed to save schedule";
    mainStore?.setSnackbar?.({
      message: error.value,
      color: "error",
    });
  } finally {
    isSaving.value = false;
  }
}

async function loadSchedule() {
  if (!isEditMode.value) {
    form.weekDays = initializeWeekDays();
    return;
  }

  try {
    await scheduleStore.fetchSchedule(props.scheduleId);
    const fetchedSchedule = scheduleStore.getCurrentSchedule;
    if (fetchedSchedule) {
      form.scheduleName = fetchedSchedule.scheduleName || "";
      form.description = fetchedSchedule.description || "";
      form.startDate = fetchedSchedule.startDate;
      form.endDate = fetchedSchedule.endDate;
      form.repeatPattern = fetchedSchedule.repeatPattern || "weekly";
      form.isActive = fetchedSchedule.isActive !== false;

      if (fetchedSchedule.days && fetchedSchedule.days.length) {
        form.weekDays = fetchedSchedule.days
          .map((day) => ({
            id: day.id,
            dayOfWeek: day.dayOfWeek,
            dayName: day.dayName,
            isWorkingDay: day.isWorkingDay,
            startTime: day.startTime || "09:00",
            endTime: day.endTime || "17:00",
            breaks:
              day.breaks?.map((breakItem) => ({
                id: breakItem.id,
                breakName: breakItem.breakName,
                startTime: breakItem.startTime,
                endTime: breakItem.endTime,
              })) || [],
          }))
          .sort((a, b) => a.dayOfWeek - b.dayOfWeek);
      } else {
        form.weekDays = initializeWeekDays();
      }
    }
  } catch (err) {
    console.error("Load error:", err);
    error.value = "Failed to load schedule";
  }
}

onMounted(() => {
  loadSchedule();
});
</script>

<style scoped lang="scss">
.schedule-form-container {
  max-width: 1200px;
  margin: 0 auto;
}

.gap-2 {
  gap: 8px;
}

:deep(.v-stepper) {
  box-shadow: none;

  .v-stepper-header {
    box-shadow: none;
    border-bottom: 1px solid #e5e7eb;
  }

  .v-stepper-item {
    .v-stepper-item__title {
      font-size: 14px;
      font-weight: 500;
    }
  }
}
</style>
