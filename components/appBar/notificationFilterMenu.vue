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
        class="tbl-top-btn"
        style="width: 100px"
      >
        <span>Filter</span>
        <img
          :src="filtericon"
          alt="filter icon"
          class="ml-2"
          width="14"
          height="14"
        />
      </v-btn>
    </template>

    <v-card style="min-width: 300px; border-radius: 12px; padding: 16px">
      <v-list class="pa-0">
        <div class="pa-0 d-flex align-center justify-space-between">
          <div style="font-weight: 500; font-size: 14px">
            Filters by
          </div>

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

        <!-- Notification Type -->
        <v-label class="my-1" style="font-size: 14px">
          Notification Type
        </v-label>
        <v-select
          v-model="selectedType"
          :items="notificationTypes"
          item-title="label"
          item-value="value"
          variant="solo"
          flat
          density="compact"
          hide-details
          class="input-bordered"
        />

        <!-- Time Filter -->
        <v-label class="my-1" style="font-size: 14px">
          Time
        </v-label>
        <v-select
          v-model="selectedTime"
          :items="timeOptions"
          item-title="label"
          item-value="value"
          variant="solo"
          flat
          density="compact"
          hide-details
          class="input-bordered"
        />

        <!-- Read Status -->
        <v-label class="my-1" style="font-size: 14px">
          Status
        </v-label>
        <v-select
          v-model="selectedStatus"
          :items="statusOptions"
          item-title="label"
          item-value="value"
          variant="solo"
          flat
          density="compact"
          hide-details
          class="input-bordered"
        />
      </v-list>
    </v-card>
  </v-menu>
</template>

<script setup>
import filtericon from "@/assets/icons/listView/filter-icon.svg";

const { clearTrigger } = defineProps({
  clearTrigger: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(["update:filters"]);

const filterMenu = ref(false);

const notificationTypes = ref([
  { label: "All Types", value: null },
  { label: "Task", value: "task" },
  { label: "Lead", value: "lead" },
  { label: "Message", value: "message" },
]);

const timeOptions = ref([
  { label: "All Time", value: null },
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "Last 7 Days", value: "last7days" },
  { label: "Last 30 Days", value: "last30days" },
]);

const statusOptions = ref([
  { label: "All", value: null },
  { label: "Unread", value: "unread" },
  { label: "Read", value: "read" },
]);

const selectedType = ref(null);
const selectedTime = ref(null);
const selectedStatus = ref(null);

const clearFilters = () => {
  selectedType.value = null;
  selectedTime.value = null;
  selectedStatus.value = null;
  emitFilters();
};

const emitFilters = () => {
  emit("update:filters", {
    type: selectedType.value,
    time: selectedTime.value,
    status: selectedStatus.value,
  });
};

watch([selectedType, selectedTime, selectedStatus], () => {
  emitFilters();
});

watch(
  () => clearTrigger,
  () => {
    if (clearTrigger > 0) {
      clearFilters();
    }
  }
);
</script>

<style scoped>
.tbl-top-btn {
  height: 46px;
  border-radius: 8px;
  font-size: 14px;
  background-color: #F3F4F6 !important;
  text-transform: none;
  box-shadow: none !important;
  color: #737373;
  align-items: center;
}

.input-bordered {
  margin-bottom: 12px;
}

.input-bordered :deep(.v-field) {
  background-color: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
}

.input-bordered :deep(.v-field__input) {
  font-size: 14px;
  color: #1F2937;
}
</style>
