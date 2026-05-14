<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="560"
    scrollable
    :persistent="loading"
  >
    <v-card rounded="xl" elevation="4" style="overflow: hidden">
      <!-- Header -->
      <v-toolbar flat color="white" height="56">
        <v-toolbar-title class="title-text pl-2">
          {{ dialogTitle }}
        </v-toolbar-title>
        <v-spacer />
        <v-btn
          icon
          variant="text"
          size="small"
          @click="$emit('update:modelValue', false)"
          class="mr-2"
        >
          <v-icon size="18">mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-divider />

      <!-- Body -->
      <v-card-text
        class="pa-5"
        style="background: #f9fafb; max-height: 70vh; overflow-y: auto"
      >
        <!-- Summary chip -->
        <div class="summary-row mb-4">
          <div class="summary-dot"></div>
          <div>
            <div class="text-body-2 font-weight-medium">{{ dialogTitle }}</div>
            <div class="text-caption text-grey">
              {{ dialogSubtitle }}
            </div>
          </div>
        </div>

        <v-card elevation="0" rounded="lg" class="pa-4" color="white">
          <v-row dense>
<v-col cols="6">
    <label class="fld-lbl">
      Treatment Name <span class="req-star">*</span>
    </label>
    <v-text-field
      v-model="form.name"
      variant="outlined"
      density="compact"
      class="mt-1"
      placeholder="Enter name"
      :error="!!errors.name"
      :error-messages="errors.name ? [errors.name] : []"
      hide-details="auto"
      @input="clearError('name')"
    />
  </v-col>

  <v-col cols="6">
    <label class="fld-lbl">Treatment Code</label>
    <v-text-field
      v-model="form.code"
      variant="outlined"
      density="compact"
      class="mt-1"
      placeholder="e.g. RCT"
      :error="!!errors.code"
      :error-messages="errors.code ? [errors.code] : []"
      hide-details="auto"
      @input="clearError('code')"
    />
  </v-col>



<v-row dense>
  <!-- Color -->
  <v-col cols="6">
    <label class="fld-lbl">
      Color <span class="req-star">*</span>
    </label>

    <div class="d-flex align-center mt-2" style="gap: 10px">
      <input
        type="color"
        v-model="form.color"
        style="
          width: 40px;
          height: 34px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          cursor: pointer;
          background: white;
        "
      />

      <v-text-field
        v-model="form.color"
        variant="outlined"
        density="compact"
        hide-details
      />
    </div>
  </v-col>

  <!-- Amount -->
  <v-col cols="6">
    <label class="fld-lbl">
      Amount <span class="req-star">*</span>
    </label>
    <v-text-field
      v-model="form.amount"
      variant="outlined"
      density="compact"
      type="number"
      class="mt-1"
      placeholder="0"
      :error="!!errors.amount"
      :error-messages="errors.amount ? [errors.amount] : []"
      hide-details="auto"
      @input="clearError('amount')"
    />
  </v-col>
</v-row>
            <!-- Duration & Price Row -->
            <v-col cols="6">
              <label class="fld-lbl"
                >Duration (minutes) <span class="req-star">*</span></label
              >
              <v-select
                v-model="form.defaultDuration"
                :items="durationOptions"
                variant="outlined"
                density="compact"
                class="mt-1"
                :error="!!errors.defaultDuration"
                :error-messages="errors.defaultDuration ? [errors.defaultDuration] : []"
                hide-details="auto"
              />
            </v-col>

            <v-col cols="6">
              <label class="fld-lbl"
                >Price ($) <span class="req-star">*</span></label
              >
              <v-text-field
                v-model="form.price"
                variant="outlined"
                density="compact"
                type="number"
                class="mt-1"
                placeholder="0.00"
                :error="!!errors.price"
                :error-messages="errors.price ? [errors.price] : []"
                hide-details="auto"
                @input="clearError('price')"
              />
            </v-col>


            <!-- Category -->
            <v-col cols="12">
              <label class="fld-lbl"
                >Category <span class="req-star">*</span></label
              >
              <v-select
                v-model="form.category"
                :items="categories"
                variant="outlined"
                density="compact"
                class="mt-1"
                placeholder="Select category"
                :error="!!errors.category"
                :error-messages="errors.category ? [errors.category] : []"
                hide-details="auto"
                @update:model-value="clearError('category')"
              />
            </v-col>

            <!-- Active Status -->
            <!-- Active Status - Toggle Switch -->
