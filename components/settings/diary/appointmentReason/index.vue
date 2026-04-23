<template>
  <div class="treatments-wrapper">
    <!-- Header -->
    <div class="cust-border d-flex align-center">
      <p class="mr-1">Treatments Management</p>
    </div>

    <!-- Main Content -->
    <div class="content-section mt-5 px-5">
      <!-- Table Controls -->
      <div class="table-controls">
        <div class="controls-left">
          <v-text-field
            v-model="search"
            placeholder="Search treatments..."
            clearable
            @click:clear="clearSearch"
            variant="solo"
            :elevation="0"
            density="compact"
            bg-color="#F3F4F6"
            hide-details
            flat
            class="custom-search"
          >
            <template #append-inner>
                <img
                  :src="searchIcon"
                  alt="search icon"
                  width="14"
                  height="14"
                />
            </template>
          </v-text-field>

          <!-- Category Filter -->
          <v-select
            v-model="selectedCategory"
            :items="categoryFilters"
            placeholder="All Categories"
            variant="solo"
            density="compact"
            bg-color="#F3F4F6"
            hide-details
            flat
            class="category-filter"
            clearable
          >
            <template #prepend-inner>
              <v-icon size="16" class="mr-1">mdi-tag-outline</v-icon>
            </template>
          </v-select>
        </div>

        <v-btn
          color="primary"
          variant="flat"
          rounded="lg"
          @click="openAddTreatment"
        >
          <v-icon start size="18">mdi-plus</v-icon>
          New Treatment
        </v-btn>
      </div>

      <!-- Treatments Table -->
      <div class="table-container">
        <div class="table-header">
          <h3 class="table-title">Treatment List</h3>
        </div>

        <v-data-table
          :headers="treatmentHeaders"
          :items="filteredTreatments"
          :search="search"
          item-key="id"
          class="full-width-table"
          :items-per-page="10"
          :loading="loading"
          loading-text="Loading treatments..."
        >
          <template v-slot:headers="{ columns }">
            <tr>
              <template v-for="(column, i) in columns" :key="column.key">
                <th
                  :style="{
                    width: column.width + 'px',
                    padding: '0px 7px',
                    fontSize: '14px',
                    backgroundColor: '#F6F6F6',
                  }"
                >
                  <div v-if="i !== 0" class="d-flex align-center th-content">
                    <p class="px-1 w-100 mb-0">{{ column.title }}</p>
                    <span
                      class="resize-handle"
                      @mousedown="startResize($event, column)"
                    ></span>
                  </div>
                  <div v-else class="d-flex justify-center">
                    <input
                      type="checkbox"
                      class="cust-checkbox ma-0"
                      :checked="allSelected"
                      :indeterminate.prop="someSelected"
                      @change="toggleAllRows"
                    />
                  </div>
                </th>
              </template>
            </tr>
          </template>

          <template v-slot:item="{ item }">
            <tr class="table-row">
              <td class="text-center">
                <input
                  type="checkbox"
                  class="cust-checkbox"
                  :checked="isRowSelected(item)"
                  @change="toggleRow(item)"
                />
              </td>
              <td class="text-left">
                <div class="d-flex align-center" style="gap: 10px">
                  <div
                    class="color-dot"
                    :style="{ background: item.color }"
                  ></div>
                  <div>
                    <div class="font-weight-medium">{{ item.name }}</div>
                    <div class="text-caption text-grey">
                      {{ item.code || "—" }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="text-left">
                <span class="text-grey-darken-1">
                  {{ item.category || "—" }}
                </span>
              </td>
              <!-- <td class="text-left">
                <span class="text-grey-darken-1">
                  {{ formatCurrency(item.price) }}
                </span>
              </td> -->
              <!-- <td class="text-left">
                <span class="text-grey-darken-1">
                  {{ item.duration || '—' }} min
                </span>
              </td> -->
              <td class="text-left">
                <v-chip
                  :color="item.active !== false ? '#10B981' : '#6B7280'"
                  size="x-small"
                  variant="flat"
                  class="status-chip"
                  text-color="white"
                >
                  {{ item.active !== false ? "Active" : "Inactive" }}
                </v-chip>
              </td>
              <td class="text-left">
                <v-tooltip text="Edit" location="top">
                  <template #activator="{ props }">
                    <span
                      v-bind="props"
                      style="display: inline-flex; cursor: pointer; margin-right: 8px"
                      @click="editTreatment(item)"
                    >
                      <img :src="editIcon" alt="edit" width="18" height="18" />
                    </span>
                  </template>
                </v-tooltip>

                <v-tooltip text="Delete" location="top">
                  <template #activator="{ props }">
                    <span
                      v-bind="props"
                      style="display: inline-flex; cursor: pointer"
                      @click="deleteTreatment(item)"
                    >
                      <img
                        :src="deleteIcon"
                        alt="delete"
                        width="18"
                        height="18"
                      />
                    </span>
                  </template>
                </v-tooltip>
              </td>
            </tr>
          </template>
        </v-data-table>
      </div>
    </div>

    <!-- Add/Edit Treatment Modal using AddAppointmentReason -->
    <AddAppointmentReason
      v-model="showTreatmentModal"
      :edit-data="editingTreatmentData"
      @save="handleSaveTreatment"
    />

    <!-- Delete Confirmation Dialog -->
    <CommonConfirmDialog
      v-model="deleteDialog.open"
      :title="deleteDialog.title"
      :message="deleteDialog.message"
      :loading="deleteDialog.loading"
      confirm-text="Delete"
      @confirm="confirmDelete"
      @cancel="closeDeleteDialog"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useOrgStore } from "@/stores/organisation";
