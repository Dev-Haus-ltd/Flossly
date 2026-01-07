<template>
  <v-expansion-panels v-model="panel" :elevation="0" flat>
    <v-expansion-panel rounded="lg" :key="0" class="border-sm pb-1">
      <!-- Title -->
      <v-expansion-panel-title expand-icon="" class="panel-title">
        <div>
          <p class="title-text">Salary Information</p>
        </div>

        <template #actions>
          <div class="collapse-btn" @click.stop="togglePanel">
            <v-icon color="white">
              {{ panel === 0 ? "mdi-chevron-up" : "mdi-chevron-down" }}
            </v-icon>
          </div>
        </template>
      </v-expansion-panel-title>
      <v-expansion-panel-text class="panel-text">
        <v-row>
          <v-col cols="12" md="6">
            <label class="field-label">Hourly Rate</label>
            <p
              class="field-value"
              :class="{ 'is-placeholder': !data.salaryPerHour }"
              contenteditable="true"
              @focus="onFocus($event)"
              @input="onInput($event, 'salaryPerHour')"
              @blur="onBlur($event, 'salaryPerHour')"
              @keydown.enter.prevent="onEnter($event, 'salaryPerHour')"
            >
              {{ data.salaryPerHour || "Not specified" }}
            </p>
          </v-col>
          <v-col cols="12" md="6">
            <label class="field-label">Week Hours</label>
            <p
              class="field-value"
              :class="{ 'is-placeholder': !data.weeklyHours }"
              contenteditable="true"
              @focus="onFocus($event)"
              @input="onInput($event, 'weeklyHours')"
              @blur="onBlur($event, 'weeklyHours')"
              @keydown.enter.prevent="onEnter($event, 'weeklyHours')"
            >
              {{ data.weeklyHours || "Not specified" }}
            </p>
          </v-col>
          <v-col cols="12" md="6">
            <label class="field-label">Payment Frequency</label>
            <p
              class="field-value"
              :class="{ 'is-placeholder': !data.paymentFrequency }"
              contenteditable="true"
              @focus="onFocus($event)"
              @input="onInput($event, 'paymentFrequency')"
              @blur="onBlur($event, 'paymentFrequency')"
              @keydown.enter.prevent="onEnter($event, 'paymentFrequency')"
            >
              {{ data.paymentFrequency || "Not specified" }}
            </p>
          </v-col>
          <v-col cols="12" md="6">
            <label class="field-label">Effective Date</label>
            <v-menu
              v-model="menu"
              :close-on-content-click="false"
              transition="scale-transition"
              offset-y
              min-width="auto"
            >
              <template #activator="{ props }">
                <v-text-field
                  v-bind="props"
                  :model-value="
                    formatDateDDMMYYYY(data.paymentStartDate) || 'Not specified'
                  "
                  placeholder="Not specified"
                  class="no-pad-textfield"
                  readonly
                  variant="solo"
                  density="compact"
                  hide-details
                  flat
                ></v-text-field>
              </template>
              <v-date-picker
                v-model="data.paymentStartDate"
                @update:model-value="onDateChange"
              ></v-date-picker>
            </v-menu>
          </v-col>
        </v-row>
        <div class="d-flex justify-end mt-4" v-if="panel === 0 && isDirty">
          <v-btn color="primary" @click="savePanel"> Save </v-btn>
        </div>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script setup>
import { ref, onMounted, nextTick } from "vue";
import { formatDateDDMMYYYY } from "~/lib/dateFormatter";
const menu = ref(false);

const props = defineProps({
  data: { type: Object, required: true },
});
const emit = defineEmits(["updateField"]);

const isDirty = ref(false);
const original = ref("{}");
const initialized = ref(false);

const normalizeData = (obj) => {
  if (!obj) return {};
  const normalized = { ...obj };
  // Normalize empty strings, null, undefined to consistent values for comparison
  Object.keys(normalized).forEach(key => {
    if (normalized[key] === null || normalized[key] === undefined || normalized[key] === '') {
      normalized[key] = '';
    }
  });
  return normalized;
};

const checkDirty = () => {
  if (!initialized.value) return;
  try {
    const current = normalizeData(props.data);
    const originalData = JSON.parse(original.value || '{}');
    const normalizedOriginal = normalizeData(originalData);
    isDirty.value = JSON.stringify(current) !== JSON.stringify(normalizedOriginal);
  } catch {
    isDirty.value = true;
  }
};


