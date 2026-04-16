<template>
  <v-sheet color="background">
    <!-- Header with breadcrumb style -->
    <div class="cust-border d-flex align-center">
      <p class="mr-1">Dentist Schedules</p>
    </div>

    <!-- Stats Cards Row - Only show when not in schedule view -->
    <div v-if="!showScheduleView" class="mt-5 px-5">
      <v-row class="stat-row" align="stretch">
        <v-col style="flex: 1 1 0" v-for="(stat, i) in dentistStats" :key="i">
          <CommonStatCard
            :icon="stat.icon"
            :label="stat.label"
            :value="stat.value"
            :uid="i"
            hide-chip
          />
        </v-col>
      </v-row>
    </div>

    <!-- Main Content Area -->
    <div class="mt-5 px-5">
      <!-- Dentist List View - Full component -->
      <div v-if="!showScheduleView">
        <!-- Header with Search -->
        <div class="d-flex justify-space-between align-center mb-4">
          <div class="d-flex align-center">
            <div style="width: 250px">
              <v-text-field
                v-model="search"
                placeholder="Search dentists..."
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
        </div>

        <!-- Dentist Cards Grid -->
        <v-row v-if="filteredDentists.length" class="dentist-grid">
          <v-col
            v-for="dentist in filteredDentists"
            :key="dentist.id"
            cols="12"
          >
            <v-card class="dentist-card" elevation="0" rounded="lg">
              <!-- Header: Name Initial + Name + Chip -->
              <div class="card-header">
                <div class="d-flex align-center gap-12">
                  <div
                    class="dentist-avatar"
                    :style="{ backgroundColor: getAvatarColor(dentist.id) }"
                  >
                    {{ getInitials(dentist.name) }}
                  </div>

                  <div>
                    <h4 class="dentist-name">{{ dentist.name }}</h4>
                    <p class="dentist-role">{{ dentist.role || "Dentist" }}</p>
                  </div>
                </div>

                <v-chip
                  :color="dentist.active !== false ? '#10B981' : '#6B7280'"
                  size="x-small"
                  variant="flat"
                  class="status-chip"
                  text-color="white"
                >
                  {{ dentist.active !== false ? "Active" : "Inactive" }}
                </v-chip>
              </div>

              <!-- Body: Info with Icons -->
              <div class="card-body">
                <div class="info-grid">
                  <div class="info-item" v-if="dentist.email">
                    <div class="info-icon-wrapper">
                      <v-icon size="16" color="#9CA3AF"
                        >mdi-email-outline</v-icon
                      >
                    </div>
                    <div>
                      <span class="info-label">Email</span>
                      <span class="info-value truncate">{{
                        dentist.email
                      }}</span>
                    </div>
                  </div>

                  <div class="info-item" v-if="dentist.phone">
                    <div class="info-icon-wrapper">
                      <v-icon size="16" color="#9CA3AF"
                        >mdi-phone-outline</v-icon
                      >
                    </div>
                    <div>
                      <span class="info-label">Phone</span>
                      <span class="info-value">{{ dentist.phone }}</span>
                    </div>
                  </div>
                </div>

                <!-- Schedules Section -->
                <div class="schedules-section mt-4 pt-3 border-t">
                  <div class="d-flex justify-space-between align-center mb-2">
                    <span class="schedules-label">
                      <v-icon size="14" class="mr-1"
                        >mdi-calendar-multiple</v-icon
                      >
                      Schedules
                    </span>
                    <div class="d-flex align-center" style="gap: 8px">
                      <v-btn
                        size="x-small"
                        variant="outlined"
                        color="primary"
                        class="add-schedule-btn"
                        :loading="copyingRotaDentistId === dentist.id"
                        :disabled="copyingRotaDentistId === dentist.id"
                        @click="copyRotaSchedule(dentist)"
                      >
                        <v-icon size="14" class="mr-1">
                          {{ canImportRotaSchedule ? "mdi-content-copy" : "mdi-lock-outline" }}
                        </v-icon>
                        {{ canImportRotaSchedule ? "Import rota" : "Trial or Soar required" }}
                      </v-btn>
                      <v-btn
                        size="x-small"
                        variant="text"
                        color="primary"
                        @click="createSchedule(dentist)"
                        class="add-schedule-btn"
                      >
                        <v-icon size="14" class="mr-1">mdi-plus</v-icon>
                        Add
                      </v-btn>
                    </div>
                  </div>

                  <!-- Schedules List -->
                  <div
                    v-if="dentistSchedulesMap[dentist.id]?.length"
                    class="schedules-list"
                  >
                    <ScheduleDetailsCard
                      v-for="schedule in dentistSchedulesMap[dentist.id]"
                      :key="schedule.id"
                      :schedule="schedule"
                      @edit="(id) => editSchedule(dentist, id)"
                      @toggle="(id) => toggleScheduleStatus(dentist.id, id)"
                      @delete="
                        (schedule) =>
                          deleteScheduleConfirm(dentist.id, schedule)
                      "
                    />
                  </div>
                  <div
                    v-else
                    class="no-schedules text-caption text-center py-2"
                  >
                    No schedules created yet
                  </div>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <!-- Empty State -->
        <div
          v-if="!filteredDentists.length && !loading"
          class="empty-state-wrapper"
        >
          <div class="empty-state">
            <v-icon size="64" color="#CBD5E1">mdi-account-group-outline</v-icon>
            <h4 class="empty-title">No Dentists Found</h4>
            <p class="empty-text">No dentists match your search criteria.</p>
          </div>
        </div>
      </div>

      <!-- Schedule Form View - Replaces entire component -->
      <transition name="slide-fade" mode="out-in">
        <div v-if="showScheduleView" class="schedule-view-container">
          <!-- Back button header -->
          <div class="d-flex align-center mb-4 pb-2 border-bottom">
            <v-btn variant="text" class="back-btn" @click="closeSchedulePanel">
              <v-icon size="20" class="mr-2">mdi-arrow-left</v-icon>
              Back to Dentists
            </v-btn>
            <div class="ml-4">
              <div class="text-caption text-grey">Schedule management for</div>
              <h3 class="text-h6 font-weight-bold">
                {{ selectedDentist?.name }}
              </h3>
            </div>
          </div>

          <DentistScheduleForm
            :dentist-id="selectedDentist?.id"
            :organisation-id="organisationId"
            :schedule-id="editingScheduleId"
            @schedule-created="handleScheduleSaved"
            @schedule-saved="handleScheduleSaved"
          />
        </div>
      </transition>
    </div>

    <!-- Delete Schedule Dialog -->
    <CommonConfirmDialog
      v-model="deleteDialog.open"
      :title="deleteDialog.title"
      :message="deleteDialog.message"
      :loading="deleteDialog.loading"
      confirm-text="Delete"
      @confirm="confirmDelete"
      @cancel="closeDeleteDialog"
    />
  </v-sheet>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useDiaryStore } from "~/stores/diary";
