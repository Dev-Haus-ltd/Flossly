
<template>
  <v-sheet color="background">
    <div class="cust-border d-flex align-center">
      <p class="mr-1">Flossly Diary</p>
    </div>

    <!-- Controls -->
    <!-- <div class="d-flex align-center justify-space-between px-4 py-3">
      <div class="d-flex align-center" style="gap: 8px">
        <v-btn icon variant="text" @click="prevDay"
          ><v-icon>mdi-chevron-left</v-icon></v-btn
        >
        <v-btn icon variant="text" @click="nextDay"
          ><v-icon>mdi-chevron-right</v-icon></v-btn
        >

        <v-menu
          v-model="datePickerOpen"
          :close-on-content-click="false"
          location="bottom start"
        >
          <template #activator="{ props: menuProps }">
            <button v-bind="menuProps" class="date-label-btn ml-2">
              <span class="text-subtitle-1 font-weight-600">{{
                dayLabel
              }}</span>
              <v-icon size="16" class="ml-1" style="opacity: 0.5"
                >mdi-calendar</v-icon
              >
            </button>
          </template>
          <v-card elevation="4" rounded="lg" style="overflow: hidden">
            <v-date-picker
              :model-value="dateStr"
              color="primary"
              show-adjacent-months
              @update:model-value="onPickerDate"
            />
          </v-card>
        </v-menu>

        <v-btn-toggle v-model="view" mandatory class="custom-toggle ml-6">
          <v-btn value="day" class="toggle-btn">
            <img
              :src="listicon"
              alt="list icon"
              class="mr-1"
              width="16"
              height="16"
            />
            Day
          </v-btn>
          <v-btn value="week" class="toggle-btn">
            <img
              :src="calendericon"
              alt="calendar icon"
              class="mr-1"
              width="16"
              height="16"
            />
            Week
          </v-btn>
        </v-btn-toggle>

        <div class="ml-4" style="width: 120px">
          <v-text-field
            v-model="search"
            placeholder="Search"
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
              <img :src="searchIcon" alt="search icon" width="14" height="14" />
            </template>
          </v-text-field>
        </div>
        <DiaryFilterMenu
          class="ml-2"
          :dentists="dentists"
          :treatments="treatments"
          :init-date="dateStr"
          @update:filters="onFilters"
        />
        <v-select
          class="ml-2"
          v-model="selectedDentistIds"
          :items="dentistSelect"
          item-title="name"
          item-value="id"
          multiple
          chips
          label="Dentists"
          placeholder="Select dentists"
          style="max-width: 320px; border-radius: 10px"
          density="compact"
          hide-details
          variant="outlined"
        />
      </div>
      <div>
        <v-btn
          color="primary"
          rounded="lg"
          variant="flat"
          @click="showAddPatient = true"
        >
          <template #prepend
            ><v-icon size="18">mdi-plus-circle-outline</v-icon></template
          >
          Add Patient
        </v-btn>
      </div>
    </div> -->

    <div
      class="d-flex align-center justify-space-between px-4 py-3 bg-white border-bottom"
    >
      <div class="d-flex align-center" style="gap: 12px">
        <div class="d-flex align-center bg-grey-lighten-4 rounded-lg px-1">
          <v-btn icon size="small" variant="text" @click="prevDay">
            <v-icon size="20">mdi-chevron-left</v-icon>
          </v-btn>
          <v-btn icon size="small" variant="text" @click="nextDay">
            <v-icon size="20">mdi-chevron-right</v-icon>
          </v-btn>
        </div>

        <v-menu
          v-model="datePickerOpen"
          :close-on-content-click="false"
          location="bottom start"
          transition="scale-transition"
        >
          <template #activator="{ props: menuProps }">
            <button
              v-bind="menuProps"
              class="date-picker-trigger d-flex align-center px-2 py-1 rounded-md"
            >
              <v-icon size="16" class="mr-2 text-primary"
                >mdi-calendar-month-outline</v-icon
              >
              <span
                class="text-subtitle-2 font-weight-bold text-grey-darken-3"
                >{{ formattedDate }}</span
              >
              <v-icon size="14" class="ml-1 text-grey-lighten-1"
                >mdi-chevron-down</v-icon
              >
            </button>
          </template>
          <v-card elevation="12" rounded="lg" class="mt-1">
            <v-date-picker
              :model-value="dateStr"
              color="primary"
              density="compact"
              @update:model-value="onPickerDate"
            />
          </v-card>
        </v-menu>

        <div class="ml-4" style="width: 120px">
          <v-text-field
            v-model="search"
            placeholder="Search"
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
              <img :src="searchIcon" alt="search icon" width="14" height="14" />
            </template>
          </v-text-field>
        </div>

        <DiaryFilterMenu
          class="ml-2"
          :dentists="dentists"
          :treatments="treatments"
          :init-date="dateStr"
          @update:filters="onFilters"
        />

        <div class="d-flex align-center ml-4" style="gap: 8px">
          <span class="text-caption font-weight-bold text-grey-darken-1"
            >DENTIST:</span
          >
          <v-select
            v-model="selectedDentistIds"
            :items="dentistSelect"
            item-title="name"
            item-value="id"
            multiple
            chips
            closable-chips
            placeholder="All Dentists"
            style="width: 200px"
            density="compact"
            hide-details
            variant="outlined"
            rounded="lg"
          />
        </div>
      </div>

      <div class="d-flex align-center" style="gap: 8px">
        <v-btn
          color="#7d77ff"
          rounded="lg"
          elevation="0"
          height="40"
          class="text-none position-relative"
          @click="showClipboardPanel = true"
        >
          <v-icon start size="18">mdi-clipboard-outline</v-icon>
          Drafts
          <v-badge
            v-if="clipboardDraftCount > 0"
            :content="clipboardDraftCount"
            color="error"
            class="clipboard-badge"
            location="top end"
            offset-x="8"
            offset-y="8"
          />
        </v-btn>

        <v-btn
          color="primary"
          rounded="lg"
          elevation="0"
          height="40"
          class="text-none"
          @click="showAddPatient = true"
        >
          <v-icon start>mdi-plus</v-icon>
          Add Patient
        </v-btn>
      </div>

      <!-- Clipboard Panel -->
      <ClipboardPanel
        ref="clipboardPanelRef"
        v-model="showClipboardPanel"
        @use-draft="onUseDraftFromClipboard"
        @close="showClipboardPanel = false"
        @update-count="updateClipboardBadge"
      />
    </div>

    <!-- Calendar grid with skeleton loading state -->
    <div>
      <!-- Show skeleton while loading dentists -->
      <div v-if="dentistsLoading" class="calendar-skeleton">
        <div class="skeleton-header">
          <div class="skeleton-time-col"></div>
          <div class="skeleton-dentist-cols">
            <div v-for="i in 3" :key="i" class="skeleton-dentist-col">
              <div class="skeleton-avatar"></div>
              <div class="skeleton-text"></div>
            </div>
          </div>
        </div>
        <div class="skeleton-grid">
          <div v-for="i in 8" :key="i" class="skeleton-row">
            <div class="skeleton-time-cell"></div>
            <div class="skeleton-slots">
              <div v-for="j in 3" :key="j" class="skeleton-slot-cell">
                <div class="skeleton-micro-slots">
                  <div
                    v-for="k in 4"
                    :key="k"
                    class="skeleton-micro-slot"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Show alert only when dentists are loaded but empty -->
      <v-alert
        v-else-if="!dentists || dentists.length === 0"
        type="warning"
        variant="tonal"
        class="mb-4"
      >
        No dentists available for your role or the selected date.
      </v-alert>

      <!-- Show actual calendar when dentists are loaded -->
      <DiaryCalendar
        v-else
        :date="dateStr"
        :view="view"
        :dentists="dentists"
        :selected-dentist-ids="selectedDentistIds"
        :appointments="appointmentsByDentist"
        :dentist-availability="dentistAvailability"
        :highlighted-appointment-id="highlightedAppointmentId"
        :zones="zones"
        @slot-click="openAppointment"
        @slot-full="onSlotFull"
        @open-notes="onOpenNotes"
        @toggle-day-slots="onToggleDentistDaySlots"
        @open-schedule-settings="openDentistSchedule"
        @update-status="onUpdateStatus"
        @move-appointment="onMoveAppointment"
        @open-appointment="onOpenExistingAppointment"
        @reszie-appointment="onResizeAppointment"
        @create-from-draft="onCreateFromDraft"
      />
    </div>

    <!-- Modals - Only render after page loads -->
    <ClientOnly>
      <template v-if="dentists && dentists.length > 0">
        <AddAppointment
          v-model="showAppointment"
          :initial-date="dateStr"
          :initial-time="modalTime"
          :initial-duration="modalDuration"
          :initial-practitioner="modalDentist?.id || null"
          :practitioner-options="practitionerOptions"
          :patient-options="patientOptions"
          :preselected-patient="preselectedPatientName"
          :preselected-patient-id="preselectedPatientId"
          :edit-appointment="editingAppointment"
          @add-patient="onAddPatientFromAppointment"
          @save="onSaveAppointment"
          @save-to-clipboard="onSaveToClipboard"
        />
      </template>
    </ClientOnly>

    <!-- Add Patient Panel - Only render after page loads -->
    <ClientOnly>
      <AddPatient v-model="showAddPatient" @save="onPatientSaved" />
    </ClientOnly>

    <NotesModal
      v-model="showNotes"
      :date="dateStr"
      :dentist-id="notesDentist?.id || null"
      :dentist-name="notesDentist?.name || ''"
    />
  </v-sheet>
