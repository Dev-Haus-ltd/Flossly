<template>
  <v-row>
    <!-- Schedule Name -->
    <v-col cols="12" md="6">
      <label class="text-caption font-weight-medium text-grey-darken-1">
        Schedule Name <span class="text-error">*</span>
      </label>
      <v-text-field
        :model-value="form.scheduleName"
        @update:model-value="updateField('scheduleName', $event)"
        placeholder="e.g., Main Weekly Schedule"
        variant="outlined"
        density="compact"
        class="mt-1"
        :error="!!errors.scheduleName"
        :error-messages="errors.scheduleName"
        @blur="validateField('scheduleName')"
      />
      <div class="text-caption text-grey mt-1">
        A descriptive name for this schedule
      </div>
    </v-col>

    <!-- Repeat Pattern -->
    <v-col cols="12" md="6">
      <label class="text-caption font-weight-medium text-grey-darken-1">
        Repeat Pattern <span class="text-error">*</span>
      </label>
      <v-select
        :model-value="form.repeatPattern"
        @update:model-value="updateField('repeatPattern', $event)"
        :items="repeatPatterns"
        item-title="title"
        item-value="value"
        variant="outlined"
        density="compact"
        class="mt-1"
      />
      <div class="text-caption text-grey mt-1">
        How often this schedule repeats
      </div>
    </v-col>

    <!-- Start Date with Date Picker -->
    <v-col cols="12" md="6">
      <label class="text-caption font-weight-medium text-grey-darken-1">
        Start Date <span class="text-error">*</span>
      </label>
      <div class="mt-1">
        <v-menu
          v-model="startDatePickerOpen"
          :close-on-content-click="false"
          location="bottom start"
          transition="scale-transition"
        >
          <template #activator="{ props: menuProps }">
            <button
              v-bind="menuProps"
              class="date-picker-trigger d-flex align-center px-3 py-2 rounded-md w-100"
              :class="{ 'border-error': errors.startDate }"
              @click="startDatePickerOpen = true"
            >
              <v-icon size="18" class="mr-2 text-primary"
                >mdi-calendar-month-outline</v-icon
              >
              <span class="text-body-2 font-weight-medium text-grey-darken-3">{{
                formattedStartDate
              }}</span>
              <v-icon size="16" class="ml-auto text-grey-lighten-1"
                >mdi-chevron-down</v-icon
              >
            </button>
          </template>
          <v-card elevation="12" rounded="lg" class="mt-1">
            <v-date-picker
              :model-value="form.startDate"
              color="primary"
              density="compact"
              @update:model-value="onStartDateChange"
              :weekday-format="$vuetify.display.width > 550 ? 'long' : 'short'"
              width="600"
            />
          </v-card>
        </v-menu>
        <div v-if="errors.startDate" class="text-caption text-error mt-1">
          {{ errors.startDate }}
        </div>
      </div>
      <div class="text-caption text-grey mt-1">
        When this schedule becomes active
      </div>
    </v-col>

    <!-- End Date with Date Picker -->
    <v-col cols="12" md="6">
      <label class="text-caption font-weight-medium text-grey-darken-1">
        End Date
        <span class="text-grey-lighten-1">(Optional)</span>
      </label>
      <div class="mt-1">
        <v-menu
          v-model="endDatePickerOpen"
          :close-on-content-click="false"
          location="bottom start"
          transition="scale-transition"
        >
          <template #activator="{ props: menuProps }">
            <button
              v-bind="menuProps"
              class="date-picker-trigger d-flex align-center px-3 py-2 rounded-md w-100"
              :class="{ 'border-error': errors.endDate }"
              @click="endDatePickerOpen = true"
            >
              <v-icon size="18" class="mr-2 text-primary"
                >mdi-calendar-month-outline</v-icon
              >
              <span class="text-body-2 font-weight-medium text-grey-darken-3">{{
                formattedEndDate || "No end date"
              }}</span>
              <v-icon size="16" class="ml-auto text-grey-lighten-1"
                >mdi-chevron-down</v-icon
              >
            </button>
          </template>
          <v-card elevation="12" rounded="lg" class="mt-1">
            <v-date-picker
              :model-value="form.endDate"
              color="primary"
              density="compact"
              @update:model-value="onEndDateChange"
              :weekday-format="$vuetify.display.width > 550 ? 'long' : 'short'"
              width="600"
            />
          </v-card>
        </v-menu>
        <div v-if="errors.endDate" class="text-caption text-error mt-1">
          {{ errors.endDate }}
        </div>
      </div>
      <div class="text-caption text-grey mt-1">
        When the schedule ends (leave empty for open-ended)
      </div>
    </v-col>

    <!-- Description -->
    <v-col cols="12">
      <label class="text-caption font-weight-medium text-grey-darken-1">
        Description
      </label>
      <v-textarea
        :model-value="form.description"
        @update:model-value="updateField('description', $event)"
        placeholder="Add notes about this schedule (optional)"
        variant="outlined"
        density="compact"
        class="mt-1"
        rows="3"
      />
      <div class="text-caption text-grey mt-1">
        Internal notes about this schedule
      </div>
    </v-col>

    <!-- Active Toggle -->
    <v-col cols="12">
      <label class="text-caption font-weight-medium text-grey-darken-1">
        Enable Schedule
      </label>
      <div class="d-flex align-center gap-3 mt-2">
        <v-switch
          :model-value="form.isActive"
          @update:model-value="updateField('isActive', $event)"
          color="primary"
          hide-details
        />
        <span class="text-caption text-grey">
          {{ form.isActive ? "Schedule is active" : "Schedule is inactive" }}
        </span>
      </div>
      <div class="text-caption text-grey mt-1">
        Enable or disable this schedule without deleting
      </div>
    </v-col>
  </v-row>