import { useScheduleStore } from "~/stores/schedule";
import { LICENSE_TYPES, getLicenseTypeFromStorage, resolveUserLicenseType, useMainStore } from "~/stores/index";
import { useUser } from "~/composables/useUser";
import ScheduleList from "@/components/schedule/ScheduleList.vue";
import DentistScheduleForm from "@/components/schedule/DentistScheduleForm.vue";

// Icons
import searchIcon from "@/assets/icons/listView/serach-icon.svg";
import ScheduleDetailsCard from "~/components/schedule/ScheduleDetailsCard.vue";

const props = defineProps({
  initialDentistId: {
    type: [String, Number],
    default: null,
  },
});

const diaryStore = useDiaryStore();
const scheduleStore = useScheduleStore();
const mainStore = useMainStore();
const { user } = useUser();

const dentists = ref([]);
const loading = ref(true);
const search = ref("");
const selectedDentist = ref(null);
const selectedDentistId = ref(null);
const showScheduleView = ref(false);
const editingScheduleId = ref(null);
const dentistSchedulesMap = ref({});
const loadingSchedules = ref(new Set());
const copyingRotaDentistId = ref(null);
const deleteDialog = ref({
  open: false,
  dentistId: null,
  scheduleId: null,
  scheduleName: "",
  title: "",
  message: "",
  loading: false,
});
const initialSelectionApplied = ref(false);