<v-col cols="12">
  <div class="active-status-container">
    <div class="d-flex align-center justify-space-between">
      <div>
        <div class="text-subtitle-2 font-weight-medium text-grey-darken-3">
          Active Status
        </div>
        <div class="text-caption text-grey mt-1">
          {{ form.active ? 'Treatment is active and available for appointments' : 'Treatment is inactive and hidden from selection' }}
        </div>
      </div>
      <v-switch
        v-model="form.active"
        color="primary"
        hide-details
        inset
        class="active-switch"
      >
        <template #label>
          <span class="status-badge" :class="{ active: form.active, inactive: !form.active }">
            {{ form.active ? 'Active' : 'Inactive' }}
          </span>
        </template>
      </v-switch>
    </div>
  </div>
</v-col>
          </v-row>
        </v-card>
      </v-card-text>

      <v-divider />

      <!-- Footer actions -->
      <v-card-actions class="pa-4" style="gap: 12px">
        <v-btn
          variant="outlined"
          color="#6b7280"
          style="flex: 1; border-radius: 10px"
          @click="$emit('update:modelValue', false)"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          style="flex: 1; border-radius: 10px"
          @click="save"
          :loading="loading"
          :disabled="loading"
        >
          {{ submitLabel }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from "vue";
import { useOrgStore } from "@/stores/organisation";

const props = defineProps({
  modelValue: Boolean,
  editData: { type: Object, default: null },
});

const emit = defineEmits(["update:modelValue", "save"]);

const organisationStore = useOrgStore();
const loading = ref(false);
const showColorPicker = ref(false);
const customColor = ref("#4CAF50");

const defaultForm = () => ({
  name: "",
  code: "",
  defaultDuration: 60,
  price: 0,
  amount: 0,
  category: "",
  active: true,
  color: "#4CAF50",
});

const form = ref(defaultForm());

const isEditMode = computed(() => !!props.editData?.id);
const dialogTitle = computed(() => (isEditMode.value ? "Edit Treatment" : "New Treatment"));
const dialogSubtitle = computed(() =>

  isEditMode.value
    ? "Update the treatment details below"
    : "Fill in the treatment details below",
);
const submitLabel = computed(() => (isEditMode.value ? "Save Changes" : "Create Treatment"));

const resetForm = () => {
  form.value = defaultForm();
  customColor.value = "#4CAF50";
};

watch(
  () => props.editData,
  (value) => {
    if (value && value.id) {
      form.value = {
        name: value.name || "",
        code: value.code || "",
        defaultDuration: value.defaultDuration || 60,
        price: value.price ?? 0,
        amount: value.amount ?? 0,
        category: value.category || "",
        active: value.active !== false,
        color: value.color || "#4CAF50",
      };
      customColor.value = form.value.color || "#4CAF50";
    } else {
      resetForm();
    }
  },
  { immediate: true },
);

const errors = reactive({
  name: "",
  code: "",
  defaultDuration: "",
  price: "",
  amount: "",
  category: "",
  color: "",
});

const durationOptions = [15, 30, 45, 60, 90, 120, 180, 240];

const categories = [
  "Oral & Maxillofacial Surgery Related Services",
  "Restorative Services",
  "Diagnostic Services",
  "Periodontics",
  "Endodontics",
  "Orthodontics",
  "Prosthodontics",
  "Preventive Services",
  "Emergency Services",
  "Other"
];

// Color palette
const colorPalette = [
  "#4CAF50", "#2196F3", "#F44336", "#FF9800", "#9C27B0", "#E91E63",
  "#00BCD4", "#FFEB3B", "#795548", "#607D8B", "#3F51B5", "#009688",
  "#FF5722", "#673AB7", "#8BC34A", "#FFC107"
];

// Medical-themed color suggestions
const medicalColors = [
  { name: "Primary Care", code: "#2196F3" },
  { name: "Emergency", code: "#F44336" },
  { name: "Surgery", code: "#9C27B0" },
  { name: "Dental", code: "#00BCD4" },
  { name: "Pediatrics", code: "#FF9800" },
  { name: "Cardiology", code: "#E91E63" },
  { name: "Neurology", code: "#673AB7" },
  { name: "Orthopedics", code: "#4CAF50" }
];

// Helper function to check if color is light
const isColorLight = (color) => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128;
};