import { useMainStore } from "@/stores/index";
import AddAppointmentReason from "./AddAppointmentReason.vue";
//icon
import searchIcon from "@/assets/icons/listView/serach-icon.svg";
import editIcon from "@/assets/icons/edit.svg";
import deleteIcon from "@/assets/icons/delete_1.svg";

const organisationStore = useOrgStore();
const mainStore = useMainStore();

// State
const treatments = ref([]);
const loading = ref(false);
const search = ref("");
const selectedCategory = ref(null);
const selectedTreatments = ref([]);

// Modal states
const showTreatmentModal = ref(false);
const editingTreatmentData = ref(null);

// Delete dialog
const deleteDialog = ref({
  open: false,
  treatmentId: null,
  treatmentName: "",
  title: "",
  message: "",
  loading: false,
});

// Table headers with resizable columns
const treatmentHeaders = ref([
  { title: "", key: "checkbox", sortable: false, width: 48 },
  { title: "Treatment Name", key: "name", align: "start", width: 220 },
  { title: "Category", key: "category", align: "start", width: 180 },
  // { title: 'Price', key: 'price', align: 'start', width: 120 },
  // { title: 'Duration', key: 'duration', align: 'start', width: 120 },
  { title: "Status", key: "status", align: "start", width: 100 },
  { title: "Actions", key: "actions", align: "center", width: 100 },
]);

// Stats cards
const treatmentStats = computed(() => [
  {
    icon: "https://cdn.lordicon.com/akqsdstj.json",
    label: "Total Treatments",
    value: treatments.value.length,
  },
  {
    icon: "https://cdn.lordicon.com/kphwxuxr.json",
    label: "Active",
    value: treatments.value.filter((t) => t.active !== false).length,
  },
  {
    icon: "https://cdn.lordicon.com/axteoudt.json",
    label: "Categories",
    value: new Set(treatments.value.map((t) => t.category)).size,
  },
  {
    icon: "https://cdn.lordicon.com/hjbrplhx.json",
    label: "Avg. Price",
    value: formatCurrencyAvg(),
  },
]);