const dentistStats = computed(() => [
  {
    icon: "https://cdn.lordicon.com/asyunleq.json",
    label: "Total Dentists",
    value: dentists.value.length,
  },
  {
    icon: "https://cdn.lordicon.com/kphwxuxr.json",
    label: "Active",
    value: dentists.value.filter((d) => d.active !== false).length,
  },
  {
    icon: "https://cdn.lordicon.com/qlpudrww.json",
    label: "With Schedule",
    value: dentists.value.filter(
      (d) => Object.keys(dentistSchedulesMap.value[d.id] || {}).length > 0,
    ).length,
  },
  {
    icon: "https://cdn.lordicon.com/excswhey.json",
    label: "Available",
    value: dentists.value.filter(
      (d) => Object.keys(dentistSchedulesMap.value[d.id] || {}).length === 0,
    ).length,
  },
]);

const organisationId = computed(
  () => user.value?.currentLoggedInOrgId || user.value?.organisationId,
);
const normalizedLicenseType = computed(() => {
  const liveLicense = String(resolveUserLicenseType(user.value) || "").trim();
  if (liveLicense) return liveLicense;
  return String(getLicenseTypeFromStorage() || "").trim();
});
const canImportRotaSchedule = computed(() =>
  [LICENSE_TYPES.TRIAL, LICENSE_TYPES.SOAR].includes(normalizedLicenseType.value),
);
const schedules = computed(() => scheduleStore.getAllSchedules);
const isScheduleLoading = computed(() => scheduleStore.getIsLoading);

// Filter dentists based on search
const filteredDentists = computed(() => {
  if (!search.value) return dentists.value;
  return dentists.value.filter(
    (dentist) =>
      dentist.name.toLowerCase().includes(search.value.toLowerCase()) ||
      (dentist.role &&
        dentist.role.toLowerCase().includes(search.value.toLowerCase())),
  );
});

// Watch for dentist ID changes to load schedules
watch(selectedDentistId, async (newId) => {
  if (newId && organisationId.value) {
    await loadSchedulesForDentist(newId);
  }
});

// Avatar color palette
const avatarColors = [
  "#EFF6FF",
  "#F0FDF4",
  "#FEF3C7",
  "#FEF2F2",
  "#F3E8FF",
  "#FFE4E6",
  "#E0F2FE",
  "#FCE7F3",
];

const getAvatarColor = (id) => {
  const index = (id?.toString().length || 0) % avatarColors.length;
  return avatarColors[index];
};

