<template>
  <div class="communication-hub">
    <section class="hub-card">
      <div class="hub-card__header">
        <h2>Communication Hub</h2>

        <div class="header-actions">
          <v-btn
            color="primary"
            variant="flat"
            rounded="lg"
            @click="showNewCorrespondence = true"
          >
            <v-icon start size="18">mdi-plus</v-icon>
            New Correspondence
          </v-btn>
        </div>
      </div>

      <!-- Table Controls - Single Filter Component -->
      <div class="table-controls">
        <div class="controls-left">
          <div style="width: 100px">
            <v-text-field
              v-model="searchQuery"
              placeholder="Search "
              clearable
              @click:clear="clearSearch"
              @update:model-value="debouncedSearch"
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

          <!-- Combined Multi-Select Filter -->
          <div style="width: 280px">
            <!-- Filter Menu -->
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
                >
                  <span>Filter</span>

                  <img
                    :src="filterIcon"
                    alt="filter"
                    class="ml-2"
                    width="14"
                    height="14"
                  />

                  <v-badge
                    v-if="activeFilterCount > 0"
                    :content="activeFilterCount"
                    color="primary"
                    inline
                    class="ml-2"
                  />
                </v-btn>
              </template>

              <v-card class="filter-menu-card">
                <div class="filter-menu-header">
                  <div class="filter-menu-title">Filter by</div>

                  <v-btn
                    variant="text"
                    density="comfortable"
                    color="primary"
                    class="clear-filter-btn"
                    @click="clearAllFilters"
                  >
                    Clear filters
                  </v-btn>
                </div>

                <v-divider class="my-3" />

                <!-- Active Chips -->
                <div v-if="activeFilterCount > 0" class="active-filter-chips">
                  <v-chip
                    v-if="filterType"
                    size="small"
                    variant="tonal"
                    color="primary"
                    closable
                    @click:close="
                      filterType = '';
                      applyFilters();
                    "
                  >
                    Type: {{ filterType }}
                  </v-chip>

                  <v-chip
                    v-if="filterStatus"
                    size="small"
                    variant="tonal"
                    color="primary"
                    closable
                    @click:close="
                      filterStatus = '';
                      applyFilters();
                    "
                  >
                    Status: {{ filterStatus }}
                  </v-chip>

                  <v-chip
                    v-if="filterDateRange"
                    size="small"
                    variant="tonal"
                    color="primary"
                    closable
                    @click:close="
                      filterDateRange = '';
                      applyFilters();
                    "
                  >
                    Date: {{ getDateRangeLabel(filterDateRange) }}
                  </v-chip>
                </div>

                <!-- Type -->
                <v-label class="filter-label">Communication Type</v-label>

                <v-select
                  v-model="filterType"
                  :items="communicationTypes"
                  item-title="title"
                  item-value="value"
                  variant="solo"
                  flat
                  density="compact"
                  hide-details
                  class="input-bordered"
                  clearable
                  @update:model-value="applyFilters"
                />

                <!-- Status -->
                <v-label class="filter-label">Status</v-label>

                <v-select
                  v-model="filterStatus"
                  :items="communicationStatuses"
                  item-title="title"
                  item-value="value"
                  variant="solo"
                  flat
                  density="compact"
                  hide-details
                  class="input-bordered"
                  clearable
                  @update:model-value="applyFilters"
                />
              </v-card>
            </v-menu>
          </div>
        </div>
      </div>

      <!-- <div class="stats-bar" v-if="totalLogs > 0">
        <span class="stats-text"
          >{{ totalLogs }} communication{{ totalLogs !== 1 ? "s" : "" }}</span
        >
      </div> -->

      <div class="hub-table-wrap">
        <v-data-table-server
          v-model="selectedItems"
          :headers="tableHeaders"
          :items="logs"
          :items-length="totalLogs"
          :loading="loading"
          :page="currentPage"
          :items-per-page="pageSize"
          :items-per-page-options="[10, 20, 50, 100]"
          hover
          class="full-width-table"
          density="compact"
          @update:options="onTableOptionsUpdate"
          @update:page="(val) => changePage(val)"
          @update:items-per-page="(val) => updateItemsPerPage(val)"
          return-object
        >
          <template v-slot:headers="{ columns }">
            <tr>
              <th
                v-for="column in columns"
                :key="column.key"
                :style="{
                  width: column.width + 'px',
                  minWidth: column.width + 'px',
                  padding: '0px 7px',
                  fontSize: '14px',
                  backgroundColor: '#f6f6f6',
                  position: 'relative',
                }"
              >
                <div class="d-flex align-center th-content">
                  <p class="px-1 w-100 mb-0">{{ column.title }}</p>
                  <span
                    v-if="column.resizable"
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
                <div class="kind-cell">
                  <v-icon size="16" :color="getIconColor(item.type)">{{
                    getTypeIcon(item.type)
                  }}</v-icon>
                  <span>{{ item.type }}</span>
                </div>
              </td>
              <td class="text-left">
                <div class="description-content">
                  <span
                    :title="item.subject || item.content || 'No description'"
                  >
                    {{
                      truncateText(
                        item.subject || item.content || "No description",
                        50,
                      )
                    }}
                  </span>
                  <span v-if="item.metadata?.channel" class="channel-badge">
                    via {{ item.metadata.channel }}
                  </span>
                </div>
              </td>
              <td class="text-left">
                <span
                  class="status-badge"
                  :class="`status-badge--${item.status.toLowerCase()}`"
                >
                  {{ item.status }}
                </span>
              </td>
              <td class="text-left">
                {{ formatDate(item.sentAt || item.createdAt) }}
              </td>
              <td class="text-left">
                {{ formatDateShort(item.createdAt) }}
              </td>
              <td class="text-left">
                <div class="action-cell">
                  <button
                    type="button"
                    class="action-menu-trigger"
                    @click="editCorrespondence(item)"
                  >
                    <img
                      :src="editIcon"
                      alt="Edit"
                      class="communication-action-btn"
                    />
                  </button>
                  
                  <button
                    type="button"
                    class="action-menu-trigger"
                    @click="viewDetails(item)"
                  >
                    <img
                      :src="viewIcon"
                      alt="View"
                      class="communication-action-btn"
                    />
                  </button>
                  <button
                    type="button"
                    class="action-menu-trigger"
                    @click="showDeleteConfirm(item)"
                  >
                    <img
                      :src="deleteIcon"
                      alt="Delete"
                      class="communication-action-btn"
                    />
                  </button>

                  <button
                    v-if="item.status === 'Failed'"
                    type="button"
                    class="action-menu-trigger"
                    @click="retryLog(item)"
                  >
                    <v-icon size="18" color="#f5a623">mdi-restart</v-icon>
                  </button>
                </div>
              </td>
            </tr>
          </template>

          <template v-slot:no-data>
            <div class="no-data">
              <v-icon size="32" color="#ccc">mdi-email-off-outline</v-icon>
              <p v-if="loading">Loading communications...</p>
              <p v-else>No communication logs found</p>
            </div>
          </template>
        </v-data-table-server>
      </div>
    </section>

    <!-- Communication Log Detail Dialog -->
    <CommunicationLogDetailDialog
      v-model="showDetailsDialog"
      :selected-log="selectedLog"
      :consent-document="consentDocument"
      :retrying="retryingLog"
      @retry="retryLog"
    />

    <!-- New Correspondence Dialog -->
    <NewCorrespondenceDialog
      v-model="showNewCorrespondence"
      :patient="patient"
      :patient-name="patientName"
      :correspondence="correspondenceToEdit"
      @correspondence-sent="onCorrespondenceSent"
      @correspondence-updated="onCorrespondenceUpdated"
    />

    <!-- Delete Confirmation Dialog -->
    <CommonConfirmDialog
      v-model="confirmDeleteDialog"
      title="Delete Correspondence?"
      :message="`Are you sure you want to delete this correspondence? This action cannot be undone.`"
      :loading="deletingLog"
      icon="mdi-trash-can-outline"
      @confirm="doDeleteCorrespondence"
      @cancel="confirmDeleteDialog = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from "vue";
