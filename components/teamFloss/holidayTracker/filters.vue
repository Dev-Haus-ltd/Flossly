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
        <v-icon class="ml-2" size="20">mdi-filter-outline</v-icon>
      </v-btn>
    </template>

    <v-card style="min-width: 300px; border-radius: 12px; padding: 16px">
      <v-list class="pa-0">
        <div class="pa-0 d-flex align-center justify-space-between">
          <div style="font-family: Poppins; font-weight: 500; font-size: 14px">
            Filters by
          </div>

          <v-btn
            variant="text"
            density="comfortable"
            color="primary"
            style="
              text-transform: none;
              font-family: Poppins;
              font-weight: 500;
              font-size: 13px;
            "
            @click="clearFilters"
          >
            Clear filters
          </v-btn>
        </div>

        <v-divider style="background-color: #dbdbdb" class="my-3" />

        <!-- Role -->
        <v-label class="my-1" style="font-family: Poppins; font-size: 14px">
          Status
        </v-label>
        <v-select
          v-model="filters.status"
          :items="[]"
          item-title="name"
          item-value="id"
          variant="solo"
          flat
          density="compact"
          hide-details
          class="input-bordered"
        />

        <!-- Date of Joining -->
        <v-label class="my-1" style="font-family: Poppins; font-size: 14px">
          Date Range
        </v-label>
        // Date Range Picker

        <!-- Profile Completion % -->
        <v-label class="my-1" style="font-family: Poppins; font-size: 14px">
          Type
        </v-label>
        <v-select
          v-model="filters.leaveType"
          :items="[]"
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
const { roles, users } = defineProps({
  roles: Array,
  users: Array,
});

const emit = defineEmits(["update:filters"]);

const filterMenu = ref(false);

const filters = ref({
  status: "",
  startDate: "",
  endDate: "",
  roleId: null,
  leaveType: null,
});

watch(filters.value, () => {
  emit("update:filters", filters.value);
});

const clearFilters = () => {
  filters.value = {
    status: "",
    startDate: "",
    endDate: "",
    roleId: null,
    leaveType: null,
  };
};
</script>

<style scoped>
.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
  font-family: "Poppins", sans-serif;
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
