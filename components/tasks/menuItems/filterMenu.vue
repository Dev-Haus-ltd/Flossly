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
        class="tbl-top-btn ml-md-2"
        style="width: 100px"
      >
        <span>Filter</span>
        <img
          :src="filtericon"
          alt="filtericon"
          class="ml-2"
          width="14"
          height="14"
        />
      </v-btn>
    </template>

    <v-card style="min-width: 300px; border-radius: 12px; padding: 16px">
      <v-list class="pa-0">
        <div class="pa-0 d-flex align-center justify-space-between">
          <div
    style=" font-weight: 500; font-size: 14px"
  >
    Filters by
  </div>

  <v-btn
    variant="text"
    density="comfortable"
    color="primary"
    style="text-transform: none;  font-weight: 500; font-size: 13px"
    @click="clearFilters"
  >
    Clear filters
  </v-btn>
        </div>

        <v-divider style="background-color: #dbdbdb" class="my-3" />

        <!-- Frequency -->
        <v-label class="my-1" style=" font-size: 14px">
          Frequency
        </v-label>
        <v-select
          v-model="selectedFrequency"
          :items="frequencies"
          item-title="name"
          item-value="name"
          variant="solo"
          flat
          density="compact"
          hide-details
          class="input-bordered"
        />

        <!-- Priority -->
        <v-label class="my-1" style=" font-size: 14px">
          Priority
        </v-label>
        <v-select
          v-model="selectedPriority"
          :items="priorities"
          item-title="name"
          item-value="id"
          variant="solo"
          flat
          density="compact"
          hide-details
          class="input-bordered"
        />

        <!-- Person -->
        <v-label class="my-1" style=" font-size: 14px">
          Person
        </v-label>
        <v-select
          v-model="selectedPerson"
          :items="users"
          item-title="fullName"
          item-value="id"
          variant="solo"
          flat
          density="compact"
          hide-details
          class="input-bordered"
        />

        <!-- Status -->
        <v-label class="my-1" style=" font-size: 14px">
          Status
        </v-label>
        <v-select
          v-model="selectedStatus"
          :items="statuses"
          item-title="name"
          item-value="key"
          variant="solo"
          flat
          density="compact"
          hide-details
          class="input-bordered"
        />

        <!-- Due date filter -->
        <v-label class="my-1" style=" font-size: 14px">
          Due date
        </v-label>
        <v-select
          v-model="selectedDueDate"
          :items="dueDateOptions"
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

const { priorities, users, statuses, clearTrigger } = defineProps({
  priorities: Array,
  users: Array,
  statuses: Array,
  clearTrigger: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(["update:filters"]);

const filterMenu = ref(false);
const frequencies = ref([
  { id: 1, name: "Daily" },
  { id: 2, name: "Weekly" },
  { id: 3, name: "Fortnightly" },
  { id: 4, name: "Monthly" },
  { id: 5, name: "6 Monthly" },
  { id: 6, name: "Yearly" },
]);

const selectedFrequency = ref(null);
const selectedPriority = ref(null);
const selectedPerson = ref(null);
const selectedStatus = ref(null);
const selectedDueDate = ref(null);
const dueDateOptions = ref([
  { value: "overdue", label: "Overdue" },
  { value: "today", label: "Due today" },
  { value: "week", label: "Due this week" },
]);

// Emit every time one of them changes
watch(
  [selectedFrequency, selectedPriority, selectedPerson, selectedStatus, selectedDueDate],
  () => {
  emit("update:filters", {
    frequency: selectedFrequency.value,
    priority: selectedPriority.value,
    user: selectedPerson.value,
    status: selectedStatus.value,
    dueDateFilter: selectedDueDate.value,
  });
});
const clearFilters =()=>{
  selectedFrequency.value=null,
  selectedPriority.value=null,
  selectedPerson.value=null
  selectedStatus.value=null
  selectedDueDate.value=null
  emit("update:filters", {
    frequency: null,
    priority: null,
    user: null,
    status: null,
    dueDateFilter: null,
  });
}

watch(
  () => clearTrigger,
  () => {
    clearFilters();
  }
);
</script>

<style scoped>
.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
}
.tbl-top-btn {
  height: 46px;
  border-radius: 8px;
  font-size: 14px;
  background-color: #F3F4F6 !important;
  text-transform: none;
  box-shadow: none;
  color: #737373;
  margin-left: 16px !important;
}
</style>
