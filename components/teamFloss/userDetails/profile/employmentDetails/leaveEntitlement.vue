<template>
  <v-expansion-panels v-model="panel" :elevation="0" flat>
    <v-expansion-panel rounded="lg" :key="0" class="border-sm pb-1">
      <!-- Title -->
      <v-expansion-panel-title expand-icon="" class="panel-title">
        <div>
          <p class="title-text">Leave Entitlement</p>
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
        <div class="fields-grid">
          <div class="field-item">
            <label class="field-label">Annual Leaves</label>
            <p
              class="field-value"
              :class="{ 'is-placeholder': !data.allowedAnnualLeaves }"
              contenteditable="true"
              @focus="onFocus($event)"
              @input="onInput($event, 'allowedAnnualLeaves')"
              @blur="onBlur($event, 'allowedAnnualLeaves')"
              @keydown.enter.prevent="onEnter($event, 'allowedAnnualLeaves')"
            >
              {{ data.allowedAnnualLeaves || "Not specified" }}
            </p>
          </div>
          <div class="field-item">
            <label class="field-label">Casual Leaves</label>
            <p
              class="field-value"
              :class="{ 'is-placeholder': !data.allowedCasualLeaves }"
              contenteditable="true"
              @focus="onFocus($event)"
              @input="onInput($event, 'allowedCasualLeaves')"
              @blur="onBlur($event, 'allowedCasualLeaves')"
              @keydown.enter.prevent="onEnter($event, 'allowedCasualLeaves')"
            >
              {{ data.allowedCasualLeaves || "Not specified" }}
            </p>
          </div>
          <div class="field-item">
            <label class="field-label">Sick Leaves</label>
            <p
              class="field-value"
              :class="{ 'is-placeholder': !data.allowedSickLeaves }"
              contenteditable="true"
              @focus="onFocus($event)"
              @input="onInput($event, 'allowedSickLeaves')"
              @blur="onBlur($event, 'allowedSickLeaves')"
              @keydown.enter.prevent="onEnter($event, 'allowedSickLeaves')"
            >
              {{ data.allowedSickLeaves || "Not specified" }}
            </p>
          </div>
          <div class="field-item">
            <label class="field-label">Compationate Leaves</label>
            <p
              class="field-value"
              :class="{ 'is-placeholder': !data.allowedCompationateLeaves }"
              contenteditable="true"
              @focus="onFocus($event)"
              @input="onInput($event, 'allowedCompationateLeaves')"
              @blur="onBlur($event, 'allowedCompationateLeaves')"
              @keydown.enter.prevent="
                onEnter($event, 'allowedCompationateLeaves')
              "
            >
              {{ data.allowedCompationateLeaves || "Not specified" }}
            </p>
          </div>
          <div class="field-item">
            <label class="field-label">Other Leaves</label>
            <p
              class="field-value"
              :class="{ 'is-placeholder': !data.allowedOtherLeaves }"
              contenteditable="true"
              @focus="onFocus($event)"
              @input="onInput($event, 'allowedOtherLeaves')"
              @blur="onBlur($event, 'allowedOtherLeaves')"
              @keydown.enter.prevent="onEnter($event, 'allowedOtherLeaves')"
            >
              {{ data.allowedOtherLeaves || "Not specified" }}
            </p>
          </div>
        </div>
        <div class="d-flex justify-end mt-4" v-if="panel === 0 && isDirty">
          <v-btn color="primary" @click="savePanel"> Save </v-btn>
        </div>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script setup>
import { ref, onMounted, nextTick } from "vue";

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
  e.target.blur();
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

.fields-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.field-item {
  width: 100%;
}

@media (max-width: 600px) {
  .fields-grid {
    grid-template-columns: 1fr;
  }
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
