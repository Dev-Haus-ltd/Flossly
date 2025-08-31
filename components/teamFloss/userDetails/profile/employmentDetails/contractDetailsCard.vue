<template>
  <v-expansion-panels v-model="panel" :elevation="0" flat>
    <v-expansion-panel rounded="lg" :key="0" class="border-sm pb-1">
      <!-- Title -->
      <v-expansion-panel-title expand-icon="" class="panel-title">
        <div>
          <p class="title-text">Contract details</p>
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
            <label class="field-label">Contract Type</label>
            <p
              class="field-value"
              :class="{ 'is-placeholder': !data.contractType }"
              contenteditable="true"
              @focus="onFocus($event)"
              @blur="onBlur($event, 'contractType')"
              @keydown.enter.prevent="onEnter($event, 'contractType')"
            >
              {{ data.contractType || "Not specified" }}
            </p>
          </v-col>
          <v-col cols="12" md="6">
            <label class="field-label">Contract Start Date</label>
            <p
              class="field-value"
              :class="{ 'is-placeholder': !data.contractStartDate }"
              contenteditable="true"
              @focus="onFocus($event)"
              @blur="onBlur($event, 'contractStartDate')"
              @keydown.enter.prevent="onEnter($event, 'contractStartDate')"
            >
              {{ data.contractStartDate || "Not specified" }}
            </p>
          </v-col>
          <v-col cols="12" md="6">
            <label class="field-label">Eligible for Pension?</label>
            <v-switch
              v-model="data.pensionEligible"
              @change="onEnter($event, 'pensionEligible')"
            ></v-switch>
          </v-col>
        </v-row>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
  data: { type: Object, required: true },
});
const emit = defineEmits(["updateField"]);

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

// restore placeholder if left empty
const onBlur = (e, key) => {
  if (!e.target.innerText.trim()) {
    e.target.innerText = "Not specified";
  } else {
    const value = e.target.innerText.trim();
    const updated = props.data;
    updated[key] = value;
    emit("updateField", { sync: false, updated });
  }
};

// only update on Enter
const onEnter = (e, key) => {
  const updated = props.data;
  if (key !== "pensionEligible") {
    const value = e.target.innerText.trim();
    updated[key] = value;
  }
  emit("updateField", { sync: true, updated });
  e.target.blur();
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
  font-family: Poppins, sans-serif;
  font-weight: 600;
  font-size: 16px;
  color: #1e1e1e;
  margin: 0;
}
.subtitle-text {
  font-family: Poppins, sans-serif;
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
  font-family: Poppins, sans-serif;
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
  font-family: Poppins, sans-serif;
  font-weight: 600;
  font-size: 13px;
  color: #1e1e1e;
  margin-bottom: 4px;
}

.field-value {
  font-family: Poppins, sans-serif;
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