</template>

<script setup>
import DiaryCalendar from "@/components/diary/calendar/index.vue";
import DiaryFilterMenu from "@/components/diary/filterMenu.vue";
import AddAppointment from "@/components/diary/addAppointment.vue";
import ClipboardPanel from "@/components/diary/ClipboardPanel.vue";
import AddPatient from "@/components/diary/addPatient.vue";
import NotesModal from "@/components/diary/NotesModal.vue";
import { useDiaryStore } from "@/stores/diary";
import { useScheduleStore } from "@/stores/schedule";
import { useZonesStore } from "@/stores/zones";
import { useMainStore } from "@/stores/index";
import { useOrgStore } from "@/stores/organisation";
import { clinicMinutesFromTime, dateToLocalYMD } from "@/lib/dateFormatter";
import { useDentistAvailability } from "@/composables/useDentistAvailability";
import { useUser } from "@/composables/useUser";
//icons
import listicon from "@/assets/icons/listView/listicon.svg";
import calendericon from "@/assets/icons/listView/calendericon.svg";
import searchIcon from "@/assets/icons/listView/serach-icon.svg";
import { formatDateDDMMYYYY } from "@/lib/dateFormatter";

definePageMeta({ layout: "home" });

const search = ref("");
const view = ref("day");
const route = useRoute();
const router = useRouter();