// Get contrast color (black or white)
const getContrastColor = (color) => {
  return isColorLight(color) ? 'rgba(0,0,0,0.7)' : 'white';
};

const toggleColorPicker = () => {
  showColorPicker.value = !showColorPicker.value;
};

const selectColor = (color) => {
  form.value.color = color;
  customColor.value = color;
  clearError('color');
};

const applyCustomColor = () => {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  if (hexRegex.test(customColor.value)) {
    form.value.color = customColor.value;
    clearError('color');
  } else {
    errors.color = "Invalid hex color format. Use format: #RRGGBB";
  }
};

const clearError = (field) => {
  errors[field] = "";
};

const validateForm = () => {
  let isValid = true;
  
  errors.name = "";
  errors.code = "";
  errors.defaultDuration = "";
  errors.price = "";
  errors.amount = "";
  errors.category = "";
  errors.color = "";
  
  if (!form.value.name || form.value.name.trim() === "") {
    errors.name = "Treatment name is required";
    isValid = false;
  } else if (form.value.name.length < 2) {
    errors.name = "Treatment name must be at least 2 characters";
    isValid = false;
  } else if (form.value.name.length > 100) {
    errors.name = "Treatment name must be less than 100 characters";
    isValid = false;
  }
  
  if (form.value.code && form.value.code.trim() !== "") {
    if (form.value.code.length > 20) {
      errors.code = "Code must be less than 20 characters";
      isValid = false;
    } else if (!/^[A-Z0-9_-]+$/i.test(form.value.code)) {
      errors.code = "Code can only contain letters, numbers, dashes, and underscores";
      isValid = false;
    }
  }
  
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  if (!form.value.color) {
    errors.color = "Color is required";
    isValid = false;
  } else if (!hexRegex.test(form.value.color)) {
    errors.color = "Invalid color format. Use hex format: #RRGGBB";
    isValid = false;
  }
  
  const duration = parseInt(form.value.defaultDuration);
  if (!form.value.defaultDuration && form.value.defaultDuration !== 0) {
    errors.defaultDuration = "Duration is required";
    isValid = false;
  } else if (isNaN(duration)) {
    errors.defaultDuration = "Duration must be a valid number";
    isValid = false;
  } else if (duration <= 0) {
    errors.defaultDuration = "Duration must be greater than 0 minutes";
    isValid = false;
  } else if (duration > 480) {
    errors.defaultDuration = "Duration cannot exceed 480 minutes (8 hours)";
    isValid = false;
  }
  
  const price = parseFloat(form.value.price);
  if (form.value.price === "" || form.value.price === null) {
    errors.price = "Price is required";
    isValid = false;
  } else if (isNaN(price)) {
    errors.price = "Price must be a valid number";
    isValid = false;
  } else if (price < 0) {
    errors.price = "Price cannot be negative";
    isValid = false;
  } else if (price > 99999) {
    errors.price = "Price cannot exceed $99,999";
    isValid = false;
  }
  
  const amount = parseFloat(form.value.amount);
  if (form.value.amount === "" || form.value.amount === null) {
    errors.amount = "Amount is required";
    isValid = false;
  } else if (isNaN(amount)) {
    errors.amount = "Amount must be a valid number";
    isValid = false;
  } else if (amount < 0) {
    errors.amount = "Amount cannot be negative";
    isValid = false;
  } else if (amount > 999999) {
    errors.amount = "Amount cannot exceed $999,999";
    isValid = false;
  }
  
  if (!form.value.category) {
    errors.category = "Category is required";
    isValid = false;
  }
  
  return isValid;
};