// Category filters
const categoryFilters = computed(() => {
  const categories = new Set();
  treatments.value.forEach((t) => {
    if (t.category) categories.add(t.category);
  });
  return Array.from(categories).sort();
});

// Filtered treatments
const filteredTreatments = computed(() => {
  let filtered = [...treatments.value];

  if (search.value) {
    const searchTerm = search.value.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.name?.toLowerCase().includes(searchTerm) ||
        t.code?.toLowerCase().includes(searchTerm) ||
        t.category?.toLowerCase().includes(searchTerm),
    );
  }

  if (selectedCategory.value) {
    filtered = filtered.filter((t) => t.category === selectedCategory.value);
  }

  return filtered.sort((a, b) => a.name?.localeCompare(b.name || ""));
});

// Selection helpers
const allSelected = computed(() => {
  const total = filteredTreatments.value.length;
  const selected = selectedTreatments.value.length;
  return total > 0 && selected === total;
});

const someSelected = computed(() => {
  const total = filteredTreatments.value.length;
  const selected = selectedTreatments.value.length;
  return selected > 0 && selected < total;
});

const isRowSelected = (row) => {
  return selectedTreatments.value.some((r) => r.id === row.id);
};

const toggleRow = (row) => {
  const exists = selectedTreatments.value.some((r) => r.id === row.id);
  if (exists) {
    selectedTreatments.value = selectedTreatments.value.filter(
      (r) => r.id !== row.id,
    );
  } else {
    selectedTreatments.value = [...selectedTreatments.value, row];
  }
};

const toggleAllRows = () => {
  if (allSelected.value) {
    selectedTreatments.value = [];
  } else {
    selectedTreatments.value = [...filteredTreatments.value];
  }
};

// Helper functions
const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return "—";
  return `£${Number(amount).toFixed(2)}`;
};

const formatCurrencyAvg = () => {
  const activeTreatments = treatments.value.filter((t) => t.active !== false);
  if (activeTreatments.length === 0) return "£0.00";
  const total = activeTreatments.reduce(
    (sum, t) => sum + (Number(t.price) || 0),
    0,
  );
  return `£${(total / activeTreatments.length).toFixed(2)}`;
};