const getInitials = (name) => {
  if (!name) return "D";
  if (name.includes(" ")) {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return name.charAt(0).toUpperCase();
};

const formatDate = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getWorkingDaysCount = (schedule) => {
  return schedule.days?.filter((d) => d.isWorkingDay).length || 0;
};

const getTotalBreaksCount = (schedule) => {
  return (
    schedule.days?.reduce((total, day) => {
      return total + (day.breaks?.length || 0);
    }, 0) || 0
  );
};

const loadSchedulesForDentist = async (dentistId) => {
  if (!organisationId.value || !dentistId) return;
  if (loadingSchedules.value.has(dentistId)) return;

  loadingSchedules.value.add(dentistId);

  try {
    await scheduleStore.fetchSchedules(organisationId.value, dentistId);
    dentistSchedulesMap.value[dentistId] = [...scheduleStore.getAllSchedules];
  } catch (err) {
    console.error(`Failed to load schedules for dentist ${dentistId}:`, err);
    dentistSchedulesMap.value[dentistId] = [];
  } finally {
    loadingSchedules.value.delete(dentistId);
  }
};

const loadAllDentistsSchedules = async () => {
  const promises = dentists.value.map((dentist) =>
    loadSchedulesForDentist(dentist.id).catch((err) =>
      console.error(`Failed to load schedules for ${dentist.name}:`, err),
    ),
  );
  await Promise.all(promises);
};

const createSchedule = (dentist) => {
  selectedDentist.value = dentist;
  selectedDentistId.value = dentist.id;
  editingScheduleId.value = null;
  showScheduleView.value = true;
};

const copyRotaSchedule = async (dentist) => {
  if (!dentist?.id) return;
  if (!canImportRotaSchedule.value) {
    mainStore?.setSnackbar?.({
      title: "Rota schedule import is available on the Soar plan.",
      type: "info",
    });
    return;
  }

  copyingRotaDentistId.value = dentist.id;
  try {
    await scheduleStore.copyScheduleFromRota({
      organisationId: organisationId.value,
      dentistId: dentist.id,
    });
    await loadSchedulesForDentist(dentist.id);
    mainStore?.setSnackbar?.({
      title: `Imported rota schedule for ${dentist.name}.`,
      type: "success",
    });
  } catch (err) {
    mainStore?.setSnackbar?.({
      title: err?.message || "Unable to import rota schedule.",
      type: "error",
    });
  } finally {
    copyingRotaDentistId.value = null;
  }
};

const editSchedule = (dentist, scheduleId) => {
  selectedDentist.value = dentist;
  selectedDentistId.value = dentist.id;
  editingScheduleId.value = scheduleId;
  showScheduleView.value = true;
};

const closeSchedulePanel = () => {
  showScheduleView.value = false;
  selectedDentist.value = null;
  selectedDentistId.value = null;
  editingScheduleId.value = null;
};

const handleScheduleSaved = async () => {
  if (selectedDentistId.value) {
    await loadSchedulesForDentist(selectedDentistId.value);
  }

  showScheduleView.value = false;
  selectedDentist.value = null;
  selectedDentistId.value = null;
  editingScheduleId.value = null;
};

const toggleScheduleStatus = async (dentistId, scheduleId) => {
  try {
    await scheduleStore.toggleSchedule(scheduleId);
    await loadSchedulesForDentist(dentistId);
  } catch (err) {
    console.error("Failed to toggle schedule:", err);
  }
};

const deleteScheduleConfirm = (dentistId, schedule) => {
  deleteDialog.value = {
    open: true,
    dentistId,
    scheduleId: schedule.id,
    scheduleName: schedule.scheduleName || "Schedule",
    title: "Delete Schedule",
    message: `Are you sure you want to delete "${schedule.scheduleName || "Schedule"}"? This action cannot be undone.`,
    loading: false,
  };
};

const closeDeleteDialog = () => {
  deleteDialog.value.open = false;
  deleteDialog.value.dentistId = null;
  deleteDialog.value.scheduleId = null;
  deleteDialog.value.scheduleName = "";
};

const confirmDelete = async () => {
  if (!deleteDialog.value.scheduleId) return;

  deleteDialog.value.loading = true;
  try {
    await scheduleStore.deleteSchedule(deleteDialog.value.scheduleId);
    if (deleteDialog.value.dentistId) {
      await loadSchedulesForDentist(deleteDialog.value.dentistId);
    }
    closeDeleteDialog();
  } catch (err) {
    console.error("Failed to delete schedule:", err);
  } finally {
    deleteDialog.value.loading = false;
  }
};

const clearSearch = () => {
  search.value = "";
};

const fetchDentists = async () => {
  try {
    loading.value = true;
    const res = await diaryStore.listDentists();
    if (res?.code === 0) {
      dentists.value = res.data || [];
      // Load schedules for all dentists
      await loadAllDentistsSchedules();
      openInitialDentistSchedule();
    } else {
      dentists.value = [];
      console.error("Failed to fetch dentists:", res?.message);
    }
  } catch (error) {
    console.error("Error fetching dentists:", error);
    dentists.value = [];
  } finally {
    loading.value = false;
  }
};

function openInitialDentistSchedule() {
  if (initialSelectionApplied.value || !props.initialDentistId || !dentists.value.length) {
    return;
  }
  const normalizedId = Number(props.initialDentistId);
  const dentist = dentists.value.find((entry) => Number(entry.id) === normalizedId);
  if (!dentist) return;
  initialSelectionApplied.value = true;
  const schedulesForDentist = dentistSchedulesMap.value[dentist.id] || [];
  if (schedulesForDentist.length) {
    editSchedule(dentist, schedulesForDentist[0].id);
    return;
  }
  createSchedule(dentist);
}

onMounted(() => {
  fetchDentists();
});

watch(
  () => props.initialDentistId,
  () => {
    initialSelectionApplied.value = false;
    openInitialDentistSchedule();
  }
);
</script>

<style scoped lang="scss">
.custom-search {
  height: 46px;
  border-radius: 8px;
  font-size: 14px;
  background-color: #f3f4f6 !important;
  text-transform: none;
  box-shadow: none;
  color: #737373;
  align-items: center;
}

.custom-search :deep(input::placeholder) {
  color: #737373;
  opacity: 1;
}

.cust-border {
  border-bottom: 1px solid #e5e7eb;
  padding: 17px;
  p {
    font-size: 12px;
    margin: 0;
  }
}

/* Dentist Cards Grid */
.dentist-grid {
  margin-top: 16px;
}

.dentist-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px !important;
  background: #ffffff;
  transition: all 0.2s ease;
  overflow: hidden;

  &:hover {
    border-color: #d1d5db;
  }
}

