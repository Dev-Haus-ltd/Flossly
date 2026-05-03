<template>
  <div class="zones-wrapper">
    <!-- Header -->
    <div class="cust-border d-flex align-center">
      <p class="mr-1 text-medium-emphasis">Zones Management</p>
    </div>

    <!-- Main Content -->
    <div class="content-section mt-5 px-5">
      <!-- Table Controls -->
      <div class="table-controls">
        <div class="controls-left">
          <div style="width: 120px">
            <v-text-field
              v-model="search"
              placeholder="Search zones..."
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
          </div>
        </div>

        <v-btn
          color="primary"
          variant="flat"
          rounded="lg"
          @click="openCreateModal"
        >
          <v-icon start size="18">mdi-plus</v-icon>
          New Zone
        </v-btn>
      </div>

      <!-- Zones Table -->
      <div class="table-container">
        <div class="table-header">
          <h3 class="table-title">Zone List</h3>
        </div>

        <v-data-table
          :headers="zoneHeaders"
          :items="filteredZones"
          :search="search"
          item-key="id"
          class="full-width-table"
          :items-per-page="10"
          :loading="zonesStore.getIsLoading"
          loading-text="Loading zones..."
        >
          <template v-slot:headers="{ columns }">
            <tr>
              <th
                v-for="column in columns"
                :key="column.key"
                :style="{
                  width: column.width + 'px',
                  padding: '0px 7px',
                  fontSize: '14px',
                  backgroundColor: '#F6F6F6',
                }"
              >
                <div class="d-flex align-center th-content">
                  <p class="px-1 w-100 mb-0">{{ column.title }}</p>
                  <span
                    class="resize-handle"
                    @mousedown="startResize($event, column)"
                  ></span>
                </div>
              </th>
            </tr>
          </template>

          <template v-slot:item="{ item }">
            <tr class="table-row">
              <td class="text-left">
                <div class="d-flex align-center" style="gap: 10px">
                  <div
                    class="color-dot"
                    :style="{ background: item.color }"
                  ></div>
                  <div>
                    <div class="font-weight-medium">{{ item.title }}</div>
                  </div>
                </div>
              </td>
              <td class="text-left">
                <div class="d-flex align-center" style="gap: 8px">
                  <!-- Avatar -->
                  <v-tooltip location="top">
                    <template #activator="{ props }">
                      <span v-bind="props">
                        <CommonAvatar
                          v-if="item.dentistName"
                          :user="{ name: item.dentistName }"
                          size="32px"
                        />
                      </span>
                    </template>

                    <span>{{ item.dentistName }}</span>
                  </v-tooltip>
                  <!-- Expand icon -->
                  <img
                    :src="expandIcon"
                    alt="expand"
                    class="ml-2 expand-icon"
                    @click="navigateToCalendar(item)"
                  />
                </div>
              </td>
              <td class="text-left">
                <span class="text-grey-darken-1">
                  {{ formatTime(item.startTime) }} –
                  {{ formatTime(item.endTime) }}
                </span>
              </td>
              <td class="text-left">
                <div class="days-wrapper">
                  <span
                    v-for="day in getDayLabels(item.selectedDays)"
                    :key="day"
                    class="day-chip"
                  >
                    {{ day }}
                  </span>
                </div>
              </td>
              <td class="text-left">
                <span class="text-grey-darken-1">
                  {{ formatDate(item.startDate) }} –
                  {{ formatDate(item.endDate) }}
                </span>
              </td>
              <td class="text-left">
                <v-chip
                  size="x-small"
                  variant="flat"
                  class="pattern-chip"
                  :class="getPatternClass(item.repeatPattern)"
                >
                  {{ item.repeatPattern || "—" }}
                </v-chip>
              </td>
              <td class="text-left">
                <v-chip
                  size="x-small"
                  variant="flat"
                  class="display-chip"
                  :class="getDisplayClass(item.displayType)"
                >
                  {{ item.displayType || "—" }}
                </v-chip>
              </td>
              <td class="text-left">
                <v-tooltip text="Duplicate" location="top">
                  <template #activator="{ props }">
                    <span
                      v-bind="props"
                      style="
                        display: inline-flex;
                        cursor: pointer;
                        margin-right: 8px;
                      "
                      @click="duplicateZone(item)"
                    >
                      <v-icon size="18" color="#6B7280"
                        >mdi-content-copy</v-icon
                      >
                    </span>
                  </template>
                </v-tooltip>

                <v-tooltip text="Edit" location="top">
                  <template #activator="{ props }">
                    <span
                      v-bind="props"
                      style="
                        display: inline-flex;
                        cursor: pointer;
                        margin-right: 8px;
                      "
                      @click="editZone(item)"
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
                      @click="deleteZoneConfirm(item)"
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

    <!-- Create/Edit Modal -->
    <ZoneFormModal
      v-model="showModal"
      :zone="editingZone"
      :dentists="dentists"
      @save="handleZoneSave"
      @close="closeModal"
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
import { useRouter } from "vue-router";
import { useZonesStore } from "~/stores/zones";
import { useDiaryStore } from "~/stores/diary";
import { useMainStore } from "~/stores/index";
import ZoneFormModal from "./ZoneFormModal.vue";
// Icons
import expandIcon from "../../assets/dashboard/expandIcon.svg";
import searchIcon from "@/assets/icons/listView/serach-icon.svg";
import editIcon from "@/assets/icons/edit.svg";
import deleteIcon from "@/assets/icons/delete_1.svg";