// Table resize handler
const startResize = (event, column) => {
  if (typeof window === "undefined") return;
  const startX = event.clientX || 0;
  const startWidth = Number(column.width) || 140;
  const onMouseMove = (e) => {
    const delta = (e.clientX || 0) - startX;
    column.width = Math.max(80, startWidth + delta);
  };
  const onMouseUp = () => {
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
};

// Load treatments
const loadTreatments = async () => {
  loading.value = true;
  try {
    const res = await organisationStore.listTreatments();
    if (res?.code === 0 && res?.data) {
      treatments.value = res.data;
    } else {
      treatments.value = [];
    }
  } catch (error) {
    console.error("Failed to load treatments:", error);
    treatments.value = [];
    mainStore.setSnackbar({
      message: "Failed to load treatments",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
};

// Open add treatment modal
const openAddTreatment = () => {
  editingTreatmentData.value = null;
  showTreatmentModal.value = true;
};

// Edit treatment
const editTreatment = (treatment) => {
  editingTreatmentData.value = treatment;
  showTreatmentModal.value = true;
};

// Handle save from AddAppointmentReason modal
const handleSaveTreatment = async (savedTreatment) => {
  try {
    await loadTreatments();
    mainStore.setSnackbar({
      message: editingTreatmentData.value
        ? "Treatment updated successfully"
        : "Treatment created successfully",
      color: "success",
    });
  } catch (error) {
    console.error("Failed to refresh treatments:", error);
    mainStore.setSnackbar({
      message: error.message || "Failed to save treatment",
      color: "error",
    });
  }
};

// Delete treatment
const deleteTreatment = (treatment) => {
  deleteDialog.value = {
    open: true,
    treatmentId: treatment.id,
    treatmentName: treatment.name,
    title: "Delete Treatment",
    message: `Are you sure you want to delete "${treatment.name}"? This action cannot be undone.`,
    loading: false,
  };
};

const closeDeleteDialog = () => {
  deleteDialog.value.open = false;
  deleteDialog.value.treatmentId = null;
};

const confirmDelete = async () => {
  deleteDialog.value.loading = true;
  try {
    const res = await organisationStore.deleteTreatment(
      deleteDialog.value.treatmentId,
    );
    if (res?.code === 0) {
      await loadTreatments();
      closeDeleteDialog();
      mainStore.setSnackbar({
        message: "Treatment deleted successfully",
        color: "success",
      });
    } else {
      throw new Error(res?.message || "Failed to delete treatment");
    }
  } catch (error) {
    console.error("Failed to delete treatment:", error);
    mainStore.setSnackbar({
      message: error.message || "Failed to delete treatment",
      color: "error",
    });
  } finally {
    deleteDialog.value.loading = false;
  }
};

const clearSearch = () => {
  search.value = "";
};

onMounted(() => {
  loadTreatments();
});
</script>

<style scoped lang="scss">
.treatments-wrapper {
  min-height: 100vh;
  background: #fafafa;
}

.cust-border {
  border-bottom: 1px solid #e5e7eb;
  padding: 17px;
  p {
    font-size: 12px;
    margin: 0;
  }
}

.stats-section {
  padding: 0;
}

.stat-row {
  display: flex;
  align-items: stretch;
}

.content-section {
  padding-bottom: 24px;
}

.table-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 16px;
}

.controls-left {

  display: flex;
  align-items: center;
  gap: 12px;
}

.custom-search {
  width: 250px;
  height: 46px;
  border-radius: 8px;
  font-size: 14px;
  background-color: #f3f4f6 !important;
  text-transform: none;
  box-shadow: none;
  color: #737373;
  align-items: center;
}

.category-filter {
  width: 200px;
  height: 46px;
}

.table-container {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.04);
}

.table-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  background: #fafafa;
}

.table-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.full-width-table {
  border-top: 1px solid rgb(var(--v-theme-outline));
  border-radius: unset;
}

:deep(.v-table__wrapper table) {
  width: 100% !important;
  table-layout: fixed;
}

:deep(.v-table .v-table__wrapper > table > thead > tr > th:not(:last-child)) {
  border-right: 1px solid rgb(var(--v-theme-outline));
}

:deep(.v-table .v-table__wrapper > table > tbody > tr > td:not(:last-child)) {
  border-right: 1px solid rgb(var(--v-theme-outline));
}

:deep(.v-data-table .v-table__wrapper tbody tr:hover) {
  background-color: #f9fafb;
  transition: background-color 0.2s ease;
}

.table-row {
  border-bottom: 1px solid #f3f4f6;
  transition: background 0.15s;
}

.table-row td {
  padding: 16px 16px;
  font-size: 14px;
  color: #374151;
}

.resize-handle {
  display: inline-block;
  width: 5px;
  cursor: col-resize;
}

.cust-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
  border: 1px solid #cfcfcf;
  border-radius: 4px;
  display: inline-block;
  position: relative;

  &:checked {
    background: #0061fb;
    border-color: #0061fb;

    &::after {
      content: "";
      position: absolute;
      left: 6px;
      top: 2px;
      width: 4px;
      height: 10px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }
  }
}

.color-dot {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  flex-shrink: 0;
}

.status-chip {
  border-radius: 100px !important;
  font-weight: 500;
  font-size: 10px;
  padding: 4px 8px;
  height: auto;
}

.action-btn {
  width: 32px;
  height: 32px;

  &:hover {
    background-color: #f3f4f6;
  }
}

@media (max-width: 768px) {
  .table-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .controls-left {
    flex-direction: column;
    width: 100%;
  }

  .custom-search,
  .category-filter {
    width: 100%;
  }
}
</style>