const date = ref(new Date());
const selectedDentistIds = ref([]);
watch(view, (v) => console.log("current view ->", v));
const diaryStore = useDiaryStore();
const scheduleStore = useScheduleStore();
const zonesStore = useZonesStore();
const dentists = ref([]);
const dentistsLoading = ref(true); // Add loading state
const zones = computed(() => zonesStore.getAllZones);
const treatments = ref([]);
const organisationStore = useOrgStore();
const { user } = useUser();

// Availability tracking
const { loadDentistSchedules, isAvailableOnDate, getWorkingHoursForDate, getAvailabilityMessage } = useDentistAvailability();
const dentistAvailability = ref({}); // Maps dentistId to { isAvailable, workingHours, message }
// Add to data / refs
const showClipboardPanel = ref(false); // Closed by default, opens via Quick Actions
const clipboardPanelRef = ref(null);
const clipboardDraftCount = ref(0);
const isDraggingOrResizing = ref(false);

const dentistSelect = computed(() => dentists.value);
const practitionerOptions = computed(() =>
  (dentists.value || []).map((dentist) => ({
    title: dentist.name,
    value: dentist.id,
  })),
);
const highlightedAppointmentId = computed(() =>
  route.query?.appointmentId ? String(route.query.appointmentId) : null,
);

// Simple appointment storage keyed by dentist id
const appointmentsByDentist = reactive({});
let appointmentsLoadSeq = 0;

// Use global snackbar via store
const mainStore = useMainStore();
function showError(message) {
  mainStore?.setSnackbar?.({
    title: message || "Something went wrong",
    type: "error",
  });
}
function showSuccess(message) {
  mainStore?.setSnackbar?.({ title: message || "Done", type: "success" });
}

const dateStr = computed(() => dateToLocalYMD(date.value));
const dateLabel = computed(() => formatDateDDMMYYYY(date.value));
const dayLabel = computed(() => formatDateDDMMYYYY(date.value));

function normalizeDentistQueryIds(value) {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  return list
    .map((id) => {
      const normalized = String(id).trim();
      return /^\d+$/.test(normalized) ? Number(normalized) : normalized;
    })
    .filter(Boolean);
}

function applyRouteQuery(query = {}) {
  if (query?.date) {
    const nextDate = new Date(String(query.date));
    if (!Number.isNaN(nextDate.getTime())) {
      date.value = nextDate;
    }
  }
  if (query?.dentistId) {
    selectedDentistIds.value = normalizeDentistQueryIds(query.dentistId);
  }
}

function openDentistSchedule(dentist) {
  if (!dentist?.id) return;
  router.push({
    path: "/settings",
    query: {
      setting: "diary",
      diarySection: "Dentist Schedules",
      dentistId: String(dentist.id),
    },
  });
}

function getScheduleDayForDate(schedules = [], targetDate) {
  if (!targetDate) return null;
  const localDate = new Date(`${targetDate}T00:00:00`);
  if (Number.isNaN(localDate.getTime())) return null;

  const activeSchedule =
    schedules.find((schedule) => {
      if (!schedule?.isActive) return false;
      const start = schedule.startDate
        ? new Date(`${schedule.startDate}T00:00:00`)
        : null;
      const end = schedule.endDate
        ? new Date(`${schedule.endDate}T00:00:00`)
        : null;
      if (start && localDate < start) return false;
      if (end && localDate > end) return false;
      return true;
    }) || null;

  if (!activeSchedule) return null;

  const jsDay = localDate.getDay();
  const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;
  const day =
    activeSchedule.days?.find((item) => Number(item.dayOfWeek) === dayOfWeek) ||
    null;

  return day ? { schedule: activeSchedule, day } : null;
}

const DEFAULT_DAY_SLOT_HOURS = {
  startTime: "09:00",
  endTime: "18:00",
};

function isValidWorkingHourRange(startTime, endTime) {
  if (!startTime || !endTime) return false;

  const toMinutes = (value) => {
    const [hours, minutes] = String(value).split(":").map(Number);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return NaN;
    return hours * 60 + minutes;
  };

  const startMinutes = toMinutes(startTime);
  const endMinutes = toMinutes(endTime);

  return Number.isFinite(startMinutes) &&
    Number.isFinite(endMinutes) &&
    startMinutes < endMinutes;
}