const zonesStore = useZonesStore();
const diaryStore = useDiaryStore();
const mainStore = useMainStore();
const router = useRouter();

// State
const search = ref("");
const selectedPractitioner = ref(null);
const selectedPattern = ref(null);
const dentists = ref([]);
const showModal = ref(false);
const editingZone = ref(null);

// Delete dialog
const deleteDialog = ref({
  open: false,
  zoneId: null,
  zoneName: "",
  title: "",
  message: "",
  loading: false,
});

// Table headers with resizable columns
const zoneHeaders = ref([
  { title: "Zone Title", key: "title", align: "start", width: 200 },
  { title: "Practitioner", key: "dentistName", align: "start", width: 100 },
  { title: "Time", key: "time", align: "start", width: 160 },
  { title: "Days", key: "days", align: "start", width: 100 },
  { title: "Dates", key: "dates", align: "start", width: 200 },
  { title: "Pattern", key: "repeatPattern", align: "start", width: 80 },
  { title: "Display", key: "displayType", align: "start", width: 70 },
  { title: "Actions", key: "actions", align: "center", width: 120 },
]);

const zones = computed(() => zonesStore.getAllZones);

// Filtered zones
const filteredZones = computed(() => {
  let filtered = [...zones.value];

  if (search.value) {
    const searchTerm = search.value.toLowerCase();
    filtered = filtered.filter(
      (zone) =>
        zone.title?.toLowerCase().includes(searchTerm) ||
        zone.dentistName?.toLowerCase().includes(searchTerm),
    );
  }

  if (selectedPractitioner.value) {
    filtered = filtered.filter(
      (zone) => zone.dentistName === selectedPractitioner.value,
    );
  }

  if (selectedPattern.value) {
    filtered = filtered.filter(
      (zone) => zone.repeatPattern === selectedPattern.value,
    );
  }

  return filtered.sort((a, b) => a.title?.localeCompare(b.title || ""));
});

const dayLabels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const getDayLabels = (days) => {
  if (!days || !days.length) return [];
  return days.map((d) => dayLabels[d] || "").filter(Boolean);
};

