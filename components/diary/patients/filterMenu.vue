<template>
  <v-menu
    v-model="filterMenu"
    :close-on-content-click="false"
    transition="fade-transition"
    offset-y
  >
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        variant="flat"
        density="compact"
        class="tbl-top-btn ml-2"
        style="width: 110px"
      >
        <span>Filter</span>
        <img
          :src="filtericon"
          alt="filtericon"
          class="ml-2"
          width="14"
          height="14"
        />
        <!-- <v-icon class="ml-2" size="20">mdi-filter-outline</v-icon> -->
        <v-badge
          v-if="activeFiltersCount > 0"
          :content="activeFiltersCount"
          color="primary"
          inline
          class="ml-2"
        />
      </v-btn>
    </template>

    <v-card style="min-width: 300px; border-radius: 12px; padding: 16px">
      <v-list class="pa-0">
        <div class="pa-0 d-flex align-center justify-space-between">
          <div style="font-weight: 500; font-size: 14px">Filters by</div>

          <v-btn
            variant="text"
            density="comfortable"
            color="primary"
            style="text-transform: none; font-weight: 500; font-size: 13px"
            @click="clearFilters"
          >
            Clear filters
          </v-btn>
        </div>

        <v-divider style="background-color: #dbdbdb" class="my-3" />

        <div
          v-if="activeFiltersCount > 0"
          class="mb-3 d-flex align-center flex-wrap"
          style="gap: 8px"
        >
          <v-chip
            v-if="selectedSex"
            size="small"
            variant="tonal"
            color="primary"
            closable
            @click:close="clearSex"
          >
            Sex: {{ selectedSex }}
          </v-chip>
          <v-chip
            v-if="selectedPaymentPlan"
            size="small"
            variant="tonal"
            color="primary"
            closable
            @click:close="clearPaymentPlan"
          >
            Payment: {{ selectedPaymentPlan }}
          </v-chip>
          <v-chip
            v-if="selectedMarketingConsent"
            size="small"
            variant="tonal"
            color="primary"
            closable
            @click:close="clearMarketingConsent"
          >
            Consent: {{ selectedMarketingConsent }}
          </v-chip>
          <v-chip
            v-if="selectedDentistId"
            size="small"
            variant="tonal"
            color="primary"
            closable
            @click:close="clearDentist"
          >
            Dentist: {{ selectedDentistName }}
          </v-chip>
        </div>

        <v-label class="my-1" style="font-size: 14px">Biological Sex</v-label>
        <v-select
          v-model="selectedSex"
          :items="sexes"
          variant="solo"
          flat
          density="compact"
          hide-details
          class="input-bordered"
          clearable
          @click:clear="clearSex"
        />

        <v-label class="my-1" style="font-size: 14px">Payment Plan</v-label>
        <v-select
          v-model="selectedPaymentPlan"
          :items="paymentPlans"
          variant="solo"
          flat
          density="compact"
          hide-details
          class="input-bordered"
          clearable
          @click:clear="clearPaymentPlan"
        />

        <v-label class="my-1" style="font-size: 14px"
          >Marketing Consent</v-label
        >
        <v-select
          v-model="selectedMarketingConsent"
          :items="marketingConsents"
          variant="solo"
          flat
          density="compact"
          hide-details
          class="input-bordered"
          clearable
          @click:clear="clearMarketingConsent"
        />

        <v-label class="my-1" style="font-size: 14px">Default Dentist</v-label>
        <v-select
          v-model="selectedDentistId"
          :items="dentists"
          item-title="name"
          item-value="id"
          variant="solo"
          flat
          density="compact"
          hide-details
          class="input-bordered"
          clearable
          @click:clear="clearDentist"
        />
      </v-list>
    </v-card>
  </v-menu>
</template>

<script setup>
import { computed, ref, watch } from "vue";
// icon
import filtericon from "@/assets/icons/listView/filter-icon.svg";
const props = defineProps({
  dentists: { type: Array, default: () => [] },
});

const emit = defineEmits(["update:filters"]);

const filterMenu = ref(false);
const selectedSex = ref(null);
const selectedPaymentPlan = ref(null);
const selectedMarketingConsent = ref(null);
const selectedDentistId = ref(null);

const sexes = ["Male", "Female", "Other"];
const paymentPlans = ["Private", "NHS", "Finance"];
const marketingConsents = ["-", "Yes", "No"];

const selectedDentistName = computed(() => {
  const found = (props.dentists || []).find(
    (d) => String(d.id) === String(selectedDentistId.value),
  );
  return found?.name || "";
});

const activeFiltersCount = computed(() => {
  let c = 0;
  if (selectedSex.value) c++;
  if (selectedPaymentPlan.value) c++;
  if (selectedMarketingConsent.value) c++;
  if (selectedDentistId.value) c++;
  return c;
});

watch(
  [
    selectedSex,
    selectedPaymentPlan,
    selectedMarketingConsent,
    selectedDentistId,
  ],
  () => {
    emit("update:filters", {
      sex: selectedSex.value,
      paymentPlan: selectedPaymentPlan.value,
      marketingConsent: selectedMarketingConsent.value,
      dentistId: selectedDentistId.value,
    });
  },
);

const clearFilters = () => {
  selectedSex.value = null;
  selectedPaymentPlan.value = null;
  selectedMarketingConsent.value = null;
  selectedDentistId.value = null;
};

const clearSex = () => {
  selectedSex.value = null;
};
const clearPaymentPlan = () => {
  selectedPaymentPlan.value = null;
};
const clearMarketingConsent = () => {
  selectedMarketingConsent.value = null;
};
const clearDentist = () => {
  selectedDentistId.value = null;
};
</script>

<style scoped>
.input-bordered :deep(.v-field) {
  border-radius: 8px !important;
  min-height: 40px;
  font-size: 14px;
}
.tbl-top-btn {
  height: 46px;
  border-radius: 8px;
  font-size: 14px;
  text-transform: none;
  box-shadow: none;
  background-color: #f3f4f6 !important;
  color: #737373;
  margin-left: 16px !important;
}
</style>