function getDaySlotHours(day) {
  if (isValidWorkingHourRange(day?.startTime, day?.endTime)) {
    return {
      startTime: day.startTime,
      endTime: day.endTime,
    };
  }

  return { ...DEFAULT_DAY_SLOT_HOURS };
}

function buildOneDayScheduleOverride(dentist, targetDate) {
  const localDate = new Date(`${targetDate}T00:00:00`);
  const jsDay = localDate.getDay();
  const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;
  const dayNames = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  return {
    organisationId:
      user.value?.currentLoggedInOrgId || user.value?.organisationId,
    dentistId: dentist.id,
    scheduleName: `${dentist.name} Calendar Override ${targetDate}`,
    startDate: targetDate,
    endDate: targetDate,
    repeatPattern: "weekly",
    isActive: true,
    weekDays: dayNames.map((dayName, index) => ({
      dayOfWeek: index,
      dayName,
      isWorkingDay: index === dayOfWeek,
      startTime:
        index === dayOfWeek ? DEFAULT_DAY_SLOT_HOURS.startTime : null,
      endTime: index === dayOfWeek ? DEFAULT_DAY_SLOT_HOURS.endTime : null,
      breaks: [],
    })),
  };
}

async function onToggleDentistDaySlots(dentist) {
  const orgId = user.value?.currentLoggedInOrgId || user.value?.organisationId;
  if (!orgId || !dentist?.id) return;

  try {
    const schedules = await loadDentistSchedules(orgId, dentist.id);
    const resolved = getScheduleDayForDate(schedules, dateStr.value);

    if (!resolved?.day?.id) {
      await scheduleStore.createSchedule(
        buildOneDayScheduleOverride(dentist, dateStr.value),
      );
      await loadDentistsAvailability();
      showSuccess(
        `${dentist.name} day slots turned on (${DEFAULT_DAY_SLOT_HOURS.startTime} - ${DEFAULT_DAY_SLOT_HOURS.endTime})`,
      );
      return;
    }

    const { day } = resolved;
    const nextHours = !day.isWorkingDay
      ? getDaySlotHours(day)
      : {
          startTime: day.startTime,
          endTime: day.endTime,
        };

    await scheduleStore.updateScheduleDay({
      scheduleDayId: day.id,
      isWorkingDay: !day.isWorkingDay,
      startTime: nextHours.startTime,
      endTime: nextHours.endTime,
    });

    await loadDentistsAvailability();
    showSuccess(
      day.isWorkingDay
        ? `${dentist.name} day slots turned off`
        : `${dentist.name} day slots turned on (${nextHours.startTime} - ${nextHours.endTime})`,
    );
  } catch (error) {
    showError(
      error?.message ||
        `Unable to update day slots for ${dentist?.name || "this practitioner"}`,
    );
  }
}

const prevDay = () => {
  const d = new Date(date.value);
  d.setDate(d.getDate() - 1);
  date.value = d;
};
const nextDay = () => {
  const d = new Date(date.value);
  d.setDate(d.getDate() + 1);
  date.value = d;
};
const datePickerOpen = ref(false);
const onPickerDate = (val) => {
  // v-date-picker emits a YYYY-MM-DD string
  if (val) date.value = new Date(val);
  datePickerOpen.value = false;
};
// Inside your script section
const formattedDate = computed(() => {
  if (!dateStr.value) return "";
  const date = new Date(dateStr.value);
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
});

// Function to reset to today
const goToToday = () => {
  const today = new Date().toISOString().substr(0, 10);
  onPickerDate(today);
};

const filters = ref({});
function onFilters(f) {
  filters.value = f || {};
  if (f?.date) {
    try {
      date.value = new Date(f.date);
    } catch {}
  }
  loadDentists().then(loadAppointments);
}

// Appointment modal coordination
const showAppointment = ref(false);
const modalTime = ref("09:00");
const modalDuration = ref(15);
const modalDentist = ref(null);
const editingAppointment = ref(null);
const showNotes = ref(false);
const notesDentist = ref(null);
const preselectedPatientName = ref("");
const preselectedPatientId = ref(null);
const patientOptions = ref([]); // [{ id, name }]

function openAppointment({ dentist, hour, minute, duration }) {
  editingAppointment.value = null;
  modalDentist.value = dentist;
  modalTime.value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  modalDuration.value = Number(duration) || 15;
  preselectedPatientId.value = null;
  preselectedPatientName.value = "";
  showAppointment.value = true;
}

// Add this method to update badge count
const updateClipboardBadge = (count) => {
  clipboardDraftCount.value = count;
};
const onClipboardDraftRemoved = () => {
  if (clipboardPanelRef.value) {
    clipboardDraftCount.value = clipboardPanelRef.value.getDraftCount();
  }
};
// Add these methods
function onSaveToClipboard(draftData) {
  if (clipboardPanelRef.value) {
    clipboardPanelRef.value.addDraft(draftData);
    showSuccess("Appointment saved to clipboard");
    // clipboardDraftCount.value = clipboardPanelRef.value.drafts.length;
    // showClipboardPanel.value = true; // Open the drawer when saving
  }
}

