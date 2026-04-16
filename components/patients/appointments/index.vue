<template>
  <div class="mt-4">
    <v-row class="px-1 mb-4" align="stretch">
      <v-col
        v-for="(card, i) in appointmentStatCards"
        :key="card.label"
        style="flex: 1 1 0"
      >
        <CommonStatCard
          :icon="card.icon"
          :label="card.label"
          :value="card.value"
          :uid="`appt-${i}`"
          hide-chip
        />
      </v-col>
    </v-row>

    <div class="appointments-toolbar mb-4">
      <div class="appointments-toolbar__left">
        <v-text-field
          v-model="appointmentSearch"
          placeholder="Search"
          clearable
          @click:clear="appointmentSearch = ''"
          variant="solo"
          density="compact"
          hide-details
          bg-color="#F3F4F6"
          flat
          class="custom-search appointments-search"
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
        <v-menu
          v-model="appointmentFilterMenu"
          :close-on-content-click="false"
          transition="fade-transition"
          offset-y
        >
          <template #activator="{ props: activatorProps }">
            <v-btn
              v-bind="activatorProps"
              variant="flat"
              density="compact"
              class="appointments-filter-btn"
            >
              <span>Filter</span>
              <v-icon class="ml-2" size="18">mdi-filter-outline</v-icon>
            </v-btn>
          </template>
          <v-card class="appointments-filter-card">
            <div class="d-flex align-center justify-space-between mb-3">
              <div class="text-subtitle-2 font-weight-medium">
                Filter appointments
              </div>
              <v-btn
                variant="text"
                color="primary"
                density="comfortable"
                @click="clearAppointmentFilters"
              >
                Clear
              </v-btn>
            </div>
            <div class="text-caption text-medium-emphasis mb-2">Status</div>
            <v-select
              v-model="appointmentStatus"
              :items="statusOptions"
              item-title="label"
              item-value="value"
              variant="solo"
              flat
              density="compact"
              hide-details
              class="input-bordered mb-3"
            />
            <div class="text-caption text-medium-emphasis mb-2">
              Practitioner
            </div>
            <v-select
              v-model="appointmentPractitionerId"
              :items="practitionerFilterOptions"
              item-title="title"
              item-value="value"
              variant="solo"
              flat
              density="compact"
              hide-details
              class="input-bordered mb-3"
            />
            <div class="text-caption text-medium-emphasis mb-2">Date</div>
            <v-text-field
              v-model="appointmentDate"
              type="date"
              variant="solo"
              flat
              density="compact"
              hide-details
              class="input-bordered"
            />
          </v-card>
        </v-menu>
      </div>
      <div class="appointments-toolbar__right">
        <div class="text-body-2 text-medium-emphasis">
          {{ appointmentSummary }}
        </div>
        <v-btn
          color="primary"
          variant="flat"
          rounded="lg"
          class="action-btn"
          prepend-icon="mdi-plus-circle-outline"
          @click="openNewAppointment"
        >
          Add Appointment
        </v-btn>
      </div>
    </div>

    <div
      v-if="activeAppointmentFilterChips.length"
      class="appointments-filter-chips mb-4"
    >
      <v-chip
        v-for="chip in activeAppointmentFilterChips"
        :key="chip.key"
        size="small"
        color="primary"
        variant="elevated"
        closable
        @click:close="removeAppointmentFilter(chip.key)"
      >
        {{ chip.label }}
      </v-chip>
      <v-chip
        size="small"
        variant="text"
        color="secondary"
        @click="clearAppointmentFilters"
      >
        Clear filters
      </v-chip>
    </div>

    <v-expansion-panels
      v-model="appointmentsPanelOpen"
      :elevation="0"
      flat
      multiple
      class="appointments-panels"
    >
      <v-expansion-panel rounded="lg" class="border-sm pb-1">
        <v-expansion-panel-title>
          <div class="d-flex align-center">
            <v-chip color="primary" label>
              <v-icon class="mr-2">mdi-calendar-month-outline</v-icon>
              Appointments
            </v-chip>
            <v-chip class="ml-2" color="primary" label>
              {{ appointmentTotal }}
            </v-chip>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text class="pt-0">
          <v-data-table-server
            :items="pagedAppointments"
            :items-length="appointmentTotal"
            :headers="appointmentHeaders"
            :loading="appointmentLoading"
            :items-per-page="appointmentOptions.itemsPerPage"
            :page="appointmentOptions.page"
            density="comfortable"
            class="appointments-data-table full-width-table"
            @update:options="onAppointmentOptions"
          >
            <template #headers="{ columns }">
              <tr>
                <th
                  v-for="(column, index) in columns"
                  :key="column.key"
                  :style="appointmentHeaderStyle(index)"
                >
                  <div class="appointments-table-th">
                    <p class="mb-0">{{ column.title }}</p>
                  </div>
                </th>
              </tr>
            </template>
            <template #item.when="{ item }">
              <div class="text-body-2 appointments-cell-text" :title="item.when">
                {{ item.when }}
              </div>
            </template>
            <template #item.duration="{ item }">
              <div
                class="text-body-2 text-medium-emphasis appointments-cell-text"
                :title="item.duration"
              >
                {{ item.duration }}
              </div>
            </template>
            <template #item.dentistName="{ item }">
              <div
                class="appointments-practitioner-cell"
                :title="item.dentistName || 'Unassigned'"
              >
                <CommonAvatar
                  :user="{ fullName: item.dentistName || 'Unassigned' }"
                  size="32"
                />
                <div class="text-body-2 appointments-cell-text">
                  {{ item.dentistName || "Unassigned" }}
                </div>
              </div>
            </template>
            <template #item.treatmentPlan="{ item }">
              <div
                class="text-body-2 text-medium-emphasis appointments-cell-text"
                :title="item.treatmentPlan || '-'"
              >
                {{ item.treatmentPlan || "-" }}
              </div>
            </template>
            <template #item.treatmentName="{ item }">
              <div
                class="text-body-2 font-weight-500 appointments-cell-text"
                :title="item.treatmentName || 'Exam'"
              >
                {{ item.treatmentName || "Exam" }}
              </div>
            </template>
            <template #item.notes="{ item }">
              <div
                class="text-body-2 appointments-cell-text"
                :class="{ 'text-error': item.status?.toLowerCase() === 'cancelled' }"
                :title="item.notes || '-'"
              >
                {{ item.notes || "-" }}
              </div>
            </template>
            <template #item.arrival="{ item }">
              <div
                class="text-body-2 text-medium-emphasis appointments-cell-text"
                :title="item.arrival || '-'"
              >
                {{ item.arrival || "-" }}
              </div>
            </template>
            <template #item.status="{ item }">
              <v-chip
                size="small"
                :color="statusColor(item.status)"
                variant="tonal"
                class="font-weight-medium"
              >
                {{ item.status }}
              </v-chip>
            </template>
            <template #item.actions="{ item }">
              <div class="appointments-actions">
                <button
                  class="appointments-action-btn"
                  title="View in Diary"
                  @click="openViewAppointment(item)"
                >
                  <img :src="viewIcon" alt="View" class="appointments-action-icon" />
                </button>
                <button
                  class="appointments-action-btn"
                  title="Edit appointment"
                  @click="openEditAppointment(item)"
                >
                  <img :src="editIcon" alt="Edit" class="appointments-action-icon" />
                </button>
                <button
                  class="appointments-action-btn"
                  title="Delete appointment"
                  @click="deletePatientAppointment(item)"
                >
                  <img
                    :src="deleteIcon"
                    alt="Delete"
                    class="appointments-action-icon"
                  />
                </button>
              </div>
            </template>
            <template #no-data>
              <div class="text-center py-6">No appointments found</div>
            </template>
          </v-data-table-server>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <AddAppointment
      v-model="showAppointmentDrawer"
      :practitioner-options="practitionerOptions"
      :patient-options="patientOptions"
      :preselected-patient-id="patient?.id || null"
      :preselected-patient="patientName"
      :edit-appointment="editAppointment"
      @save="handleAppointmentSave"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import AddAppointment from "@/components/diary/addAppointment.vue";
