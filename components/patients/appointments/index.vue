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

    <section class="appointments-shell">
      <div class="appointments-topbar">
        <div class="appointments-tabs" role="tablist" aria-label="Appointment views">
          <button
            v-for="tab in appointmentTabs"
            :key="tab.key"
            type="button"
            class="appointments-tab"
            :class="{ 'appointments-tab--active': appointmentTab === tab.key }"
            @click="appointmentTab = tab.key"
          >
            <span class="appointments-tab__icon">
              <v-icon size="14">mdi-format-list-bulleted</v-icon>
            </span>
            <span>{{ tab.label }}</span>
            <span class="appointments-tab__count">{{ tab.count }}</span>
          </button>
        </div>

        <div class="appointments-toolbar">
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
                <span>Filters</span>
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

          <v-btn
            color="primary"
            variant="flat"
            rounded="lg"
            class="action-btn"
            prepend-icon="mdi-plus-circle-outline"
            @click="openNewAppointment"
          >
            Create an appointment
          </v-btn>
        </div>
      </div>

      <div
        v-if="activeAppointmentFilterChips.length"
        class="appointments-filter-chips"
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

      <div class="appointments-table-wrap">
        <div class="appointments-table-scroll">
          <table class="appointments-table">
            <colgroup>
              <col
                v-for="(column, index) in appointmentHeaders"
                :key="column.key"
                :style="{ width: `${appointmentColumnWidths[index] || 160}px` }"
              />
            </colgroup>
            <thead>
              <tr>
                <th
                  v-for="(column, index) in appointmentHeaders"
                  :key="column.key"
                  :style="appointmentHeaderStyle(index)"
                >
                  <div class="appointments-table-th">
                    <p class="mb-0">{{ column.title }}</p>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody v-if="!appointmentLoading && pagedAppointments.length">
              <tr
                v-for="item in pagedAppointments"
                :key="item.diaryAppointmentId || item.id"
              >
                <td>
                  <v-tooltip :text="item.when" location="top">
                    <template #activator="{ props: tooltipProps }">
                      <div
                        v-bind="tooltipProps"
                        class="text-body-2 appointments-cell-text appointments-cell-text--when"
                      >
                        {{ item.when }}
                      </div>
                    </template>
                  </v-tooltip>
                </td>
                <td>
                  <div
                    class="text-body-2 text-medium-emphasis appointments-cell-text"
                    :title="item.duration"
                  >
                    {{ item.duration }}
                  </div>
                </td>
                <td>
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
                </td>
                <td>
                  <div
                    class="text-body-2 text-medium-emphasis appointments-cell-text"
                    :title="item.treatmentPlan || '-'"
                  >
                    {{ item.treatmentPlan || "-" }}
                  </div>
                </td>
                <td>
                  <div
                    class="text-body-2 font-weight-500 appointments-cell-text"
                    :title="item.treatmentName || 'Exam'"
                  >
                    {{ item.treatmentName || "Exam" }}
                  </div>
                </td>
                <td>
                  <v-tooltip :text="item.notes || '-'" location="top">
                    <template #activator="{ props: tooltipProps }">
                      <div
                        v-bind="tooltipProps"
                        class="text-body-2 appointments-cell-text appointments-cell-text--notes"
                        :class="{ 'text-error': isMissedStatus(item.status) }"
                      >
                        {{ item.notes || "-" }}
                      </div>
                    </template>
                  </v-tooltip>
                </td>
                <td>
                  <div
                    class="text-body-2 appointments-cell-text"
                    :class="arrivalClass(item.arrival)"
                    :title="item.arrival || '-'"
                  >
                    {{ item.arrival || "-" }}
                  </div>
                </td>
                <td>
                  <div
                    class="appointments-status-pill"
                    :class="`appointments-status-pill--${statusMeta(item.status).tone}`"
                  >
                    <span class="appointments-status-pill__dot" />
                    <span>{{ statusMeta(item.status).label }}</span>
                    <v-icon size="14" class="appointments-status-pill__chevron">
                      mdi-chevron-down
                    </v-icon>
                  </div>
                </td>
                <td>
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
                      class="appointments-action-btn appointments-action-btn--danger"
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
                </td>
              </tr>
            </tbody>
            <tbody v-else>
              <tr>
                <td :colspan="appointmentHeaders.length" class="appointments-table__empty">
                  {{ appointmentLoading ? "Loading appointments..." : "No appointments found" }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="appointments-table-footer">
          <div class="appointments-table-footer__left">
            <span class="appointments-table-footer__label">Items per page:</span>
            <v-select
              v-model="appointmentOptions.itemsPerPage"
              :items="[5, 10, 20, 50]"
              variant="outlined"
              density="compact"
              hide-details
              class="appointments-page-size"
            />
          </div>

          <div class="appointments-table-footer__right">
            <span class="appointments-table-footer__range">
              {{ appointmentRangeLabel }}
            </span>
            <div class="appointments-pagination">
              <button
                type="button"
                class="appointments-pagination__btn"
                :disabled="appointmentOptions.page <= 1"
                @click="appointmentOptions.page = 1"
              >
                <v-icon size="18">mdi-page-first</v-icon>
              </button>
              <button
                type="button"
                class="appointments-pagination__btn"
                :disabled="appointmentOptions.page <= 1"
                @click="appointmentOptions.page -= 1"
              >
                <v-icon size="18">mdi-chevron-left</v-icon>
              </button>
              <button
                type="button"
                class="appointments-pagination__btn"
                :disabled="appointmentOptions.page >= appointmentPageCount"
                @click="appointmentOptions.page += 1"
              >
                <v-icon size="18">mdi-chevron-right</v-icon>
              </button>
              <button
                type="button"
                class="appointments-pagination__btn"
                :disabled="appointmentOptions.page >= appointmentPageCount"
                @click="appointmentOptions.page = appointmentPageCount"
              >
                <v-icon size="18">mdi-page-last</v-icon>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

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
const appointmentOptions = ref({ page: 1, itemsPerPage: 10 });
const appointmentSearch = ref("");
const appointmentStatus = ref("all");
const appointmentTab = ref("booked");
const appointmentPractitionerId = ref("all");
const appointmentDate = ref("");
const appointmentFilterMenu = ref(false);
const searchTimer = ref(null);
const showAppointmentDrawer = ref(false);
const editAppointment = ref(null);
const practitionerOptions = ref([]);
const deletingAppointmentIds = ref(new Set());

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

const APPOINTMENT_TAB_CONFIG = {
  booked: "Booked Appointment",
  unbooked: "Unbooked Appointment",
  missed: "MissedAppointment",
};

const appointmentHeaders = [
  { title: "When", key: "when", sortable: false },
  { title: "Duration", key: "duration", sortable: false },
  { title: "Practitioner", key: "dentistName", sortable: false },
  { title: "Treatment Plan", key: "treatmentPlan", sortable: false },
  { title: "Appointment Details", key: "treatmentName", sortable: false },
  { title: "Notes", key: "notes", sortable: false },
  { title: "Arrived", key: "arrival", sortable: false },
  { title: "Appointment Status", key: "status", sortable: false },
  { title: "Action", key: "actions", sortable: false, align: "end" },
];

const appointmentColumnWidths = [186, 108, 230, 140, 250, 326, 120, 158, 100];

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

const normalizeStatus = (status) =>
  String(status || "")
    .trim()
    .toLowerCase();

const isBookedStatus = (status) => {
  const value = normalizeStatus(status);
  return [
    "confirmed",
    "arrived",
    "complete",
    "completed",
    "booked",
    "scheduled",
  ].includes(value);
};

const isUnbookedStatus = (status) => {
  const value = normalizeStatus(status);
  return ["pending", "planned", "draft", "unbooked"].includes(value);
};

const isMissedStatus = (status) => {
  const value = normalizeStatus(status);
  return (
    ["missed", "cancelled", "canceled", "no show", "noshow"].includes(value) ||
    value.includes("cancel")
  );
};

const appointmentMatchesTab = (status, tabKey) => {
  if (tabKey === "booked") return isBookedStatus(status);
  if (tabKey === "unbooked") return isUnbookedStatus(status);
  if (tabKey === "missed") return isMissedStatus(status);
  return true;
};

const statusMeta = (status) => {
  if (isMissedStatus(status)) {
    return { label: status || "Missed", tone: "missed" };
  }
  if (isBookedStatus(status)) {
    return { label: status || "Complete", tone: "booked" };
  }
  return { label: status || "Pending", tone: "unbooked" };
};

const arrivalClass = (arrival) => {
  const value = normalizeStatus(arrival);
  if (value.includes("late")) return "text-error";
  return "text-medium-emphasis";
};

const resolveAppointmentNotes = (row) => {
  const candidates = [
    row?.notes,
    row?.note,
    row?.comments,
    row?.comment,
    row?.remark,
    row?.remarks,
    row?.description,
  ];

  const resolved = candidates.find(
    (value) => typeof value === "string" && value.trim(),
  );

  return resolved?.trim() || null;
};

const appointmentStats = computed(() => {
  const total = appointmentRows.value.length;
  const completed = appointmentRows.value.filter(
    (appointment) =>
      ["complete", "completed"].includes(normalizeStatus(appointment.status)),
  ).length;
  const cancelled = appointmentRows.value.filter((appointment) =>
    normalizeStatus(appointment.status).includes("cancel"),
  ).length;
  const missed = appointmentRows.value.filter((appointment) =>
    isMissedStatus(appointment.status),
  ).length;
  return { total, completed, cancelled, missed };
});

const appointmentStatCards = computed(() => [
  {
    label: "Total Appointments",
    value: appointmentStats.value.total,
    icon: "https://cdn.lordicon.com/asyunleq.json",
  },
  {
    label: "Completed",
    value: appointmentStats.value.completed,
    icon: "https://cdn.lordicon.com/kphwxuxr.json",
  },
  {
    label: "Cancelled",
    value: appointmentStats.value.cancelled,
    icon: "https://cdn.lordicon.com/tzynxkwl.json",
  },
  {
    label: "Missed",
    value: appointmentStats.value.missed,
    icon: "https://cdn.lordicon.com/excswhey.json",
  },
]);

const filteredAppointmentRows = computed(() =>
  appointmentRows.value.filter((appointment) =>
    appointmentMatchesTab(appointment.status, appointmentTab.value),
  ),
);

const appointmentTabs = computed(() =>
  Object.entries(APPOINTMENT_TAB_CONFIG).map(([key, label]) => ({
    key,
    label,
    count: appointmentRows.value.filter((appointment) =>
      appointmentMatchesTab(appointment.status, key),
    ).length,
  })),
);

const filteredAppointmentTotal = computed(() => filteredAppointmentRows.value.length);

const appointmentPageCount = computed(() =>
  Math.max(
    1,
    Math.ceil(
      filteredAppointmentTotal.value / appointmentOptions.value.itemsPerPage,
    ),
  ),
);

const pagedAppointments = computed(() => {
  const start =
    (appointmentOptions.value.page - 1) * appointmentOptions.value.itemsPerPage;
  return filteredAppointmentRows.value.slice(
    start,
    start + appointmentOptions.value.itemsPerPage,
  );
});

const appointmentRangeLabel = computed(() => {
  if (!filteredAppointmentTotal.value) return "0-0 of 0";
  const start =
    (appointmentOptions.value.page - 1) * appointmentOptions.value.itemsPerPage +
    1;
  const end = Math.min(
    filteredAppointmentTotal.value,
    start + appointmentOptions.value.itemsPerPage - 1,
  );
  return `${start}-${end} of ${filteredAppointmentTotal.value}`;
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
    notes: resolveAppointmentNotes(row),
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
  } catch (_error) {
    appointmentRows.value = [];
  } finally {
    appointmentLoading.value = false;
  }
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
  if (deletingAppointmentIds.value.has(String(appointmentId))) return;

  const confirmed = window.confirm("Delete this appointment?");
  if (!confirmed) return;

  try {
    deletingAppointmentIds.value = new Set(deletingAppointmentIds.value).add(
      String(appointmentId),
    );
    const res = await store.deleteAppointment(appointmentId);
    if (res?.code !== 0) {
      throw new Error(res?.message || "Failed to delete appointment");
    }
    appointmentRows.value = appointmentRows.value.filter(
      (item) =>
        String(item?.diaryAppointmentId || item?.id) !== String(appointmentId),
    );
    mainStore?.setSnackbar?.({ title: "Appointment deleted", type: "success" });
    await fetchAppointments();
  } catch (error) {
    const msg =
      error?.data?.message || error?.message || "Failed to delete appointment";
    mainStore?.setSnackbar?.({ title: msg, type: "error" });
  } finally {
    const next = new Set(deletingAppointmentIds.value);
    next.delete(String(appointmentId));
    deletingAppointmentIds.value = next;
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
watch(appointmentTab, () => {
  appointmentOptions.value.page = 1;
});
watch(
  () => appointmentOptions.value.itemsPerPage,
  () => {
    appointmentOptions.value.page = 1;
  },
);
watch(filteredAppointmentTotal, (total) => {
  const maxPage = Math.max(
    1,
    Math.ceil(total / appointmentOptions.value.itemsPerPage),
  );
  if (appointmentOptions.value.page > maxPage) {
    appointmentOptions.value.page = maxPage;
  }
});
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
.appointments-shell {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.appointments-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.appointments-tabs {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.appointments-tab {
  min-height: 44px;
  padding: 10px 16px;
  border: 1px solid #edf0f5;
  border-radius: 12px;
  background: #f8fafc;
  color: #7b8190;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;
}

.appointments-tab--active {
  background: #ffffff;
  color: #1f2937;
  border-color: #e6ecf5;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
}

.appointments-tab__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #8b95a7;
}

.appointments-tab__count {
  color: inherit;
}

.appointments-toolbar {
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
  width: 220px;
}

.appointments-filter-btn {
  height: 44px;
  border-radius: 12px;
  text-transform: none;
  background: #f8fafc !important;
  color: #606a7b;
  box-shadow: none;
  border: 1px solid #edf0f5;
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

.appointments-table-wrap {
  overflow: hidden;
  border: 1px solid #d8dde6;
  border-radius: 18px;
  background: #ffffff;
}

.appointments-table-scroll {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
}

.appointments-table {
  width: 100%;
  min-width: 1618px;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
}

.appointments-table th,
.appointments-table td {
  border-right: 1px solid #d8dde6;
  border-bottom: 1px solid #d8dde6;
}

.appointments-table th:last-child,
.appointments-table td:last-child {
  border-right: none;
}

.appointments-table tbody tr:last-child td {
  border-bottom: none;
}

.appointments-table-th {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 46px;
  font-weight: 500;
  color: #232833;
}

.appointments-table th {
  padding: 0 14px !important;
  background: #fbfbfc;
}

.appointments-table td {
  height: 48px;
  padding: 8px 16px;
  vertical-align: middle;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 0;
}

.appointments-table tbody tr:hover {
  background: #fafafa;
}

.appointments-table__empty {
  padding: 24px 16px !important;
  text-align: center;
  color: #6b7280;
}

.appointments-table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  border-top: 1px solid #d8dde6;
  background: #ffffff;
  flex-wrap: wrap;
}

.appointments-table-footer__left,
.appointments-table-footer__right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.appointments-table-footer__label,
.appointments-table-footer__range {
  font-size: 14px;
  color: #1f2937;
}

.appointments-page-size {
  width: 88px;
}

.appointments-page-size :deep(.v-field) {
  min-height: 40px;
  border-radius: 8px;
}

.appointments-pagination {
  display: flex;
  align-items: center;
  gap: 4px;
}

.appointments-pagination__btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #9ca3af;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.appointments-pagination__btn:hover:not(:disabled) {
  background: #f3f4f6;
  color: #4b5563;
}

.appointments-pagination__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.appointments-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: nowrap;
  width: 100%;
}

.appointments-action-btn {
  width: 18px;
  height: 18px;
  border: none;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.appointments-action-btn:hover {
  opacity: 0.72;
}

.appointments-action-btn--danger img {
  filter: saturate(1.1);
}

.appointments-action-icon {
  width: 16px;
  height: 16px;
  display: block;
}

.appointments-status-pill {
  width: fit-content;
  min-width: 114px;
  min-height: 28px;
  padding: 4px 10px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  line-height: 1;
}

.appointments-status-pill--booked {
  background: #eaf8ec;
  color: #1c2a22;
}

.appointments-status-pill--unbooked {
  background: #fff7db;
  color: #5f4a00;
}

.appointments-status-pill--missed {
  background: #fde8e8;
  color: #5e1d1d;
}

.appointments-status-pill__dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: currentColor;
  opacity: 0.95;
}

.appointments-status-pill__chevron {
  opacity: 0.45;
}

.appointments-cell-text--when,
.appointments-cell-text--notes {
  display: block;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.custom-search {
  height: 44px;
  border-radius: 12px;
  font-size: 14px;
  background-color: #f8fafc !important;
  text-transform: none;
  box-shadow: none;
  color: #737373;
  align-items: center;
  border: 1px solid #edf0f5;
}

.custom-search :deep(input::placeholder) {
  color: #737373;
  opacity: 1;
}

.custom-search :deep(.v-field) {
  border-radius: 12px !important;
  box-shadow: none !important;
}

.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background: #fff !important;
  min-height: 44px;
  font-size: 14px;
}

.action-btn {
  height: 46px;
  padding: 0 20px;
  text-transform: none;
  font-weight: 500;
  font-size: 14px;
  box-shadow: none;
}

@media (max-width: 960px) {
  .appointments-topbar,
  .appointments-toolbar {
    width: 100%;
  }

  .appointments-table-footer,
  .appointments-table-footer__left,
  .appointments-table-footer__right,
  .appointments-tabs,
  .appointments-search {
    width: 100%;
  }

  .appointments-table-footer {
    justify-content: flex-start;
  }
}
</style>