/* Card Header */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
}

.gap-12 {
  gap: 12px;
}

.dentist-avatar {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
  flex-shrink: 0;
}

.dentist-name {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
  color: #111827;
  line-height: 1.3;
}

.dentist-role {
  font-size: 11px;
  color: #6b7280;
  margin: 2px 0 0 0;
}

.status-chip {
  border-radius: 100px !important;
  font-weight: 500;
  font-size: 10px;
  padding: 4px 8px;
  height: auto;
}

/* Card Body */
.card-body {
  padding: 16px;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.info-icon-wrapper {
  width: 24px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.info-item > div:last-child {
  flex: 1;
  min-width: 0;
}

.info-label {
  font-size: 10px;
  font-weight: 500;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  display: block;
  margin-bottom: 2px;
}

.info-value {
  font-size: 13px;
  font-weight: 500;
  color: #1f2937;
  word-break: break-word;
  display: block;
}

/* Schedules Section */
.schedules-section {
  border-top: 1px solid #f0f0f0;
}

.schedules-label {
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.add-schedule-btn {
  min-width: auto;
  padding: 0 8px;

  :deep(.v-btn__content) {
    font-size: 11px;
  }
}

.schedules-list {
  max-height: 200px;
  overflow-y: auto;
}

.schedule-item {
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;

  &:hover {
    background-color: #f3f4f6;
  }

  &.inactive-schedule {
    opacity: 0.7;
    background-color: #fef2f2;
  }
}

.schedule-name {
  font-size: 12px;
  font-weight: 600;
  color: #1f2937;
}

.schedule-status-chip {
  height: 16px;
  font-size: 8px;
  padding: 0 6px;
}

.schedule-dates {
  color: #6b7280;
  margin-top: 2px;
}

.schedule-summary {
  color: #9ca3af;
  margin-top: 2px;
}

.schedule-actions {
  flex-shrink: 0;
}

.schedule-action-btn {
  width: 24px;
  height: 24px;

  :deep(.v-icon) {
    font-size: 14px;
  }
}

.no-schedules {
  background-color: #f9fafb;
  border-radius: 6px;
  color: #9ca3af;
}

/* Card Actions */
.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  padding: 8px 12px 12px 12px;
  border-top: 1px solid #f3f4f6;
}

.action-btn {
  width: 32px;
  height: 32px;

  &:hover {
    background-color: #f3f4f6;
  }

  &:hover :deep(.v-icon) {
    color: #4b5563 !important;
  }
}

/* Schedule View */
.schedule-view-container {
  width: 100%;
}

.back-btn {
  min-width: auto;

  &:hover {
    background-color: #f3f4f6;
  }
}

.border-bottom {
  border-bottom: 1px solid #e5e7eb;
}

.border-t {
  border-top: 1px solid #e5e7eb;
}

/* Utility */
.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gap-1 {
  gap: 4px;
}

/* Animations */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* Empty State */
.empty-state-wrapper {
  padding: 60px 20px;
  text-align: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.empty-text {
  color: #6b7280;
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .dentist-name {
    font-size: 14px;
  }

  .dentist-avatar {
    width: 40px;
    height: 40px;
    font-size: 14px;
  }

  .card-header {
    padding: 12px;
  }

  .card-body {
    padding: 12px;
  }
}
</style>
