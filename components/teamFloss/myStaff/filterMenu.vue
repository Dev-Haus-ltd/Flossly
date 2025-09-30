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
          style="width: 100px"
        >
          <span>Filter</span>
          <v-icon class="ml-2" size="20">mdi-filter-outline</v-icon>
        </v-btn>
      </template>
  
      <v-card style="min-width: 300px; border-radius: 12px; padding: 16px">
        <v-list class="pa-0">
          <div class="pa-0 d-flex align-center justify-space-between">
            <div style=" font-weight: 500; font-size: 14px">
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
  
          <!-- Role -->
          <v-label class="my-1" style=" font-size: 14px">
            Role
          </v-label>
          <v-select
            v-model="selectedRole"
            :items="roles"
            item-title="name"
            item-value="id"
            variant="solo"
            flat
            density="compact"
            hide-details
            class="input-bordered"
          />
  
          <!-- Date of Joining -->
          <v-label class="my-1" style=" font-size: 14px">
            Date of Joining
          </v-label>
          <v-text-field
            v-model="selectedDOJ"
            type="date"
            variant="solo"
            flat
            density="compact"
            hide-details
            class="input-bordered"
          />
  
          <!-- Profile Completion % -->
          <v-label class="my-1" style=" font-size: 14px">
            Profile Completion %
          </v-label>
          <v-select
            v-model="selectedProfileCompletion"
            :items="percentages"
            variant="solo"
            flat
            density="compact"
            hide-details
            class="input-bordered"
          />
  
          <!-- Recruitment Docs % -->
          <v-label class="my-1" style=" font-size: 14px">
            Recruitment Docs %
          </v-label>
          <v-select
            v-model="selectedRecruitmentDocs"
            :items="percentages"
            variant="solo"
            flat
            density="compact"
            hide-details
            class="input-bordered"
          />
  
          <!-- CPD Training Completion % -->
          <v-label class="my-1" style=" font-size: 14px">
            CPD Training Completion %
          </v-label>
          <v-select
            v-model="selectedCPD"
            :items="percentages"
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
  const { roles } = defineProps({
    roles: Array, // [{ id: 1, name: "Manager" }, ...]
  });
  
  const emit = defineEmits(["update:filters"]);
  
  const filterMenu = ref(false);
  const percentages = ref([0, 25, 50, 75, 100]);
  
  const selectedRole = ref(null);
  const selectedDOJ = ref(null);
  const selectedProfileCompletion = ref(null);
  const selectedRecruitmentDocs = ref(null);
  const selectedCPD = ref(null);
  
  watch(
    [selectedRole, selectedDOJ, selectedProfileCompletion, selectedRecruitmentDocs, selectedCPD],
    () => {
      emit("update:filters", {
        role: selectedRole.value,
        doj: selectedDOJ.value,
        profileCompletion: selectedProfileCompletion.value,
        recruitmentDocs: selectedRecruitmentDocs.value,
        cpd: selectedCPD.value,
      });
    }
  );
  
  const clearFilters = () => {
    selectedRole.value = null;
    selectedDOJ.value = null;
    selectedProfileCompletion.value = null;
    selectedRecruitmentDocs.value = null;
    selectedCPD.value = null;
  };
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
  