function onUseDraftFromClipboard(draft) {
  // Pre-fill the appointment modal with draft data
  modalDentist.value =
    dentists.value.find(
      (d) =>
        String(d.id) === String(draft.practitioner) ||
        d.name === draft.practitioner,
    ) || null;
  modalTime.value = draft.time;
  modalDuration.value = draft.duration;
  preselectedPatientId.value = draft.patientId;
  preselectedPatientName.value = draft.patient;

  // Set other draft data for editing
  editingAppointment.value = {
    ...draft,
    start: draft.time,
    duration: draft.duration,
    treatmentName: draft.treatmentName || draft.exam,
  };

  showAppointment.value = true;
}

const onCreateFromDraft = ({ draft, dentistId, date, start, duration }) => {
  const dentist = dentists.value.find(
    (d) => String(d.id) === String(dentistId),
  );
  if (!dentist) return;

  const payload = {
    dentistId: dentist.id,
    patientId: draft.patientId || null,
    patientName: draft.patient || "",
    date: date,
    time: start,
    duration: duration || draft.duration || 15,
    treatmentId: draft.treatmentId || null,
    treatmentName: draft.treatmentName || draft.exam || null,
    status: "Pending",
    notes: draft.notes || "",
  };

  diaryStore
    .createAppointment(payload)
    .then(() => {
      showSuccess("Appointment created from draft");
      loadAppointments();

      // Remove the draft from clipboard after successful scheduling
      if (
        clipboardPanelRef.value &&
        typeof clipboardPanelRef.value.removeDraft === "function"
      ) {
        clipboardPanelRef.value.removeDraft(draft.id);
        clipboardDraftCount.value = clipboardPanelRef.value.getDraftCount();
      }
    })
    .catch((e) => {
      const msg =
        e?.message || e?.data?.message || "Failed to create appointment";
      showError(msg);
    });
};

function onSlotFull({ dentist, hour, message, unavailable, outOfHours }) {
  // Use the specific message if provided (from availability checks)
  if (message) {
    showError(message);
    return;
  }
  
  // Default message for slots that are full
  const hLabel =
    hour === 0
      ? "12AM"
      : hour < 12
        ? `${hour}AM`
        : hour === 12
          ? "12PM"
          : `${hour - 12}PM`;
  showError(
    `No available 15-min slots at ${hLabel} for ${dentist?.name || "this dentist"}`,
  );
}

function onOpenNotes(dentist) {
  notesDentist.value = dentist;
  showNotes.value = true;
}

/**
 * Handles extending/shortening an appointment duration via dragging the bottom handle
 * @param {Object} resize - { appointmentId, newEnd, dentistId }
 */
// Update onResizeAppointment function
function onResizeAppointment({ appointmentId, newEnd, dentistId }) {
  // 1. Find the existing appointment in our local state to get the start time
  const dentistAppts = appointmentsByDentist[dentistId] || [];
  const appt = dentistAppts.find((a) => String(a.id) === String(appointmentId));

  if (!appt) return;

  // 2. Calculate new duration in minutes
  const startMinutes = clinicMinutesFromTime(appt.start);
  const endMinutes = clinicMinutesFromTime(newEnd);

  if (endMinutes <= startMinutes) {
    showError("End time must be after start time");
    return;
  }

  const newDuration = endMinutes - startMinutes;
  
  // Set dragging/resizing flag
  isDraggingOrResizing.value = true;

  // 3. Call the store to update the duration
  diaryStore
    .updateAppointment({
      id: appointmentId,
      duration: newDuration,
      // We send start time and date just to be safe/consistent with the API
      time: appt.start,
      date: appt.date || dateStr.value,
    })
    .then(() => {
      // 4. Update local state immediately for snappy UI
      appt.end = newEnd;
      showSuccess("Appointment duration updated");

      // Reset flag after a short delay
      setTimeout(() => {
        isDraggingOrResizing.value = false;
      }, 300);
      
      // Optional: reload to ensure sync with server
      loadAppointments();
    })
    .catch((e) => {
      const msg = e?.message || "Failed to extend appointment";
      showError(msg);
      isDraggingOrResizing.value = false;
    });
}

// Update onOpenExistingAppointment to check the flag
function onOpenExistingAppointment({ appt, dentist }) {
  // If we're in the middle of a drag/resize operation, don't navigate
  if (isDraggingOrResizing.value) {
    return;
  }
  
  // If appointment is linked to a patient, navigate to Patient Journey view
  if (appt.patientId) {
    router.push({
      path: `/patients/${appt.patientId}`,
      query: { tab: "journey" },
    });
    return;
  }

  // Fallback to existing edit modal if no patient is linked
  editingAppointment.value = {
    id: appt.id,
    patientId: appt.patientId,
    patient: appt.patient,
    date: appt.date || dateStr.value,
    start: appt.start,
    end: appt.end,
    duration: Math.max(
      15,
      (clinicMinutesFromTime(appt.end) || 0) -
        (clinicMinutesFromTime(appt.start) || 0),
    ),
    status: appt.status,
    treatmentName: appt.treatmentName,
    notes: appt.notes || "",
    practitioner: dentist?.name || "",
  };
  modalDentist.value = dentist || null;
  modalTime.value = appt.start || modalTime.value;
  preselectedPatientId.value = appt.patientId || null;
  preselectedPatientName.value = appt.patient || "";
  showAppointment.value = true;
}