onMounted(async () => {
  await nextTick();
  try {
    const initialData = normalizeData(props.data);
    original.value = JSON.stringify(initialData);
    isDirty.value = false;
    initialized.value = true;
  } catch {
    original.value = '{}';
    isDirty.value = false;
    initialized.value = true;
  }
});

const panel = ref(0);
const togglePanel = () => {
  panel.value = panel.value === 0 ? null : 0;
};

// remove placeholder text when focusing
const onFocus = (e) => {
  if (e.target.innerText.trim() === "Not specified") {
    e.target.innerText = "";
  }
};

const onInput = (e, key) => {
  if (!initialized.value) return;
  const typedValue = e.target.innerText.trim();
  const originalValue = (props.data?.[key] ?? "").toString().trim();
  
  if (typedValue === "" || typedValue === "Not specified") {
    isDirty.value = originalValue !== "";
  } else {
    isDirty.value = typedValue !== originalValue;
  }
};

// restore placeholder if left empty
const onBlur = (e, key) => {
  const typedValue = e.target.innerText.trim();
  const originalValue = (props.data?.[key] ?? "").toString().trim();
  
  if (!typedValue) {
    e.target.innerText = "Not specified";
    if (originalValue) {
      const updated = props.data;
      updated[key] = "";
      emit("updateField", { sync: false, updated });
      checkDirty();
    }
  } else {
    const value = typedValue;
    if (value !== originalValue) {
      const updated = props.data;
      updated[key] = value;
      emit("updateField", { sync: false, updated });
      checkDirty();
    }
  }
};

// only update on Enter
const onEnter = (e, key) => {
  const value = e.target.innerText.trim();
  const updated = props.data;
  updated[key] = value;
  emit("updateField", { sync: true, updated });
  try { 
    const savedData = normalizeData(props.data);
    original.value = JSON.stringify(savedData); 
  } catch {}
  isDirty.value = false;
  e.target.blur(); // exit editing mode
};
const onDateChange = (val) => {
  if (val) {
    props.data.paymentStartDate = val;
    checkDirty();
  }
  menu.value = false;
};
const savePanel = () => {
  const updated = props.data;

  emit("updateField", { sync: true, updated });
  try { 
    const savedData = normalizeData(props.data);
    original.value = JSON.stringify(savedData); 
  } catch {}
  isDirty.value = false;
};
</script>

<style scoped>
/* Panel shell */
.panel-title {
  background-color: #eff5f5;
  padding: 12px 16px;
}
.panel-text {
  padding: 12px 16px;
}

/* Heading & subtitle */
.title-text {
  
  font-weight: 600;
  font-size: 16px;
  color: #1e1e1e;
  margin: 0;
}
.subtitle-text {
  
  font-weight: 400;
  font-size: 13px;
  color: #1e1e1e;
  margin: 0;
}

/* Optional info box (if a card uses it) */
.notification-box {
  border-radius: 8px;
  padding: 12px;
  margin: 16px 0;
  
  font-weight: 400;
  font-size: 13px;
  background-color: #f9fafa;
  color: #1e1e1e;
}

/* Collapse chevron button */
.collapse-btn {
  background-color: #213536;
  border-radius: 50%;
  padding: 6px;
  height: 24px;
  width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

/* Field label + value */
.field-label {
  display: block;
  
  font-weight: 600;
  font-size: 13px;
  color: #1e1e1e;
  margin-bottom: 4px;
}

.field-value {
  
  font-weight: 400;
  font-size: 14px;
  color: #101010;
  outline: none;
  cursor: text;
  border: 1px solid transparent;
  border-radius: 6px;
  min-height: 22px;
  padding: 6px 0px; /* a bit more room for editing */
  transition: background-color 0.15s ease, border-color 0.15s ease;
  word-break: break-word; /* prevents overflow on long words */
}

.field-value:hover {
  background-color: #fafafa;
}

.field-value:focus {
  border: 1px solid #dfdfdf;
  background-color: #fafafa;
}

/* Placeholder look for empty values */
.field-value.is-placeholder {
  color: #9e9e9e;
  font-style: italic;
}

/* Optional: selection color while editing */
.field-value::selection {
  background: #d9eef0;
}
.no-pad-textfield :deep(.v-field) {
  /* remove left/right internal padding */
  --v-field-padding-start: 0px;
  --v-field-padding-end: 0px;
  /* optionally shrink control height if needed */
  --v-input-control-height: 28px;
}
/* Optional: compact spacing on smaller screens */
@media (max-width: 600px) {
  .panel-title,
  .panel-text {
    padding: 10px 12px;
  }
  .title-text {
    font-size: 15px;
  }
  .subtitle-text {
    font-size: 12px;
  }
}
</style>
