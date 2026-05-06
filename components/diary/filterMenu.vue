<template>
  <v-menu
    v-model="menu"
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
          v-if="activeCount > 0"
          :content="activeCount"
          color="primary"
          inline
          class="ml-2"
        />
      </v-btn>
    </template>

    <v-card style="min-width: 320px; border-radius: 12px; padding: 16px">
      <div class="pa-0 d-flex align-center justify-space-between">
        <div style="font-weight: 500; font-size: 14px">Filter by</div>
        <v-btn
          variant="text"
          density="comfortable"
          color="primary"
          style="text-transform: none; font-weight: 500; font-size: 13px"
          @click="clearFilters"
          >Clear filters</v-btn
        >
      </div>
      <v-divider class="my-3" />

      <div
        v-if="activeCount > 0"
        class="mb-3 d-flex align-center flex-wrap"
        style="gap: 8px"
      >
        <v-chip
          v-if="date"
          size="small"
          variant="tonal"
          color="primary"
          closable
          @click:close="date = null"
          >Date: {{ formattedDate }}</v-chip
        >
        <v-chip
          v-if="dentistId"
          size="small"
          variant="tonal"
          color="primary"
          closable
          @click:close="dentistId = null"
          >Dentist: {{ dentistName }}</v-chip
        >
        <v-chip
          v-if="status"
          size="small"
          variant="tonal"
          color="primary"
          closable
          @click:close="status = null"
          >Status: {{ status }}</v-chip
        >
        <v-chip
          v-if="treatmentId"
          size="small"
          variant="tonal"
          color="primary"
          closable
          @click:close="treatmentId = null"
          >Treatment: {{ treatmentName }}</v-chip
        >
      </div>

      <v-label class="my-1" style="font-size: 14px">Date</v-label>
      <v-menu
        v-model="dateMenu"
        :close-on-content-click="false"
        transition="scale-transition"
        offset-y
        min-width="auto"
      >
        <template #activator="{ props }">
          <v-text-field
            v-model="formattedDate"
            v-bind="props"
            variant="solo"
            density="compact"
            class="mb-1 input-bordered"
            bg-color="white"
            flat
            readonly
            hide-details
            clearable
            @click:clear="date = null"
          >
            <template #append-inner
              ><v-icon @click.stop="dateMenu = true"
                >mdi-calendar</v-icon
              ></template
            >
          </v-text-field>
        </template>
        <v-date-picker v-model="date" />
      </v-menu>

      <v-label class="my-1" style="font-size: 14px">Dentist</v-label>
      <v-select
        v-model="dentistId"
        :items="dentists"
        item-title="name"
        item-value="id"
        variant="solo"
        flat
        density="compact"
        hide-details
        class="input-bordered"
        clearable
      />

      <v-label class="my-1" style="font-size: 14px">Status</v-label>
      <v-select
        v-model="status"
        :items="statuses"
        variant="solo"
        flat
        density="compact"
        hide-details
        class="input-bordered"
        clearable
      />

      <v-label class="my-1" style="font-size: 14px">Treatment</v-label>
      <v-select
        v-model="treatmentId"
        :items="treatments"
        item-title="name"
        item-value="id"
        variant="solo"
        flat
        density="compact"
        hide-details
        class="input-bordered"
        clearable
      />
    </v-card>
  </v-menu>
</template>

<script setup>
import { formatDateDDMMYYYY } from "@/lib/dateFormatter";
//icon
import filtericon from "@/assets/icons/listView/filter-icon.svg";
const props = defineProps({
  dentists: { type: Array, default: () => [] },
  treatments: { type: Array, default: () => [] },
  initDate: { type: String, default: "" },
});
const emit = defineEmits(["update:filters"]);

const menu = ref(false);
const dateMenu = ref(false);
const date = ref(props.initDate || null);
const dentistId = ref(null);
const status = ref(null);
const treatmentId = ref(null);

const statuses = [
  "Pending",
  "Confirmed",
  "Arrived",
  "In Progress",
  "In Surgery",
  "Complete",
  "Cancelled",
  "Did not attend",
];
const dentists = computed(() => props.dentists || []);
const treatments = computed(() => props.treatments || []);
const formattedDate = computed(() =>
  date.value ? formatDateDDMMYYYY(date.value) : "",
);
const dentistName = computed(
  () =>
    (dentists.value.find((d) => String(d.id) === String(dentistId.value)) || {})
      .name || "",
);
const treatmentName = computed(
  () =>
    (
      treatments.value.find(
        (t) => String(t.id) === String(treatmentId.value),
      ) || {}
    ).name || "",
);
const activeCount = computed(
  () =>
    [date.value, dentistId.value, status.value, treatmentId.value].filter(
      Boolean,
    ).length,
);

watch([date, dentistId, status, treatmentId], () => {
  emit("update:filters", {
    date: date.value,
    dentistId: dentistId.value,
    status: status.value,
    treatmentId: treatmentId.value,
  });
});

function clearFilters() {
  date.value = null;
  dentistId.value = null;
  status.value = null;
  treatmentId.value = null;
}
</script>

<style scoped>
.input-bordered :deep(.v-field) {
  border-radius: 8px;
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