import CommonAvatar from "@/components/Common/avatar.vue";
import CommonStatCard from "@/components/Common/statCard.vue";
import { formatDateDDMMYYYY, formatTime12Hour } from "@/lib/dateFormatter";
import { useDiaryStore } from "@/stores/diary";
import { useMainStore } from "@/stores/index";
import editIcon from "@/assets/icons/edit.svg";
import viewIcon from "@/assets/icons/view.svg";
import deleteIcon from "@/assets/crm/delete.svg";
import searchIcon from "@/assets/icons/listView/serach-icon.svg";

const props = defineProps({
  patient: {
    type: Object,
    default: null,
  },
  patientName: {
    type: String,
    default: "",
  },
});

const router = useRouter();
const store = useDiaryStore();
const mainStore = useMainStore();

const appointmentRows = ref([]);
const appointmentLoading = ref(false);
const appointmentsPanelOpen = ref([0]);
const appointmentOptions = ref({ page: 1, itemsPerPage: 10 });
const appointmentTotal = ref(0);
const appointmentSearch = ref("");
const appointmentStatus = ref("all");
const appointmentPractitionerId = ref("all");
const appointmentDate = ref("");
const appointmentFilterMenu = ref(false);
const searchTimer = ref(null);
const showAppointmentDrawer = ref(false);
const editAppointment = ref(null);
const practitionerOptions = ref([]);

