<template>
  <v-dialog v-model="model" max-width="520" scrollable>
    <v-card rounded="xl" elevation="4" style="overflow: hidden">
      <!-- Header -->
      <v-toolbar flat color="white" height="56">
        <div class="finance-header">
          <img :src="financeIcon" class="icon" />
          <div>
            <v-toolbar-title class="title-text"
              >Finance Calculator</v-toolbar-title
            >
            <p class="subtitle">Select the amount you wish to finance</p>
          </div>
        </div>
        <v-spacer />
        <v-btn
          icon
          variant="text"
          size="small"
          @click="model = false"
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
        <v-card elevation="0" rounded="lg" class="pa-4" color="white">
          <!-- Amount Section -->
          <div class="section">
            <div class="amount-label">Amount to Finance</div>
            <div class="amount">£{{ amount }}</div>

            <v-slider
              v-model="amount"
              :min="250"
              :max="3000"
              step="10"
              thumb-label
              class="slider mt-2"
              color="#0061fb
"
              track-color="#e8e9eb"
            />

            <div class="range">
              <span>£250</span>
              <span>£3,000</span>
            </div>
          </div>

          <v-divider class="my-4" />

          <!-- Months Section -->
          <div class="section">
            <div class="label">Select the number of monthly payments</div>

            <div class="chips">
              <button
                v-for="m in monthsOptions"
                :key="m"
                class="chip"
                :class="{ active: months === m }"
                @click="months = m"
              >
                {{ m }}
              </button>
            </div>
          </div>

          <!-- Result -->
          <div class="result-section">
            <div class="result-label">Monthly Payment</div>
            <div class="result">£{{ monthlyPayment }}</div>
          </div>

          <v-divider class="my-4" />

          <!-- Info Summary -->
          <div class="summary">
            <div class="summary-row">
              <span>Interest (APR)</span>
              <strong>0%</strong>
            </div>
            <div class="summary-row">
              <span>Cost of Credit</span>
              <strong>£0</strong>
            </div>
            <div class="summary-row">
              <span>Total to pay back</span>
              <strong>£{{ amount }}</strong>
            </div>
          </div>
        </v-card>
      </v-card-text>

      <v-divider />

      <!-- Footer -->
      <!-- <v-card-actions class="pa-4" style="gap: 12px">
        <v-btn
          variant="outlined"
          color="#6b7280"
          style="flex: 1; border-radius: 10px"
          @click="model = false"
        >
          Close
        </v-btn>

        <v-btn
          color="#0061fb"
          variant="flat"
          style="flex: 1; border-radius: 10px"
          @click="model = false"
        >
          Apply Finance
        </v-btn>
      </v-card-actions> -->
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref } from "vue";
import financeIcon from "@/assets/diary/finance_icon.svg";

const props = defineProps({
  modelValue: Boolean,
});

const emit = defineEmits(["update:modelValue"]);

const model = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const amount = ref(796);
const months = ref(12);

const monthsOptions = [3, 6, 9, 12];

const monthlyPayment = computed(() => {
  return (amount.value / months.value).toFixed(2);
});
</script>

<style scoped lang="scss">
.title-text {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.finance-header {
  display: flex;
  gap: 12px;
  align-items: center;
  padding-left: 16px;

  .icon {
    width: 28px;
    height: 28px;
  }

  .subtitle {
    margin: 0;
    font-size: 12px;
    color: #6b7280;
  }
}

.section {
  margin-bottom: 0;
}

.amount-label {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 8px;
}

.amount {
  font-size: 32px;
  font-weight: 700;
  color: #0061fb;
  margin-bottom: 8px;
}

.range {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #9ca3af;
  margin-top: 4px;
}

.label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 12px;
}

.chips {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.chip {
  min-width: 48px;
  height: 48px;
  border-radius: 24px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  font-weight: 600;
  font-size: 14px;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f3f4f6;
    border-color: #0061fb;
  }

  &.active {
    background: #0061fb;
    color: white;
    border-color: #0061fb;
  }
}

.result-section {
  margin-top: 20px;
  padding: 16px;
  background: #fef3f9;
  border-radius: 12px;
  text-align: center;
}

.result-label {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 6px;
}

.result {
  font-size: 28px;
  font-weight: 700;
  color: #0061fb;
}

.summary {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #4b5563;

  strong {
    color: #1f2937;
    font-weight: 600;
  }
}

:deep(.v-slider-thumb) {
  color: #0061fb;
}

:deep(.v-slider-track__fill) {
  background-color: #0061fb;
}

:deep(.v-field) {
  border-radius: 8px !important;
}
</style>