</template>

<script setup>
import { ref, computed } from "vue";
import { formatTimeToHHMM, formatTimeTo12Hour } from "@/lib/timeFormatters";

const props = defineProps({
  form: { type: Object, required: true },
  errors: { type: Object, required: true },
});

const emit = defineEmits(["update:form", "update:errors", "validate"]);

const startDatePickerOpen = ref(false);
const endDatePickerOpen = ref(false);

const repeatPatterns = [
  { title: "Weekly", value: "weekly" },
  { title: "Bi-Weekly", value: "bi-weekly" },
  { title: "Monthly", value: "monthly" },
];

const formattedStartDate = computed(() => {
  if (!props.form.startDate) return "Select date";
  const date = new Date(props.form.startDate);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
});

const formattedEndDate = computed(() => {
  if (!props.form.endDate) return "";
  const date = new Date(props.form.endDate);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
});

// CRITICAL: Update field and immediately sync to parent
function updateField(field, value) {
  console.log(`🔄 Updating ${field} to:`, value);
  const updatedForm = { ...props.form, [field]: value };
  emit("update:form", updatedForm);

  // Clear error when user starts typing
  if (field === "scheduleName" && value?.trim()) {
    emit("update:errors", { ...props.errors, scheduleName: "" });
  }
}

// Helper function to format date
function formatDate(date) {
  if (!date) return null;

  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Date handlers
const onStartDateChange = (val) => {
  if (val) {
    updateField("startDate", formatDate(val));
    startDatePickerOpen.value = false;
    validateField("startDate");
  }
};

const onEndDateChange = (val) => {
  if (val) {
    updateField("endDate", formatDate(val));
    endDatePickerOpen.value = false;
    validateField("endDate");
  } else if (val === null) {
    updateField("endDate", null);
    endDatePickerOpen.value = false;
    validateField("endDate");
  }
};

const validateField = (field) => {
  emit("validate", field);
};
</script>

<style scoped lang="scss">
.gap-3 {
  gap: 12px;
}

.text-error {
  color: #ef4444;
}

.border-error {
  border: 1px solid #ef4444 !important;
}

.date-picker-trigger {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    border-color: #d1d5db;
  }

  &:focus-visible {
    outline: none;
    border-color: #0061fb;
    box-shadow: 0 0 0 2px rgba(0, 97, 251, 0.1);
  }
}

.w-100 {
  width: 100%;
}
</style>
