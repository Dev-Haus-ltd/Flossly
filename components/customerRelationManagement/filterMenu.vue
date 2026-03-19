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

          <!-- Active filter chips -->
          <div v-if="activeFiltersCount > 0" class="mb-3 d-flex align-center flex-wrap" style="gap: 8px">
            <v-chip
              v-if="selectedInquiryDate"
              size="small"
              variant="tonal"
              color="primary"
              closable
              @click:close="clearInquiryDate"
            >
              Inquiry: {{ formattedInquiryDate }}
            </v-chip>
            <v-chip
              v-if="selectedLeadSource"
              size="small"
              variant="tonal"
              color="primary"
              closable
              @click:close="clearLeadSource"
            >
              Source: {{ selectedLeadSourceName }}
            </v-chip>
            <v-chip
              v-if="selectedLeadStatus"
              size="small"
              variant="tonal"
              color="primary"
              closable
              @click:close="clearLeadStatus"
            >
              Status: {{ selectedLeadStatusName }}
            </v-chip>
            <v-chip
              v-if="selectedTreatment"
              size="small"
              variant="tonal"
              color="primary"
              closable
              @click:close="clearTreatment"
            >
              Treatment: {{ selectedTreatmentName }}
            </v-chip>
            <v-chip
              v-if="selectedAlert"
              size="small"
              variant="tonal"
              color="primary"
              closable
              @click:close="clearAlert"
            >
              Alert: {{ selectedAlertName }}
            </v-chip>
          </div>

          <!-- Inquiry Date -->
          <v-label class="my-1" style=" font-size: 14px">
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
                clearable
                @click:clear="clearInquiryDate"
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
          <v-label class="my-1" style=" font-size: 14px">
            Lead Source
          </v-label>
          <v-select
            v-model="selectedLeadSource"
            :items="leadSourceOptions"
            item-title="name"
            item-value="id"
            variant="solo"
            flat
            density="compact"
            hide-details
            class="input-bordered"
            clearable
            @click:clear="clearLeadSource"
          />
  
          <!-- Lead Status -->
          <v-label class="my-1" style=" font-size: 14px">
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
            clearable
            @click:clear="clearLeadStatus"
          />
  
          <!-- Treatment -->
          <v-label class="my-1" style=" font-size: 14px">
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
            clearable
            @click:clear="clearTreatment"
          />

          <!-- Alert -->
          <v-label class="my-1 mt-2" style="font-size: 14px">
            Alert
          </v-label>
          <v-select
            v-model="selectedAlert"
            :items="alertOptions"
            item-title="label"
            item-value="key"
            variant="solo"
            flat
            density="compact"
            hide-details
            class="input-bordered"
            clearable
            @click:clear="clearAlert"
          >
            <template #item="{ item, props: itemProps }">
              <v-list-item v-bind="itemProps">
                <template #prepend>
                  <span style="font-size:16px; margin-right:8px">{{ item.raw.emoji }}</span>
                </template>
              </v-list-item>
            </template>
            <template #selection="{ item }">
              <span>{{ item.raw.emoji }} {{ item.raw.label }}</span>
            </template>
          </v-select>
        </v-list>
      </v-card>
    </v-menu>
  </template>
  
  <script setup>
  import { ref, watch, computed } from "vue";
  import { formatDateDDMMYYYY } from "@/lib/dateFormatter";
  import filtericon from "@/assets/icons/listView/filter-icon.svg";

  const { leadSources, treatmentSources, alertOptions } = defineProps({
    leadSources: Array,
    treatmentSources: Array,
    alertOptions: { type: Array, default: () => [] },
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
      formattedInquiryDate.value = formatDateDDMMYYYY(val);
      inquiryDateMenu.value = false;
    }
  };
  
  // filters
  const selectedLeadSource = ref(null);
  const selectedLeadStatus = ref(null);
  const selectedTreatment = ref(null);
  const selectedAlert = ref(null);

  // Keep in sync with components/dataTableColumns/leadStatus.vue
  const leadStatuses = ref([
    { key: "new", name: "New", color: "#00A856" },
    { key: "converted", name: "Converted", color: "#0155B9" },
    { key: "contacted", name: "Contacted", color: "#ffc107" },
    { key: "lost", name: "Lost", color: "#dc3545" },
  ]);

  // Derived names for chips
  const leadSourceOptions = computed(() =>
    Array.isArray(leadSources) ? [...leadSources] : []
  );

  const resolvedLeadSourceId = computed(() => {
    const raw = selectedLeadSource.value;
    if (raw == null || raw === "") return null;
    if (typeof raw === "number") return raw;
    const rawStr = String(raw).trim();
    if (!rawStr) return null;
    const byId = (leadSourceOptions.value || []).find(
      (x) => String(x.id) === rawStr
    );
    if (byId?.id != null) return byId.id;
    const byName = (leadSourceOptions.value || []).find(
      (x) =>
        String(x.name || "")
          .trim()
          .toLowerCase() === rawStr.toLowerCase()
    );
    return byName?.id ?? null;
  });

  const selectedLeadSourceName = computed(() => {
    const raw = selectedLeadSource.value;
    const found = (leadSourceOptions.value || []).find?.(
      (x) => String(x.id) === String(raw)
    );
    if (found?.name) return found.name;
    if (typeof raw === "string" && raw.trim()) return raw.trim();
    return "";
  });
  const selectedLeadStatusName = computed(() => {
    const found = (leadStatuses.value || []).find(x => String(x.key) === String(selectedLeadStatus.value))
    return found?.name || ''
  })
  const selectedTreatmentName = computed(() => {
    const found = (treatmentSources || []).find?.(x => String(x.id) === String(selectedTreatment.value))
    return found?.name || ''
  })

  const selectedAlertName = computed(() => {
    const found = (alertOptions || []).find(o => o.key === selectedAlert.value)
    return found ? `${found.emoji} ${found.label}` : ''
  })

  const activeFiltersCount = computed(() => {
    let c = 0
    if (selectedInquiryDate.value) c++
    if (selectedLeadSource.value) c++
    if (selectedLeadStatus.value) c++
    if (selectedTreatment.value) c++
    if (selectedAlert.value) c++
    return c
  })
  
  watch(
    [selectedInquiryDate, selectedLeadSource, selectedLeadStatus, selectedTreatment, selectedAlert],
    () => {
      emit("update:filters", {
        inquiryDate: selectedInquiryDate.value,
        leadSourceId: resolvedLeadSourceId.value,
        leadStatus: selectedLeadStatus.value,
        treatmentId: selectedTreatment.value,
        alert: selectedAlert.value || undefined,
      });
    }
  );

  const clearFilters = () => {
    selectedInquiryDate.value = null;
    formattedInquiryDate.value = "";
    selectedLeadSource.value = null;
    selectedLeadStatus.value = null;
    selectedTreatment.value = null;
    selectedAlert.value = null;
  };

  const clearInquiryDate = () => { selectedInquiryDate.value = null; formattedInquiryDate.value = "" }
  const clearLeadSource = () => { selectedLeadSource.value = null }
  const clearLeadStatus = () => { selectedLeadStatus.value = null }
  const clearTreatment = () => { selectedTreatment.value = null }
  const clearAlert = () => { selectedAlert.value = null }
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
    background-color: #F3F4F6 !important;
    color: #737373;
    margin-left: 16px !important;
  }
  </style>
  
