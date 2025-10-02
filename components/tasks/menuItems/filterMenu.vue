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
        <v-icon class="ml-2" size="20">mdi-filter-outline</v-icon>
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
      </v-list>
    </v-card>
  </v-menu>
</template>

<script setup>
const { priorities, users } = defineProps({
  priorities: Array,
  users: Array,
});

const emit = defineEmits(["update:filters"]);

const filterMenu = ref(false);
const frequencies = ref([
  { id: 1, name: "Daily" },
  { id: 2, name: "Weekly" },
  { id: 3, name: "Monthly" },
]);

const selectedFrequency = ref(null);
const selectedPriority = ref(null);
const selectedPerson = ref(null);

// Emit every time one of them changes
watch([selectedFrequency, selectedPriority, selectedPerson], () => {
  emit("update:filters", {
    frequency: selectedFrequency.value,
    priority: selectedPriority.value,
    user: selectedPerson.value,
  });
});
const clearFilters =()=>{
  selectedFrequency.value=null,
  selectedPriority.value=null,
  selectedPerson.value=null
}
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
  height: 40px;
  border-radius: 6px;
  font-size: 14px;
  background-color: #fafafa !important;
  text-transform: none;
  box-shadow: none;
  color: #737373;
}
</style>