import { useDiaryStore } from "@/stores/diary";
import { useMainStore } from "@/stores/index";
import { debounce } from "lodash-es";
import searchIcon from "@/assets/icons/listView/serach-icon.svg";
import filterIcon from "@/assets/icons/listView/filter-icon.svg";
import viewIcon from "@/assets/icons/view.svg";
import deleteIcon from "@/assets/crm/delete.svg";
import editIcon from "@/assets/icons/edit.svg";
import CommunicationLogDetailDialog from "./CommunicationLogDetailDialog.vue";
import NewCorrespondenceDialog from "./NewCorrespondenceDialog.vue";
import CommonConfirmDialog from "@/components/Common/ConfirmDialog.vue";
const props = defineProps({
  patient: {
    type: Object,
    required: true,
  },
  patientName: {
    type: String,
    required: true,
  },
});

const diaryStore = useDiaryStore();
const mainStore = useMainStore();

const logs = ref([]);
const loading = ref(false);
const retryingLog = ref(false);
const showDetailsDialog = ref(false);
const selectedLog = ref(null);
const selectedItems = ref([]);
const consentDocument = ref(null);
const loadingConsentDocument = ref(false);
const showNewCorrespondence = ref(false);
const correspondenceToEdit = ref(null);
const confirmDeleteDialog = ref(false);
const correspondenceToDelete = ref(null);
const deletingLog = ref(false);