const save = async () => {
  if (!validateForm()) {
    const firstErrorField = document.querySelector('.v-field--error');
    if (firstErrorField) {
      firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  }

  loading.value = true;

  const payload = {
    name: form.value.name.trim(),
    code: form.value.code.trim() || null,
    defaultDuration: parseInt(form.value.defaultDuration, 10),
    price: parseFloat(form.value.price),
    amount: parseFloat(form.value.amount),
    category: form.value.category,
    active: form.value.active,
    color: form.value.color,
    ...(isEditMode.value ? { id: props.editData.id } : {}),
  };

  try {
    const res = isEditMode.value
      ? await organisationStore.updateTreatment(payload)
      : await organisationStore.addTreatment(payload);

    if (res?.code === 0) {
      emit("save", res.data);
      emit("update:modelValue", false);
      resetForm();
      errors.name = "";
      errors.code = "";
      errors.defaultDuration = "";
      errors.price = "";
      errors.amount = "";
      errors.category = "";
      errors.color = "";
    } else {
      const errorMsg = res?.message || (isEditMode.value ? "Failed to update treatment" : "Failed to create treatment");
      alert(errorMsg);
    }
  } catch (error) {
    console.error(isEditMode.value ? "Error updating treatment:" : "Error creating treatment:", error);
    alert(error.response?.data?.message || (isEditMode.value ? "An error occurred while updating treatment" : "An error occurred while creating treatment"));
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
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

.req-star {
  color: #ef4444;
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
  background: linear-gradient(135deg, #c7b8ff, #a78bfa);
  flex-shrink: 0;
}

/* Color Picker Styles */
.color-preview-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid rgba(0,0,0,0.1);
}

.color-preview-bar:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.color-preview-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.color-value {
  font-family: monospace;
  font-size: 14px;
  font-weight: 500;
}

.color-picker-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  border: 1px solid #e5e7eb;
}

.selected-color-preview {
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  text-align: center;
  transition: all 0.3s ease;
}

.preview-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-label {
  font-size: 12px;
  font-weight: 500;
  color: rgba(255,255,255,0.9);
}

.preview-hex {
  font-family: monospace;
  font-size: 14px;
  font-weight: 600;
  color: white;
}

.palette-section, .custom-color-section, .suggestions-section {
  margin-bottom: 20px;
}

.section-label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}

.color-palette {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 8px;
}

.color-option {
  aspect-ratio: 1;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid transparent;
}

.color-option:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  border-color: white;
}

.color-check {
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));
}

.custom-color-inputs {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.custom-hex-input {
  flex: 1;
}

.custom-color-dot {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.apply-btn {
  margin-top: 4px;
}

.native-picker-wrapper {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.native-picker-label {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #6b7280;
  cursor: pointer;
}

.native-color-picker {
  width: 50px;
  height: 36px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  background: white;
}

.suggestions-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #f9fafb;
}

.suggestion-item:hover {
  background: #f3f4f6;
  transform: translateX(4px);
}

.suggestion-color {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.suggestion-name {
  font-size: 12px;
  font-weight: 500;
  color: #374151;
}

/* Transitions */
.slide-fade-enter-active {
  transition: all 0.3s ease;
}

.slide-fade-leave-active {
  transition: all 0.2s ease;
}

.slide-fade-enter-from {
  transform: translateY(-10px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

:deep(.v-field) {
  border-radius: 8px !important;
}

:deep(.v-messages) {
  font-size: 11px;
  margin-top: 4px;
}

:deep(.v-field--error .v-field__field) {
  background-color: #fff5f5;
}

:deep(.v-field--error .v-field__outline) {
  color: #ef4444;
}

:deep(.v-checkbox .v-label) {
  font-size: 14px;
  color: #374151;
}
</style>