// Add patient button in header
const showAddPatient = ref(false);
function onPatientSaved(p) {
  diaryStore.createPatient(p).then((res) => {
    const name = `${p.firstName} ${p.lastName}`.trim();
    preselectedPatientName.value = name;
    const id = res?.data?.id;
    preselectedPatientId.value = id;
    if (name) patientOptions.value.unshift({ id, name });
    showAddPatient.value = false;
    showAppointment.value = true;
  });
}

function onAddPatientFromAppointment() {
  showAppointment.value = false;
  showAddPatient.value = true;
}

function onSaveAppointment(appt) {
  if (appt.id) {
    const apptDate = appt.date || dateStr.value;
    const apptTime = appt.time || modalTime.value;
    const apptDuration = Number(appt.duration || 15);
    const dentistId =
      appt.dentistId ||
      modalDentist.value?.id ||
      editingAppointment.value?.dentistId;
    diaryStore
      .updateAppointment({
        id: appt.id,
        dentistId,
        date: apptDate,
        time: apptTime,
        duration: apptDuration,
        status: appt.status,
        notes: appt.notes,
        treatmentName: appt.treatmentName || appt.exam,
        patientId: appt.patientId || preselectedPatientId.value || null,
      })
      .then(() => {
        showSuccess("Appointment updated");
        editingAppointment.value = null;
        loadAppointments();
      })
      .catch((e) => {
        const msg =
          e?.message || e?.data?.message || "Failed to update appointment";
        showError(msg);
      });
  } else {
    const dentistId = appt.dentistId || modalDentist.value?.id;
    if (!dentistId) return;
    const payload = {
      dentistId,
      patientId: appt.patientId || preselectedPatientId.value || null,
      patientName: appt.patient || preselectedPatientName.value,
      date: appt.date || dateStr.value,
      time: appt.time || modalTime.value,
      duration: appt.duration || 10,
      treatmentId: appt.treatmentId || null,
      treatmentName: appt.treatmentName || null,
      status: appt.status || "Pending",
      notes: appt.notes || "",
    };
    diaryStore
      .createAppointment(payload)
      .then(() => {
        showSuccess("Appointment created");
        loadAppointments();
      })
      .catch((e) => {
        const msg =
          e?.message || e?.data?.message || "Failed to create appointment";
        showError(msg);
      });
  }
}

async function loadDentists() {
  dentistsLoading.value = true;
  try {
    const res = await diaryStore.listDentists(dateStr.value);
    if (res?.code === 0) dentists.value = res.data || [];
    dentistsLoading.value = false;
    // Keep selection valid
    selectedDentistIds.value = (selectedDentistIds.value || []).filter((id) =>
      (dentists.value || []).some((d) => String(d.id) === String(id)),
    );
    
    // Load availability for each dentist
    await loadDentistsAvailability();
    return res;
  } catch (error) {
    dentistsLoading.value = false;
    console.error("Failed to load dentists:", error);
    throw error;
  }
}

async function loadZones() {
  try {
    await zonesStore.fetchZones();
  } catch (error) {
    console.error("Failed to load zones:", error);
  }
}

/**
 * Load and calculate availability for all dentists on the selected date
 */
async function loadDentistsAvailability() {
  const orgId = user.value?.currentLoggedInOrgId || user.value?.organisationId;
  if (!orgId || !dentists.value.length) return;

  const newAvailability = {};

  for (const dentist of dentists.value) {
    try {
      // Load schedules for this dentist
      await loadDentistSchedules(orgId, dentist.id);
      
      // Check availability on the selected date
      const isAvailable = isAvailableOnDate(dateStr.value);
      const workingHours = isAvailable ? getWorkingHoursForDate(dateStr.value) : null;
      const message = getAvailabilityMessage(dateStr.value, { name: dentist.name });

      newAvailability[dentist.id] = {
        isAvailable,
        workingHours,
        message,
      };
    } catch (error) {
      console.error(`Failed to load availability for dentist ${dentist.id}:`, error);
      newAvailability[dentist.id] = {
        isAvailable: false,
        workingHours: null,
        message: `Could not load availability for ${dentist.name}`,
      };
    }
  }

  dentistAvailability.value = newAvailability;
}

function buildWeekDates() {
  const base = new Date(date.value);
  const day = base.getDay();
  const diff = (day + 6) % 7; // Monday index
  const start = new Date(base);
  start.setDate(base.getDate() - diff);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days.map((d) => dateToLocalYMD(d));
}