// Filter and search state
const searchQuery = ref("");
const filterType = ref("");
const filterStatus = ref("");
const filterDateRange = ref("");
const currentPage = ref(1);
const pageSize = ref(10);
const totalLogs = ref(0);
const filterMenu = ref(false);

// Table headers with resizable property
const tableHeaders = ref([
  { title: "Type", key: "type", sortable: false, width: 100, resizable: true },
  {
    title: "Description",
    key: "description",
    sortable: false,
    width: 300,
    resizable: true,
  },
  {
    title: "Status",
    key: "status",
    sortable: false,
    width: 108,
    resizable: true,
  },
  { title: "Sent", key: "sent", sortable: false, width: 160, resizable: true },
  {
    title: "Created",
    key: "created",
    sortable: false,
    width: 90,
    resizable: true,
  },
  {
    title: "Action",
    key: "action",
    sortable: false,
    width: 80,
    resizable: false,
    align: "center",
  },
]);

// Communication types and statuses
const communicationTypes = [
  { title: "Email", value: "Email" },
  { title: "WhatsApp", value: "WhatsApp" },
  { title: "Automation", value: "Automation" },
];

const communicationStatuses = [
  { title: "Delivered", value: "Delivered" },
  { title: "Sent", value: "Sent" },
  { title: "Failed", value: "Failed" },
  { title: "Pending", value: "Pending" },
];

const dateRangeOptions = [
  { title: "Today", value: "today" },
  { title: "Last 7 days", value: "7days" },
  { title: "Last 30 days", value: "30days" },
  { title: "Last 90 days", value: "90days" },
  { title: "All Time", value: "" },
];

// Computed properties
const activeFilterCount = computed(() => {
  return [filterType.value, filterStatus.value, filterDateRange.value].filter(
    Boolean,
  ).length;
});

const getDateRangeLabel = (value) => {
  return dateRangeOptions.find((item) => item.value === value)?.title || "";
};

const hasActiveFilters = computed(() => {
  return (
    !!searchQuery.value ||
    !!filterType.value ||
    !!filterStatus.value ||
    !!filterDateRange.value
  );
});
const changePage = (page) => {
  if (page >= 1) {
    currentPage.value = page;
    loadCommunicationLogs(page);
  }
};

const updateItemsPerPage = (newSize) => {
  pageSize.value = newSize;
  currentPage.value = 1;
  loadCommunicationLogs(1);
};

const onTableOptionsUpdate = (options) => {
  // Handle any table option changes if needed
};

const clearSearch = () => {
  searchQuery.value = "";
  applyFilters();
};

// Resize handler from reference
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

// Helper functions
const getIconColor = (type) => {
  const colors = {
    Email: "#4b5563",
    WhatsApp: "#25d366",
    Automation: "#f5a623",
  };
  return colors[type] || "#4b5563";
};

const getTypeIcon = (type) => {
  const icons = {
    Email: "mdi-email-outline",
    WhatsApp: "mdi-whatsapp",
    Automation: "mdi-robot-outline",
  };
  return icons[type] || "mdi-email-outline";
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return (
    date.toLocaleDateString("en-GB") +
    " at " +
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
};

const formatDateShort = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }
};