const statusOptions = [
  { label: "All statuses", value: "all" },
  { label: "Pending", value: "Pending" },
  { label: "Confirmed", value: "Confirmed" },
  { label: "Arrived", value: "Arrived" },
  { label: "Cancelled", value: "Cancelled" },
];

const practitionerFilterOptions = computed(() => [
  { title: "All practitioners", value: "all" },
  ...practitionerOptions.value,
]);

const appointmentHeaders = [
  { title: "When", key: "when", sortable: false },
  { title: "Duration", key: "duration", sortable: false },
  { title: "Practitioner", key: "dentistName", sortable: false },
  { title: "Treatment Plan", key: "treatmentPlan", sortable: false },
  { title: "Appointment Details", key: "treatmentName", sortable: false },
  { title: "Notes", key: "notes", sortable: false },
  { title: "Arrived", key: "arrival", sortable: false },
  { title: "Appointment Status", key: "status", sortable: false },
  { title: "", key: "actions", sortable: false, align: "end" },
];

const appointmentColumnWidths = [200, 100, 200, 150, 200, 240, 140, 160, 120];

const appointmentHeaderStyle = (index) => ({
  width: `${appointmentColumnWidths[index] || 160}px`,
  minWidth: `${appointmentColumnWidths[index] || 160}px`,
  padding: "0px 12px",
  fontSize: "14px",
  backgroundColor: "#F6F6F6",
  position: "relative",
});

const patientOptions = computed(() => {
  if (!props.patient) return [];
  return [{ id: props.patient.id, name: props.patientName }];
});

const appointmentStats = computed(() => {
  const total = appointmentRows.value.length;
  const confirmed = appointmentRows.value.filter(
    (appointment) => appointment.status === "Confirmed",
  ).length;
  const pending = appointmentRows.value.filter(
    (appointment) => appointment.status === "Pending",
  ).length;
  const cancelled = appointmentRows.value.filter(
    (appointment) => appointment.status === "Cancelled",
  ).length;
  return { total, confirmed, pending, cancelled };
});

const appointmentStatCards = computed(() => [
  {
    label: "Total Appointments",
    value: appointmentStats.value.total,
    icon: "https://cdn.lordicon.com/asyunleq.json",
  },
  {
    label: "Confirmed",
    value: appointmentStats.value.confirmed,
    icon: "https://cdn.lordicon.com/kphwxuxr.json",
  },
  {
    label: "Pending",
    value: appointmentStats.value.pending,
    icon: "https://cdn.lordicon.com/excswhey.json",
  },
  {
    label: "Cancelled",
    value: appointmentStats.value.cancelled,
    icon: "https://cdn.lordicon.com/tzynxkwl.json",
  },
]);

const appointmentSummary = computed(() => {
  if (!appointmentTotal.value) return "No appointments found";
  return `${appointmentTotal.value} appointment${
    appointmentTotal.value === 1 ? "" : "s"
  } found`;
});

const activeAppointmentFilterChips = computed(() => {
  const chips = [];
  if (appointmentStatus.value !== "all") {
    const status = statusOptions.find(
      (item) => item.value === appointmentStatus.value,
    );
    chips.push({
      key: "status",
      label: `Status: ${status?.label || appointmentStatus.value}`,
    });
  }
  if (appointmentPractitionerId.value !== "all") {
    const practitioner = practitionerOptions.value.find(
      (item) =>
        String(item.value) === String(appointmentPractitionerId.value),
    );
    chips.push({
      key: "practitioner",
      label: `Practitioner: ${
        practitioner?.title || appointmentPractitionerId.value
      }`,
    });
  }
  if (appointmentDate.value) {
    chips.push({ key: "date", label: `Date: ${appointmentDate.value}` });
  }
  return chips;
});

const statusColor = (status) => {
  switch ((status || "").toLowerCase()) {
    case "confirmed":
      return "success";
    case "arrived":
      return "info";
    case "cancelled":
      return "error";
    case "complete":
      return "success";
    default:
      return "warning";
  }
};