const formatTime = (timeStr) => {
  if (!timeStr) return "—";
  const [hours, minutes] = timeStr.split(":").slice(0, 2);
  const h = Number(hours);
  const m = minutes;
  const period = h >= 12 ? "PM" : "AM";
  const displayHour = h % 12 || 12;
  return `${displayHour}:${m} ${period}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getPatternClass = (pattern) => {
  const classes = {
    weekly: "pattern-weekly",
    "bi-weekly": "pattern-biweekly",
    monthly: "pattern-monthly",
  };
  return classes[pattern] || "";
};

const getDisplayClass = (display) => {
  const classes = {
    background: "display-background",
    border: "display-border",
    both: "display-both",
  };
  return classes[display] || "";
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

const openCreateModal = () => {
  editingZone.value = null;
  showModal.value = true;
};

const editZone = (zone) => {
  editingZone.value = { ...zone };
  showModal.value = true;
};

const duplicateZone = (zone) => {
  editingZone.value = {
    ...zone,
    id: undefined,
    title: `${zone.title} (Copy)`,
  };
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingZone.value = null;
};

const handleZoneSave = async (zone) => {
  try {
    if (zone.id) {
      await zonesStore.updateZone(zone);
      mainStore.setSnackbar({
        title: "Zone updated successfully",
        type: "success",
      });
    } else {
      await zonesStore.createZone(zone);
      mainStore.setSnackbar({
        title: "Zone created successfully",
        type: "success",

      });
    }
    await zonesStore.fetchZones();
    closeModal();
  } catch (err) {
    mainStore.setSnackbar({
      title: "Failed to save zone",
      type: "error",
    });
  }
};

const deleteZoneConfirm = (zone) => {
  deleteDialog.value = {
    open: true,
    zoneId: zone.id,
    zoneName: zone.title,
    title: "Delete Zone",
    message: `Are you sure you want to delete "${zone.title}"? This action cannot be undone.`,
    loading: false,
  };
};

const closeDeleteDialog = () => {
  deleteDialog.value.open = false;
  deleteDialog.value.zoneId = null;
};

const confirmDelete = async () => {
  deleteDialog.value.loading = true;
  try {
    await zonesStore.deleteZone(deleteDialog.value.zoneId);
    await zonesStore.fetchZones();
    mainStore.setSnackbar({
      title: "Zone deleted successfully",
      type: "success",
    });
    closeDeleteDialog();
  } catch (err) {
    mainStore.setSnackbar({
      title: "Failed to delete zone",
      type: "error",
    });
  } finally {
    deleteDialog.value.loading = false;
  }
};

const navigateToCalendar = (zone) => {
 router.push({
    path: "/diary/calendar",
    query: {
      date: zone.startDate, 
      
    },
  });
};

const clearSearch = () => {
  search.value = "";
};

const loadDentists = async () => {
  try {
    const res = await diaryStore.listDentists();
    if (res?.code === 0) {
      dentists.value = res.data || [];
    }
  } catch (err) {
    console.error("Failed to load dentists:", err);
  }
};

onMounted(async () => {
  await zonesStore.fetchZones();
  await loadDentists();
});
</script>

<style scoped lang="scss">

.cust-border {
  border-bottom: 1px solid #e5e7eb;
  padding: 17px;
  background: white;

  p {
    font-size: 12px;
    margin: 0;
    font-weight: 600;
  }
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
  flex: 1;
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
  min-width: 700px; /* or 800+ depending columns */
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
  margin-left: auto;
}

.color-dot {
  margin-left: 4px;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  flex-shrink: 0;
}

.days-wrapper {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.day-chip {
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  color: #4b5563;
  font-weight: 500;
}

.pattern-chip {
  border-radius: 100px !important;
  font-weight: 500;
  font-size: 10px;
  padding: 4px 8px;
  height: auto;
}

.pattern-weekly {
  background: #e0f2fe !important;
  color: #0284c7 !important;
}

.pattern-biweekly {
  background: #dcfce7 !important;
  color: #16a34a !important;
}

.pattern-monthly {
  background: #fef3c7 !important;
  color: #d97706 !important;
}

.display-chip {
  border-radius: 100px !important;
  font-weight: 500;
  font-size: 10px;
  padding: 4px 8px;
  height: auto;
}

.display-background {
  background: #f3e8ff !important;
  color: #9333ea !important;
}

.display-border {
  background: #fee2e2 !important;
  color: #dc2626 !important;
}

.display-both {
  background: #ccfbf1 !important;
  color: #0d9488 !important;
}

.expand-icon {
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.1);
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