const formatDateTimeVerbose = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return (
    date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }) +
    " at " +
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
};

const truncateText = (text, length) => {
  if (!text || text.length <= length) return text;
  return text.substring(0, length) + "...";
};

const formatKey = (key) => {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

const formatMetadataValue = (value) => {
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
};

const loadCommunicationLogs = async (page = 1) => {
  if (!props.patient?.id) return;

  loading.value = true;
  try {
    const params = {
      patientId: props.patient.id,
      page,
      limit: pageSize.value,
    };

    if (filterType.value) params.type = filterType.value;
    if (filterStatus.value) params.status = filterStatus.value;
    if (filterDateRange.value) params.dateRange = filterDateRange.value;
    if (searchQuery.value.trim()) params.search = searchQuery.value.trim();

    const response = await diaryStore.getPatientCommunicationLogs(params);

    if (response?.code === 0) {
      logs.value = response.data?.logs || [];
      totalLogs.value = response.data?.pagination?.total || 0;
      currentPage.value = page;
    } else {
      logs.value = [];
      totalLogs.value = 0;
      mainStore.setSnackbar({
        message: response?.message || "Failed to load communication logs",
        color: "error",
      });
    }
  } catch (error) {
    console.error("Failed to load communication logs:", error);
    mainStore.setSnackbar({
      message: "Error loading communication logs",
      color: "error",
    });
    logs.value = [];
    totalLogs.value = 0;
  } finally {
    loading.value = false;
  }
};

const debouncedSearch = debounce(() => {
  currentPage.value = 1;
  loadCommunicationLogs(1);
}, 300);

const applyFilters = () => {
  currentPage.value = 1;
  loadCommunicationLogs(1);
};

const clearAllFilters = () => {
  searchQuery.value = "";

  filterType.value = "";
  filterStatus.value = "";
  filterDateRange.value = "";

  selectedItems.value = [];

  currentPage.value = 1;

  loadCommunicationLogs(1);
};

const viewDetails = async (log) => {
  selectedLog.value = log;
  consentDocument.value = null;

  // If it's a consent form, fetch the document detailsconst is
  const isConsent =
    log?.metadata?.category === "consent-form" || log?.type === "Consent Form";

  if (isConsent && log?.metadata?.documentId) {
    loadingConsentDocument.value = true;
    try {
      const response = await $fetch(
        `/api/consent/documentGetById?id=${log.metadata.documentId}`,
      );
      if (response?.code === 0) {
        consentDocument.value = response.data;
      }
    } catch (error) {
      console.error("Failed to load consent document:", error);
    } finally {
      loadingConsentDocument.value = false;
    }
  }

  showDetailsDialog.value = true;
};

const retryLog = async (log) => {
  if (log.status !== "Failed") {
    mainStore.setSnackbar({
      message: "Only failed communications can be retried",
      color: "warning",
    });
    return;
  }

  retryingLog.value = true;
  try {
    mainStore.setSnackbar({
      message: "Retry functionality coming soon",
      color: "info",
    });
  } catch (error) {
    mainStore.setSnackbar({
      message: "Failed to retry communication",
      color: "error",
    });
  } finally {
    retryingLog.value = false;
  }
};

const onCorrespondenceSent = async (data) => {
  // Refresh logs after new correspondence is sent
  await loadCommunicationLogs(1);
  mainStore.setSnackbar({
    title: `${data.type} correspondence sent successfully`,
    type: "success",
  });
};

const onCorrespondenceUpdated = async (data) => {
  // Refresh logs after correspondence is updated
  correspondenceToEdit.value = null;
  await loadCommunicationLogs(currentPage.value);
  mainStore.setSnackbar({
    title: "Correspondence updated successfully",
    type: "success",
  });
};

const editCorrespondence = (item) => {
  correspondenceToEdit.value = item;
  showNewCorrespondence.value = true;
};

const showDeleteConfirm = (item) => {
  correspondenceToDelete.value = item;
  confirmDeleteDialog.value = true;
};

const doDeleteCorrespondence = async () => {
  if (!correspondenceToDelete.value?.id) {
    mainStore.setSnackbar({
      title: "Error: Correspondence ID not found",
      type: "error",
    });
    return;
  }

  deletingLog.value = true;
  try {
    const response = await fetch("/api/diary/communication", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "delete",
        id: correspondenceToDelete.value.id,
      }),
    });

    const data = await response.json();
    if (data?.code === 0) {
      await loadCommunicationLogs(currentPage.value);
      mainStore.setSnackbar({
        title: "Correspondence deleted successfully",
        type: "success",
      });
    } else {
      throw new Error(data?.message || "Failed to delete correspondence");
    }
  } catch (error) {
    console.error("Failed to delete correspondence:", error);
    mainStore.setSnackbar({
      title: "Failed to delete correspondence",
      type: "error",
    });
  } finally {
    deletingLog.value = false;
    confirmDeleteDialog.value = false;
    correspondenceToDelete.value = null;
  }
};