const shapeAppointmentRow = (row) => {
  const durationMinutes = (() => {
    const [sh, sm] = (row.start || "").split(":").map(Number);
    const [eh, em] = (row.end || "").split(":").map(Number);
    if ([sh, sm, eh, em].some((value) => Number.isNaN(value))) return null;
    return eh * 60 + em - (sh * 60 + sm);
  })();

  const when = (() => {
    const dateLabel = row.date ? formatDateDDMMYYYY(row.date) : "";
    const startLabel = formatTime12Hour(row.start) || row.start || "";
    if (!dateLabel) {
      return startLabel || `${row.start || ""} - ${row.end || ""}`.trim();
    }
    return [dateLabel, startLabel].filter(Boolean).join(" at ");
  })();

  return {
    ...row,
    when,
    duration: durationMinutes ? `${durationMinutes} min` : "-",
    treatmentPlan: row.treatmentId || "-",
    arrival: row.arrival || "-",
  };
};

const fetchPractitioners = async () => {
  const res = await store.listDentists();
  if (res?.code === 0) {
    practitionerOptions.value = (res.data || []).map((dentist) => ({
      title: dentist.name,
      value: dentist.id,
    }));
  }
};

const fetchAppointments = async () => {
  if (!props.patient?.id) return;
  appointmentLoading.value = true;
  try {
    const params = {
      patientId: props.patient.id,
      search: appointmentSearch.value || undefined,
      status:
        appointmentStatus.value !== "all" ? appointmentStatus.value : undefined,
      dentistId:
        appointmentPractitionerId.value !== "all"
          ? appointmentPractitionerId.value
          : undefined,
      date: appointmentDate.value || undefined,
    };
    const res = await store.listAppointments(params);
    const rows = res?.data || [];
    appointmentRows.value = rows.map(shapeAppointmentRow);
    appointmentTotal.value = rows.length;
  } catch (_error) {
    appointmentRows.value = [];
    appointmentTotal.value = 0;
  } finally {
    appointmentLoading.value = false;
  }
};

const pagedAppointments = computed(() => {
  const start =
    (appointmentOptions.value.page - 1) * appointmentOptions.value.itemsPerPage;
  return appointmentRows.value.slice(
    start,
    start + appointmentOptions.value.itemsPerPage,
  );
});

const onAppointmentOptions = (opts) => {
  appointmentOptions.value = { ...appointmentOptions.value, ...opts };
};

const clearAppointmentFilters = () => {
  appointmentStatus.value = "all";
  appointmentPractitionerId.value = "all";
  appointmentDate.value = "";
};

const removeAppointmentFilter = (key) => {
  if (key === "status") appointmentStatus.value = "all";
  if (key === "practitioner") appointmentPractitionerId.value = "all";
  if (key === "date") appointmentDate.value = "";
};

const openNewAppointment = () => {
  editAppointment.value = null;
  showAppointmentDrawer.value = true;
};

const openEditAppointment = (row) => {
  const duration = (() => {
    if (!row.start || !row.end) return null;
    const [sh, sm] = row.start.split(":").map(Number);
    const [eh, em] = row.end.split(":").map(Number);
    if ([sh, sm, eh, em].some((value) => Number.isNaN(value))) return null;
    return eh * 60 + em - (sh * 60 + sm);
  })();
  editAppointment.value = { ...row, duration };
  showAppointmentDrawer.value = true;
};

const openViewAppointment = (row) => {
  const appointmentId = row.diaryAppointmentId || row.id;
  if (!appointmentId) return;
  router.push({
    path: "/diary/calendar",
    query: {
      date: row.date || "",
      dentistId: row.dentistId ? String(row.dentistId) : "",
      appointmentId: String(appointmentId),
    },
  });
};

const deletePatientAppointment = async (row) => {
  const appointmentId = row?.diaryAppointmentId || row?.id;
  if (!appointmentId) return;

  const confirmed = window.confirm("Delete this appointment?");
  if (!confirmed) return;

  try {
    await store.deleteAppointment(appointmentId);
    mainStore?.setSnackbar?.({ title: "Appointment deleted", type: "success" });
    await fetchAppointments();
  } catch (error) {
    const msg =
      error?.data?.message || error?.message || "Failed to delete appointment";
    mainStore?.setSnackbar?.({ title: msg, type: "error" });
  }
};

const buildDateTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return null;
  const formattedTime = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  return new Date(`${dateStr}T${formattedTime}`);
};