function loadAppointments() {
  const seq = ++appointmentsLoadSeq;
  const dates = view.value === "week" ? buildWeekDates() : [dateStr.value];
  const promises = [];
  const selected = filters.value.dentistId
    ? (dentists.value || []).filter(
        (d) => String(d.id) === String(filters.value.dentistId),
      )
    : selectedDentistIds.value && selectedDentistIds.value.length
      ? dentists.value.filter((d) =>
          selectedDentistIds.value.map(String).includes(String(d.id)),
        )
      : dentists.value || [];
  for (const dnt of selected) {
    for (const d of dates) {
      promises.push(
        diaryStore
          .listAppointments({
            date: d,
            dentistId: dnt.id,
            status: filters.value.status || null,
            treatmentId: filters.value.treatmentId || null,
            search: search.value || "",
          })
          .then((r) => ({
            key: dnt.id,
            rows: (r?.data || []).map((x) => ({ ...x, date: d })),
          })),
      );
    }
  }
  Promise.all(promises).then((results) => {
    if (seq !== appointmentsLoadSeq) return;
    const nextMap = {};
    results.forEach(({ key, rows }) => {
      if (!nextMap[key]) nextMap[key] = [];
      nextMap[key].push(
        ...rows.map((r) => ({
          id: r.id,
          patientId: r.patientId,
          patient: r.patient,
          start: r.start,
          end: r.end,
          status: r.status,
          treatmentName: r.treatmentName,
          notes: r.notes,
          date: r.date,
          dentistId: r.dentistId,
        })),
      );
    });
    // replace once new data ready to avoid flicker
    Object.keys(appointmentsByDentist).forEach(
      (k) => delete appointmentsByDentist[k],
    );
    Object.entries(nextMap).forEach(([k, list]) => {
      appointmentsByDentist[k] = list;
      sortAppointmentsForDentist(k);
    });
  });
}

function sortAppointmentsForDentist(dentistId) {
  const list = appointmentsByDentist[dentistId];
  if (!list) return;
  appointmentsByDentist[dentistId] = list
    .slice()
    .sort(
      (a, b) =>
        (clinicMinutesFromTime(a.start || a.startTime) || 0) -
        (clinicMinutesFromTime(b.start || b.startTime) || 0),
    );
}

function onUpdateStatus({ appt, status, dentistId }) {
  diaryStore
    .updateAppointment({ id: appt.id, status })
    .then(() => {
      showSuccess("Appointment updated");
      loadAppointments();
    })
    .catch((e) => {
      const msg =
        e?.message || e?.data?.message || "Failed to update appointment";
      showError(msg);
    });
}

function applyLocalMove({ appointmentId, from, to, appointment }) {
  const id = appointmentId || appointment?.id;
  if (!id) return;
  const fromDentistId = from?.dentistId;
  const toDentistId = to?.dentistId;
  const fromList =
    fromDentistId && appointmentsByDentist[fromDentistId]
      ? appointmentsByDentist[fromDentistId]
      : [];
  const idx = fromList.findIndex((a) => String(a.id) === String(id));
  const base = idx >= 0 ? fromList[idx] : { ...appointment, id };
  // Remove from original list (immutably for reactivity)
  if (fromDentistId && appointmentsByDentist[fromDentistId]) {
    appointmentsByDentist[fromDentistId] = appointmentsByDentist[
      fromDentistId
    ].filter((a) => String(a.id) !== String(id));
  }
  const next = {
    ...base,
    start: to?.start || base.start,
    end: to?.end || base.end,
    date: to?.date || base.date,
    dentistId: to?.dentistId || base.dentistId,
  };
  const toList =
    toDentistId && appointmentsByDentist[toDentistId]
      ? appointmentsByDentist[toDentistId]
      : [];
  appointmentsByDentist[toDentistId] = [
    ...toList.filter((a) => String(a.id) !== String(id)),
    next,
  ];
  sortAppointmentsForDentist(toDentistId);
}

// Update the onMoveAppointment function
function onMoveAppointment(move) {
  const id = move?.appointmentId || move?.appointment?.id;
  if (!id) {
    showError("Unable to move appointment: missing id");
    return;
  }
  const target = move?.to || {};
  if (!target?.dentistId || !target?.start || !target?.end) {
    showError("Unable to move appointment: target slot missing data");
    return;
  }
  const targetDate = target.date || dateStr.value;
  const startMinutes = clinicMinutesFromTime(target.start);
  const endMinutes = clinicMinutesFromTime(target.end);
  if (
    startMinutes === null ||
    endMinutes === null ||
    endMinutes <= startMinutes
  ) {
    showError("Unable to move appointment: invalid target time");
    return;
  }
  const duration = endMinutes - startMinutes;
  
  // Set dragging flag
  isDraggingOrResizing.value = true;
  
  diaryStore
    .updateAppointment({
      id,
      dentistId: target.dentistId,
      date: targetDate,
      time: target.start,
      duration,
    })
    .then(() => {
      applyLocalMove(move);
      sortAppointmentsForDentist(target.dentistId);
      showSuccess("Appointment moved");
      
      // Reset flag after a short delay
      setTimeout(() => {
        isDraggingOrResizing.value = false;
      }, 300);
    })
    .catch((e) => {
      const msg =
        e?.message || e?.data?.message || "Failed to move appointment";
      showError(msg);
      isDraggingOrResizing.value = false;
    });
}
function clearSearch() {
  search.value = "";
  loadAppointments();
}