onMounted(() => {
  loadCommunicationLogs();
});

watch(
  () => props.patient?.id,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      clearAllFilters();
    }
  },
);

// Watch for dialog closing to reset consent document
watch(showDetailsDialog, (newValue) => {
  if (!newValue) {
    consentDocument.value = null;
    loadingConsentDocument.value = false;
  }
});
</script>

<style scoped lang="scss">
.communication-hub {
  margin-top: 18px;
}

.hub-card {
  min-height: 535px;
  border: 1px solid #e8edf3;
  border-radius: 20px;
  background: #ffffff;
  overflow: hidden;
}

.hub-card__header {
  padding: 10px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #edf1f5;
}

.hub-card__header h2 {
  font-size: 30px;
  font-weight: 700;
  color: #242424;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.clear-filters-btn {
  border: 0;
  background: transparent;
  color: #0061fb;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;

  &:hover {
    text-decoration: underline;
  }
}

.refresh-btn {
  border: 1px solid #e8edf3;
  background: #ffffff;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f5f5f5;
    border-color: #d0d5dd;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

// Table controls section
.table-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 10px 10px;
  gap: 16px;
  flex-wrap: wrap;
}

.controls-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.custom-search {
  width: 100%;
  :deep(.v-field) {
    border-radius: 8px;
    background-color: #f3f4f6 !important;
  }
}

// Active filters section
.tbl-top-btn {
  height: 40px;
  border-radius: 8px;
  font-size: 14px;
  text-transform: none;
  box-shadow: none;
  background-color: #f3f4f6 !important;
  color: #737373 !important;
}
.communication-action-btn {
  width: 16px;
  height: 16px;
  display: block;
}
.filter-menu-card {
  min-width: 320px;
  border-radius: 12px;
  padding: 16px;
}

.filter-menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.filter-menu-title {
  font-size: 14px;
  font-weight: 600;
  color: #242424;
}

.clear-filter-btn {
  text-transform: none;
  font-size: 13px;
  font-weight: 500;
}

.filter-label {
  font-size: 14px;
  margin: 10px 0 6px;
  display: block;
}

.input-bordered {
  margin-bottom: 6px;

  :deep(.v-field) {
    border-radius: 8px;
    min-height: 40px;
    background: #f3f4f6 !important;
    box-shadow: none !important;
  }
}

.active-filter-chips {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}
.filter-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-chip {
  background: #fef08a !important;
  color: #854d0e !important;

  :deep(.v-chip__close) {
    color: #854d0e;
  }
}

.stats-bar {
  padding: 8px 14px;
  background: #fafbfc;
  border-bottom: 1px solid #edf1f5;

  .stats-text {
    font-size: 12px;
    color: #757f8f;
    font-weight: 500;
  }
}