const handleAppointmentSave = async (payload) => {
  const dentistId = payload.practitioner || payload.dentistId;
  const startTime = buildDateTime(payload.date, payload.time || payload.start);
  const endTime = startTime
    ? new Date(startTime.getTime() + Number(payload.duration || 15) * 60000)
    : null;
  const base = {
    dentistId,
    patientId: props.patient?.id,
    date: payload.date,
    time: payload.time || payload.start,
    duration: payload.duration,
    status: payload.status,
    treatmentName: payload.exam || payload.treatmentName,
    treatmentId: payload.treatmentId || null,
    notes: payload.notes || "",
  };

  try {
    if (payload.id) {
      await store.updateAppointment({
        id: payload.id,
        ...base,
        startTime,
        endTime,
      });
      mainStore?.setSnackbar?.({
        title: "Appointment updated",
        type: "success",
      });
    } else {
      await store.createAppointment(base);
      mainStore?.setSnackbar?.({
        title: "Appointment created",
        type: "success",
      });
    }
    await fetchAppointments();
  } catch (error) {
    const msg =
      error?.data?.message || error?.message || "Failed to save appointment";
    mainStore?.setSnackbar?.({ title: msg, type: "error" });
    showAppointmentDrawer.value = true;
  }
};

watch(appointmentStatus, fetchAppointments);
watch(appointmentPractitionerId, fetchAppointments);
watch(appointmentDate, fetchAppointments);
watch(
  () => props.patient?.id,
  async (patientId) => {
    if (!patientId) return;
    await Promise.all([fetchPractitioners(), fetchAppointments()]);
  },
  { immediate: true },
);
watch(appointmentSearch, () => {
  if (searchTimer.value) clearTimeout(searchTimer.value);
  searchTimer.value = setTimeout(() => {
    fetchAppointments();
  }, 400);
});
</script>

<style scoped lang="scss">
.border-sm {
  border: 1px solid rgb(var(--v-theme-outline));
  margin-bottom: 8px;
}

.appointments-panels :deep(.v-expansion-panel-title) {
  border-bottom: 1px solid #e5e7eb;
  min-height: 48px;
}

.appointments-panels :deep(.v-expansion-panel-text) {
  padding: 0 !important;
}

.appointments-panels :deep(.v-expansion-panel-text__wrapper) {
  padding: 0 !important;
}

.appointments-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.appointments-toolbar__left,
.appointments-toolbar__right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.appointments-cell-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.appointments-practitioner-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.appointments-search {
  width: 240px;
}

.appointments-filter-btn {
  height: 40px;
  border-radius: 8px;
  text-transform: none;
  background: #fafafa !important;
  color: #4b5563;
  box-shadow: none;
}

.appointments-filter-card {
  min-width: 320px;
  border-radius: 14px;
  padding: 16px;
}

.appointments-filter-chips {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.appointments-table-th {
  display: flex;
  align-items: center;
  min-height: 44px;
  font-weight: 600;
  color: #374151;
}

.appointments-data-table {
  border-top: none;
  border-radius: unset;
}

.appointments-data-table :deep(.v-table__wrapper) {
  margin-top: 0 !important;
}

.appointments-data-table :deep(.v-data-table tbody tr) {
  height: 52px !important;
}

.appointments-data-table :deep(.v-data-table td) {
  height: 52px !important;
  padding: 6px 12px !important;
  vertical-align: middle !important;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.appointments-data-table :deep(.v-data-table tbody tr:hover) {
  background: #fafafa !important;
}

.appointments-data-table
  :deep(.v-table .v-table__wrapper > table > thead > tr > th) {
  border-right: 1px solid rgba(0, 0, 0, 0.12);
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.appointments-data-table
  :deep(.v-table .v-table__wrapper > table > tbody > tr > td) {
  border-right: 1px solid rgba(0, 0, 0, 0.12);
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.appointments-data-table
  :deep(.v-table .v-table__wrapper > table > thead > tr > th:last-child),
.appointments-data-table
  :deep(.v-table .v-table__wrapper > table > tbody > tr > td:last-child) {
  border-right: none;
}

.appointments-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  flex-wrap: nowrap;
}

.appointments-action-btn {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 8px;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.appointments-action-btn:hover {
  background: #f3f4f6;
}

.appointments-action-icon {
  width: 16px;
  height: 16px;
  display: block;
}

.full-width-table :deep(.v-table__wrapper) {
  width: 100%;
}

.full-width-table :deep(table) {
  width: 100% !important;
  table-layout: auto;
}

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

.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background: #fff !important;
  min-height: 44px;
  font-size: 14px;
}

.action-btn {
  height: 40px;
  text-transform: none;
  font-weight: 500;
  font-size: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

@media (max-width: 960px) {
  .appointments-toolbar__left,
  .appointments-toolbar__right {
    width: 100%;
  }

  .appointments-search {
    width: 100%;
  }
}
</style>



