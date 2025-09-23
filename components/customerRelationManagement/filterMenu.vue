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
            <div style="font-family: Poppins; font-weight: 500; font-size: 14px">
              Filters by
            </div>
  
            <v-btn
              variant="text"
              density="comfortable"
              color="primary"
              style="text-transform: none; font-family: Poppins; font-weight: 500; font-size: 13px"
              @click="clearFilters"
            >
              Clear filters
            </v-btn>
          </div>
  
          <v-divider style="background-color: #dbdbdb" class="my-3" />
  
          <!-- Inquiry Date -->
          <v-label class="my-1" style="font-family: Poppins; font-size: 14px">
            Inquiry Date
          </v-label>
          <v-menu
            v-model="inquiryDateMenu"
            :close-on-content-click="false"
            transition="scale-transition"
            offset-y
            min-width="auto"
          >
            <template #activator="{ props }">
              <v-text-field
                v-model="formattedInquiryDate"
                v-bind="props"
                variant="solo"
                density="compact"
                class="mb-1 input-bordered"
                bg-color="white"
                flat
                readonly
                hide-details
              >
                <template #append-inner>
                  <v-icon class="cursor-pointer" @click.stop="inquiryDateMenu = true">
                    mdi-calendar
                  </v-icon>
                </template>
              </v-text-field>
            </template>
  
            <v-date-picker
              v-model="selectedInquiryDate"
              @update:modelValue="onDateSelected"
            />
          </v-menu>
  
          <!-- Lead Source -->
          <v-label class="my-1" style="font-family: Poppins; font-size: 14px">
            Lead Source
          </v-label>
          <v-select
            v-model="selectedLeadSource"
            :items="leadSources"
            item-title="name"
            item-value="id"
            variant="solo"
            flat
            density="compact"
            hide-details
            class="input-bordered"
          />
  
          <!-- Lead Status -->
          <v-label class="my-1" style="font-family: Poppins; font-size: 14px">
            Lead Status
          </v-label>
          <v-select
            v-model="selectedLeadStatus"
            :items="leadStatuses"
            item-title="name"
            item-value="key"
            variant="solo"
            flat
            density="compact"
            hide-details
            class="input-bordered"
          />
  
          <!-- Treatment -->
          <v-label class="my-1" style="font-family: Poppins; font-size: 14px">
            Treatment
          </v-label>
          <v-select
            v-model="selectedTreatment"
            :items="treatmentSources"
            item-title="name"
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
  import { ref, watch } from "vue";
  
  const { leadSources, treatmentSources } = defineProps({
    leadSources: Array,
    treatmentSources: Array,
  });
  
  const emit = defineEmits(["update:filters"]);
  
  const filterMenu = ref(false);
  
  // inquiry date picker
  const inquiryDateMenu = ref(false);
  const selectedInquiryDate = ref(null);
  const formattedInquiryDate = ref("");
  
  // update formatted date
  const onDateSelected = (val) => {
    if (val) {
      formattedInquiryDate.value = new Date(val).toLocaleDateString("en-GB"); // DD/MM/YYYY
      inquiryDateMenu.value = false;
    }
  };
  
  // filters
  const selectedLeadSource = ref(null);
  const selectedLeadStatus = ref(null);
  const selectedTreatment = ref(null);
  
  const leadStatuses = ref([
    { key: "new", name: "New", color: "#007BFF" },
    { key: "contacted", name: "Contacted", color: "#28A745" },
    { key: "qualified", name: "Qualified", color: "#FFC107" },
    { key: "proposal", name: "Proposal Sent", color: "#17A2B8" },
    { key: "won", name: "Won", color: "#20C997" },
    { key: "lost", name: "Lost", color: "#DC3545" },
  ]);
  
  watch(
    [selectedInquiryDate, selectedLeadSource, selectedLeadStatus, selectedTreatment],
    () => {
      emit("update:filters", {
        inquiryDate: selectedInquiryDate.value,
        leadSourceId: selectedLeadSource.value,
        leadStatus: selectedLeadStatus.value,
        treatmentId: selectedTreatment.value,
      });
    }
  );
  
  const clearFilters = () => {
    selectedInquiryDate.value = null;
    formattedInquiryDate.value = "";
    selectedLeadSource.value = null;
    selectedLeadStatus.value = null;
    selectedTreatment.value = null;
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
  