// Replace both onMounted blocks with this single one:
onMounted(() => {
  applyRouteQuery(route.query);
  loadDentists().then(loadAppointments);
  loadZones();
  organisationStore.listTreatments().then((res) => {
    if (res?.code === 0) treatments.value = res.data || [];
  });

  // Load patients for autocomplete
  diaryStore.listPatients("").then((res) => {
    if (res?.code === 0) {
      patientOptions.value = (res.data || [])
        .map((p) => ({
          id: p.id,
          name: `${p.firstName || ""} ${p.lastName || ""}`.trim(),
        }))
        .filter((x) => x.name);
    }
  });

  // Initialize badge count - use setTimeout to ensure ref is ready
  setTimeout(() => {
    if (clipboardPanelRef.value) {
      clipboardDraftCount.value = clipboardPanelRef.value.getDraftCount();
    }
  }, 100);
});
watch(dateStr, () => {
  loadDentists().then(loadAppointments);
});
watch(view, () => {
  loadDentists().then(loadAppointments);
});
watch(
  () => route.query,
  (query) => {
    applyRouteQuery(query);
  },
  { deep: true }
);
</script>

<style scoped lang="scss">
.cust-border {
  border-bottom: 1px solid #dbdbdb;
  padding: 17px;
  p {
    font-size: 12px;
  }
}
.custom-toggle {
  background-color: #f3f6fa;
  height: 40px;
  min-height: 40px;
  border-radius: 8px;
  padding: 3px;
  gap: 2px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.custom-toggle :deep(.v-btn) {
  background-color: #f3f6fa !important;
  text-transform: none;
  font-size: 14px;
  color: #333;
  transition: all 0.2s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 34px;
  min-height: 34px;
  margin: 0;
}

.custom-toggle :deep(.v-btn:first-child) {
  border-top-left-radius: 6px;
  border-bottom-left-radius: 6px;
}

.custom-toggle :deep(.v-btn:last-child) {
  border-top-right-radius: 6px;
  border-bottom-right-radius: 6px;
}

.custom-toggle :deep(.v-btn .v-btn__content) {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.custom-toggle :deep(.v-btn img) {
  display: block;
  flex-shrink: 0;
}

.custom-toggle :deep(.v-btn--active) {
  background-color: #ffffff !important;
  --v-theme-overlay-multiplier: 0 !important;
  --v-theme-primary: #ffffff !important;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.08);
  border-radius: 6px;
}

.date-label-btn {
  display: inline-flex;
  align-items: center;
  background: none;
  border: none;
  border-radius: 8px;
  padding: 4px 8px;
  cursor: pointer;
  transition: background 0.15s;
  &:hover {
    background: #f0f4fa;
  }
}
.custom-search {
  height: 46px;
  border-radius: 8px;
  font-size: 14px;
  background-color: #f3f4f6 !important;
  text-transform: none;
  box-shadow: none;
  color: #737373;
  margin-left: 16px !important;
  align-items: center;
}

.custom-search :deep(input::placeholder) {
  color: #737373;
  opacity: 1;
}
.dropdown-label {
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  white-space: nowrap;
}
.date-picker-trigger {
  transition: background-color 0.2s ease;
  cursor: pointer;
  border: 1px solid transparent;
}

.date-picker-trigger:hover {
  background-color: #f3f4f6;
  border-color: #e5e7eb;
}

.date-picker-trigger span {
  white-space: nowrap;
}
/* Skeleton Loading Styles */
.calendar-skeleton {
  background: #fff;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  height: 72vh;
}

.skeleton-header {
  display: flex;
  background: #f6f7fb;
  border-bottom: 1px solid #e5e7eb;
}
.position-relative {
  position: relative;
}

.clipboard-badge {
  position: absolute;
  top: -8px;
  right: -8px;

  :deep(.v-badge__badge) {
    font-size: 11px;
    height: 18px;
    min-width: 18px;
    padding: 0 5px;
  }
}
.skeleton-time-col {
  width: 72px;
  padding: 10px;
}

.skeleton-dentist-cols {
  display: flex;
  flex: 1;
  gap: 1px;
  background: #e5e7eb;
}

.skeleton-dentist-col {
  flex: 1;
  min-width: 260px;
  background: #f6f7fb;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
}

.skeleton-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

.skeleton-text {
  width: 120px;
  height: 16px;
  background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
}

.skeleton-grid {
  background: #eef2f7;
}

.skeleton-row {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
}

.skeleton-time-cell {
  width: 72px;
  padding: 8px 8px 0 0;
  background: linear-gradient(180deg, #f6f7fb 0%, #fff 70%);
  height: 170px;
}

.skeleton-slots {
  display: flex;
  flex: 1;
  gap: 1px;
  background: #e5e7eb;
}

.skeleton-slot-cell {
  flex: 1;
  min-width: 260px;
  background: #fff;
  padding: 6px 8px;
}

.skeleton-micro-slots {
  display: grid;
  grid-template-rows: repeat(4, 36px);
  gap: 3px;
}

.skeleton-micro-slot {
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 5px;
  height: 36px;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.clipboard-badge {
  position: absolute;
  top: -8px;
  right: -8px;
}

.position-relative {
  position: relative;
}

.with-clipboard-panel {
  padding-right: 360px;
  transition: padding-right 0.25s ease;
}
</style>