.hub-table-wrap {
  overflow-x: auto;
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

// Full width table styling - matches CRM resizable-table pattern
.full-width-table {
  border-top: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: unset;

  :deep(table) {
    border-collapse: separate;
    border-spacing: 0;
    width: 100% !important;
    table-layout: fixed;
  }

  /* Vertical lines between columns */
  :deep(thead tr th) {
    border-right: 1px solid rgba(0, 0, 0, 0.12);
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    background-color: #f6f6f6 !important;
    padding: 0px 7px !important;
    height: 48px !important;
    text-align: left;
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    vertical-align: middle;
  }

  :deep(thead tr th:last-child) {
    border-right: none;
  }

  :deep(tbody tr td) {
    border-right: 1px solid rgba(0, 0, 0, 0.12);
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    padding: 4px 8px !important;
    height: 48px !important;
    vertical-align: middle;
  }

  :deep(tbody tr td:last-child) {
    border-right: none;
  }

  :deep(.v-table__wrapper) {
    margin-top: 0 !important;

    tbody tr {
      height: 48px !important;
    }

    tbody tr:hover {
      transition: background-color 0.2s ease;
    }
  }
}

.table-row {
  transition: background 0.15s;
}

.resize-handle {
  display: inline-block;
  width: 5px;
  cursor: col-resize;
  margin-left: auto;
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
  margin-left: 14px;
  margin-top: 5px;
}

.cust-checkbox:checked {
  background: #0061fb;
  border-color: #0061fb;
}

.cust-checkbox:checked::after {
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

.kind-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 6px;
}

.description-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-left: 6px;
}

.channel-badge {
  font-size: 11px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 4px;
  display: inline-block;
  width: fit-content;
}

.status-badge {
  min-height: 40px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: start;
  padding: 5px 12px;
  color: #ffffff;
  font-size: 12px;
  font-weight: 500;
}

.status-badge--delivered {
  background: #10b057;
}

.status-badge--sent {
  background: #0b7fd9;
}

.status-badge--failed {
  background: #ff3131;
}

.status-badge--pending {
  background: #ff7a00;
}

.action-cell {
  display: flex;
  align-items: center;
  justify-content: start;
  gap: 4px;
}

.action-menu-trigger {
  border: 0;
  background: transparent;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #f3f4f6;
  }
}

.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;

  p {
    margin: 12px 0 0 0;
    font-size: 14px;
    color: #9ca3af;
  }
}

// Dialog Styles
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e8edf3;
  background: #ffffff;
}

.dialog-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #242424;
}

.dialog-close {
  width: 28px;
  height: 28px;
  border: 0;
  background: transparent;
  font-size: 24px;
  color: #9ca3af;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #242424;
  }
}

.dialog-content {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.status-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #fafbfc;
  border-radius: 8px;
  margin-bottom: 20px;

  .status-badge {
    width: auto;
    padding: 4px 12px;
    min-height: auto;
    border-radius: 4px;
  }

  .status-date {
    font-size: 11px;
    color: #757f8f;
  }
}

.details-section {
  margin-bottom: 20px;

  .detail-label {
    font-size: 11px;
    font-weight: 600;
    color: #757f8f;
    text-transform: uppercase;
    margin-bottom: 8px;
    display: block;
  }
}

.detail-row {
  display: flex;
  padding: 6px 0;
  font-size: 12px;

  .detail-label {
    min-width: 100px;
    margin-bottom: 0;
    color: #9ca3af;
    font-weight: normal;
    text-transform: none;
  }

  .detail-value {
    flex: 1;
    color: #242424;
  }
}

.error-section {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: #fff5f5;
  border-left: 3px solid #ff3131;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 12px;
  color: #ff3131;
}

.content-box {
  padding: 12px;
  background: #fafbfc;
  border: 1px solid #e8edf3;
  border-radius: 8px;
  font-size: 12px;
  color: #5a6576;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.metadata-box {
  padding: 10px;
  background: #fafbfc;
  border: 1px solid #e8edf3;
  border-radius: 8px;
}

.metadata-row {
  display: flex;
  gap: 12px;
  padding: 4px 0;
  font-size: 11px;

  .metadata-key {
    min-width: 100px;
    color: #757f8f;
  }

  .metadata-value {
    flex: 1;
    color: #5a6576;
    word-break: break-word;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e8edf3;
  background: #ffffff;
}

.dialog-btn {
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &-secondary {
    border: 1px solid #e8edf3;
    background: #ffffff;
    color: #5a6576;

    &:hover {
      background: #f5f5f5;
      border-color: #d0d5dd;
    }
  }

  &-primary {
    border: 0;
    background: #0061fb;
    color: #ffffff;

    &:hover:not(:disabled) {
      background: #0050d0;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

@media (max-width: 900px) {
  .hub-card__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .hub-card__header h2 {
    font-size: 24px;
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

  .custom-search {
    width: 100%;
  }
}
</style>
