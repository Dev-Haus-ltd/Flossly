<!-- components/diary/calendar/index.vue (updated with clipboard drag drop support) -->
<template>
  <div class="calendar-wrap">
    <!-- Day mode -->
    <template v-if="view === 'day'">
      <div class="calendar-grid" :style="{ '--cols': visibleDentists.length }">
        <!-- Top-left head cell -->
        <div class="time-head" style="grid-row: 1; grid-column: 1"></div>

        <!-- Dentist headers -->
        <div
          v-for="(dent, ci) in visibleDentists"
          :key="'h-' + dent.id"
          class="dentist-head"
          :class="{
            'dentist-unavailable': !dentistAvailability[dent.id]?.isAvailable,
          }"
          :style="{ gridRow: 1, gridColumn: ci + 2 }"
        >
          <div class="avatar">{{ initials(dent?.name) }}</div>
          <div class="dentist-head-text">
            <div class="name">{{ dent.name }}</div>
            <div class="subtitle">
              <span v-if="dentistAvailability[dent.id]?.isAvailable">
                Today:
                {{
                  filterNonDraftAppointments(appointments[dent.id] || []).length
                }}
                patient(s)
              </span>
              <span v-else class="text-error">
                {{ dentistAvailability[dent.id]?.message || "Not available" }}
              </span>
            </div>
          </div>
          <div class="header-actions">
            <v-btn
              icon="mdi-file-outline"
              size="x-small"
              variant="text"
              @click="$emit('open-notes', dent)"
            />
            <v-btn icon="mdi-dots-horizontal" size="x-small" variant="text" />
          </div>
        </div>

        <!-- Hour rows -->
        <template v-for="(t, ri) in timeSlots" :key="t.key">
          <!-- Time label -->
          <div class="time-cell" :style="{ gridRow: ri + 2, gridColumn: 1 }">
            {{ t.label }}
          </div>

          <!-- Dentist slot cells -->
          <div
            v-for="(dent, ci) in visibleDentists"
            :key="dent.id + '-' + t.key"
            class="slot-cell"
            :class="{
              'slot-full': isHourFull(dent.id, t.hour),
              'slot-disabled': isSlotDisabled(dent.id, t.hour),
              'slot-hover':
                dragCreate.active &&
                dragCreate.dentistId === dent.id &&
                isHourInDragRange(t.hour),
              'drop-hover': isHoverSlot(dent.id, t.hour),
              'clipboard-hover': isClipboardDropTarget(dent.id, t.hour),
            }"
            :style="{ gridRow: ri + 2, gridColumn: ci + 2 }"
            :data-dentist-id="dent.id"
            :data-hour="t.hour"
            @click="onCellClickGuard(dent, t)"
            @mousedown="onSlotMouseDown($event, dent, t)"
            @mouseup="onSlotMouseUp($event, dent, t)"
            @dragover.prevent="onSlotDragOver($event)"
            @dragenter.prevent="onSlotDragEnter($event, dent, t)"
            @dragleave="onSlotDragLeave($event, dent, t)"
            @drop="onAppointmentDrop($event, dent, t)"
          >
            <div class="slot-grid">
              <template v-for="i in MICRO_PER_HR" :key="i">
                <div class="empty-micro-slot"></div>
              </template>

              <AppointmentCard
                v-for="appt in getHourAppointments(dent.id, t.hour)"
                :key="appt.id"
                :appt="appt"
                :compact="isShortAppointment(appt)"
                :style-obj="apptCardStyle(appt)"
                :status-colors="statusColors"
                :override-start="
                  resizing.active && resizing.appt?.id === appt.id
                    ? toHHMM(resizing.curStart)
                    : null
                "
                :override-end="
                  resizing.active && resizing.appt?.id === appt.id
                    ? toHHMM(resizing.curEnd)
                    : null
                "
                @update-status="
                  $emit('update-status', {
                    appt,
                    status: $event,
                    dentistId: dent.id,
                  })
                "
                @open-patient="openPatient"
                @open-appointment="
                  $emit('open-appointment', { appt, dentist: dent })
                "
                @resize-start="onResizeStart($event, dent)"
                draggable="true"
                @dragstart="onAppointmentDragStart($event, appt, dent.id)"
                @dragend="onAppointmentDragEnd"
                @click.stop
                class="appointment-overlay"
              />

              <!-- Drag-create ghost preview -->
              <div
                v-if="
                  dragCreate.active &&
                  dragCreate.dentistId === dent.id &&
                  getDragCreateGhostStyle(t.hour)
                "
                class="drag-create-ghost"
                :style="getDragCreateGhostStyle(t.hour)"
              >
                <span class="ghost-label">{{ dragCreateLabel }}</span>
              </div>

              <!-- Clipboard drop indicator -->
              <div
                v-if="isClipboardDropTarget(dent.id, t.hour)"
                class="clipboard-drop-indicator"
              >
                <span class="drop-label">Drop here</span>
              </div>

              <!-- Break overlay -->
              <!-- <div v-if="getBreakAtHour(dent.id, t.hour)" class="break-overlay"> -->
              <div
                v-if="getBreakAtHour(dent.id, t.hour)"
                class="break-overlay"
                :style="getBreakAtHour(dent.id, t.hour).style"
              >
                <div class="break-content">
                  <span class="break-label">{{
                    getBreakAtHour(dent.id, t.hour)?.name
                  }}</span>
                  <span class="break-timing"
                    >{{ getBreakAtHour(dent.id, t.hour)?.startTime }} -
                    {{ getBreakAtHour(dent.id, t.hour)?.endTime }}</span
                  >
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </template>

    <!-- Week mode (unchanged layout) -->
    <template v-else>
      <div v-for="(d, di) in weekDates" :key="d" class="week-day-section">
        <div class="week-day-header">{{ weekLabels[di] }}</div>
        <div class="grid" :style="{ '--cols': visibleDentists.length }">
          <div class="time-col">
            <div v-for="t in timeSlots" :key="t.key" class="time-cell">
              {{ t.label }}
            </div>
          </div>
          <div
            class="dentist-col"
            v-for="dent in visibleDentists"
            :key="dent.id"
          >
            <div class="dentist-header">
              <div class="avatar" />
              <div class="name">{{ dent.name }}</div>
            </div>
            <div class="slot-col" :style="{ height: columnHeight + 'px' }">
              <div
                v-for="t in timeSlots"
                :key="t.key"
                class="slot-cell"
                @click="onCellClick(dent, t)"
              />
              <div class="appt-layer">
                <div
                  v-if="isToday(d)"
                  class="now-line"
                  :style="{ top: nowTop + '%' }"
                ></div>
                <div
                  v-for="(appt, i) in filterNonDraftAppointments(
                    appointments[dent.id] || [],
                  ).filter((a) => a.date === d)"
                  :key="i"
                  class="appt"
                  :style="{
                    ...appointmentStyle(appt),
                    ...apptStyleFor(appt.status),
                  }"
                  @click.stop="openPatient(appt)"
                >
                  <div class="appt-title">{{ appt.patient }}</div>
                  <div class="appt-time">{{ appt.start }} - {{ appt.end }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Resize overlay (invisible, covers viewport during resize) -->
    <div
      v-if="resizing.active"
      class="resize-overlay"
      @mousemove="onResizeMove"
      @mouseup="onResizeEnd"
    ></div>
  </div>
</template>

<script setup>
import AppointmentCard from "@/components/diary/calendar/AppointmentCard.vue";
import { clinicMinutesFromTime, formatDateDDMMYYYY } from "@/lib/dateFormatter";

const props = defineProps({
  date: { type: [String, Date], required: true },
  view: { type: String, default: "day" },
  dentists: { type: Array, default: () => [] },
  selectedDentistIds: { type: Array, default: () => [] },
  appointments: { type: Object, default: () => ({}) },
  dentistAvailability: { type: Object, default: () => ({}) },
});

const emit = defineEmits([
  "slot-click",
  "update-status",
  "open-notes",
  "slot-full",
  "move-appointment",
  "open-appointment",
  "create-appointment",
  "create-from-draft",
]);

const router = useRouter();

// ─── Constants ────────────────────────────────────────────────────────────────
const WORK_START = 9;
const WORK_END = 17;
const INTERVAL_MINS = 15; // 1 micro-slot = 15 min
const MICRO_PER_HR = 4; // 4 micro-slots per hour row
const DRAG_MIME = "application/x-flossly-appointment";
const CLIPBOARD_MIME = "application/x-flossly-draft";

const isClipboardDataTransfer = (event) => {
  if (!event?.dataTransfer) return false;
  const types = event.dataTransfer.types || [];

  // Check for our custom MIME type
  if (types.includes(CLIPBOARD_MIME)) return true;

  // Also check text/plain for clipboard drafts
  try {
    const raw = event.dataTransfer.getData("text/plain");
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed?.type === "clipboard-draft";
    }
  } catch {
    return false;
  }
  return false;
};
// ─── Clipboard drop state ─────────────────────────────────────────────────────
const clipboardDropTarget = ref({ dentistId: null, hour: null });

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toMins = (t) => {
  const m = clinicMinutesFromTime(t);
  return typeof m === "number" ? m : 0;
};
const toHHMM = (m) => {
  if (!Number.isFinite(m)) return "00:00";
  const n = Math.max(0, Math.round(m));
  return `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
};
const initials = (name) => {
  if (!name) return "";
  const p = String(name).trim().split(" ");
  return p.length === 1
    ? p[0][0].toUpperCase()
    : (p[0][0] + p[p.length - 1][0]).toUpperCase();
};
const normDate = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? typeof v === "string"
      ? v.slice(0, 10)
      : null
    : d.toISOString().slice(0, 10);
};
const isToday = (ds) => ds === new Date().toISOString().slice(0, 10);

// ─── Derived ──────────────────────────────────────────────────────────────────
const activeDate = computed(() => normDate(props.date));
const visibleDentists = computed(() => {
  const ids = (props.selectedDentistIds || []).map(String);
  return ids.length
    ? props.dentists.filter((d) => ids.includes(String(d.id)))
    : props.dentists;
});

const timeSlots = computed(() => {
  const s = [];
  for (let h = WORK_START; h <= WORK_END; h++) {
    const label =
      h === 0 ? "12AM" : h < 12 ? `${h}AM` : h === 12 ? "12PM" : `${h - 12}PM`;
    s.push({
      key: `${String(h).padStart(2, "0")}:00`,
      hour: h,
      minute: 0,
      label,
    });
  }
  return s;
});

const weekDates = computed(() => {
  const base = new Date(props.date);
  const diff = (base.getDay() + 6) % 7;
  const start = new Date(base);
  start.setDate(base.getDate() - diff);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
});
const weekLabels = computed(() =>
  weekDates.value.map((d) => formatDateDDMMYYYY(d)),
);
const columnHeight = computed(() => (WORK_END - WORK_START) * 100);
const nowTop = computed(() => {
  const now = new Date();
  const m = now.getHours() * 60 + now.getMinutes();
  const total = Math.max(1, WORK_END - WORK_START) * 60;
  return ((m - WORK_START * 60) / total) * 100;
});

// short Appointments (for compact chip display)
const isShortAppointment = (appt) => {
  // Check if this appointment is being resized
  const isResizingThisAppt = resizing.active && resizing.appt?.id === appt.id;
  const duration = isResizingThisAppt
    ? resizing.curEnd - resizing.curStart
    : apptEnd(appt) - apptStart(appt);
  return duration <= INTERVAL_MINS; // 15 minutes or less is considered short
};

// ─── Status colours ───────────────────────────────────────────────────────────
// In components/diary/calendar/index.vue
// Add Draft to statusColors
const statusColors = {
  // Draft: {
  //   // Add this new status
  //   bg: "#f5f5f5",
  //   border: "#e0e0e0",
  //   chip: "#9e9e9e",
  //   text: "#424242",
  // },
  Pending: {
    bg: "#fceaf6",
    border: "#f4c3df",
    chip: "#d948a8",
    text: "#37223b",
  },
  Confirmed: {
    bg: "#ede8ff",
    border: "#cfc2ff",
    chip: "#6d4aff",
    text: "#2d2565",
  },
  Arrived: {
    bg: "#e8f0ff",
    border: "#c7d8ff",
    chip: "#397bff",
    text: "#1b3260",
  },
  "In Surgery": {
    bg: "#e5fbf8",
    border: "#baf2eb",
    chip: "#00b2a5",
    text: "#11413b",
  },
  Complete: {
    bg: "#e5fbea",
    border: "#b8f1c8",
    chip: "#23b96d",
    text: "#163b2b",
  },
  Cancelled: {
    bg: "#ffeaea",
    border: "#ffbcbc",
    chip: "#ff5353",
    text: "#441d1d",
  },
  "Did not attend": {
    bg: "#fff2e0",
    border: "#ffd4a3",
    chip: "#ffa12e",
    text: "#573a0d",
  },
};
const apptStyleFor = (status) => {
  const c = statusColors[status] || statusColors["Pending"];
  return { background: c.bg, borderColor: c.border, color: c.text };
};

// ─── Availability helpers ─────────────────────────────────────────────────────
/**
 * Convert time string to minutes from midnight
 * @param {String} time - "HH:MM" format
 * @returns {Number}
 */
const timeToMinutes = (time) => {
  if (!time) return 0;
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + (minutes || 0);
};

/**
 * Check if a dentist is available on the displayed date
 */
const isDentistAvailable = (dentistId) => {
  return props.dentistAvailability[dentistId]?.isAvailable === true;
};

/**
 * Check if a specific time slot is within the dentist's working hours
 */
const isSlotWithinWorkingHours = (dentistId, hour, minute = 0) => {
  const availability = props.dentistAvailability[dentistId];
  if (!availability?.isAvailable || !availability?.workingHours) return false;

  const slotMinutes = hour * 60 + minute;
  const workStart = timeToMinutes(availability.workingHours.startTime);
  const workEnd = timeToMinutes(availability.workingHours.endTime);

  // Check if slot start is within working hours (slot starts before end time)
  // This allows the last hour slot to be available
  return slotMinutes >= workStart && slotMinutes <= workEnd;
};

/**
 * Check if a time slot overlaps with a break period
 * @param {Number} dentistId
 * @param {Number} hour - The hour to check
 * @returns {Object|null} - Break info or null if no break
 */
const formatTo12Hour = (time) => {
  if (!time) return "";

  const [hours, minutes] = time.split(":").map(Number);

  const period = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 || 12; // convert 0 -> 12

  return `${formattedHours}:${minutes.toString().padStart(2, "0")} ${period}`;
};
const getBreakAtHour = (dentistId, hour) => {
  const availability = props.dentistAvailability[dentistId];
  if (!availability?.isAvailable || !availability?.workingHours?.breaks)
    return null;

  const slotStart = hour * 60;
  const slotEnd = (hour + 1) * 60;

  for (const breakPeriod of availability.workingHours.breaks) {
    const breakStart = timeToMinutes(breakPeriod.startTime);
    const breakEnd = timeToMinutes(breakPeriod.endTime);

    if (slotStart < breakEnd && slotEnd > breakStart) {
      // 👇 calculate exact overlap inside this hour
      const overlapStart = Math.max(slotStart, breakStart);
      const overlapEnd = Math.min(slotEnd, breakEnd);

      const top = ((overlapStart - slotStart) / 60) * 100;
      const height = ((overlapEnd - overlapStart) / 60) * 100;

      return {
        name: breakPeriod.breakName || "Break",
        startTime: formatTo12Hour(breakPeriod.startTime),
        endTime: formatTo12Hour(breakPeriod.endTime),

        // ✅ NEW
        style: {
          top: `${top}%`,
          height: `${height}%`,
        },
      };
    }
  }
  return null;
};
/**
 * Check if a time slot should be disabled
 */
const isSlotDisabled = (dentistId, hour) => {
  // If dentist not available at all, disable all slots
  if (!isDentistAvailable(dentistId)) return true;

  // Check if hour is within working hours
  if (!isSlotWithinWorkingHours(dentistId, hour)) return true;

  // Check if slot is during a break
  return !!getBreakAtHour(dentistId, hour);
};

// ─── Appointment helpers ──────────────────────────────────────────────────────
const apptStart = (appt) => toMins(appt?.start || appt?.startTime);
const apptEnd = (appt) => toMins(appt?.end || appt?.endTime);

function getAppointmentsOverlappingHour(dentistId, hour) {
  const hourStart = hour * 60;
  const hourEnd = (hour + 1) * 60;
  return filterNonDraftAppointments(props.appointments[dentistId] || [])
    .filter((appt) => {
      if (!appt?.start && !appt?.startTime) return false;
      const s = apptStart(appt);
      const e = apptEnd(appt);
      return s < hourEnd && e > hourStart;
    })
    .sort((a, b) => apptStart(a) - apptStart(b));
}


// Add this helper function to filter out draft appointments
const filterNonDraftAppointments = (appointmentsList) => {
  if (!appointmentsList) return [];
  return appointmentsList.filter((appt) => appt.status !== "Draft");
};
const isDentistBookable = (dentistId, hour = null) => {
  // dentist must exist and be available
  if (!isDentistAvailable(dentistId)) return false;

  // if hour is provided, also check working hours + breaks
  if (hour !== null && isSlotDisabled(dentistId, hour)) return false;

  return true;
};
function getHourAppointments(dentistId, hour) {
  if (!isDentistBookable(dentistId, hour)) return [];

  const hourStart = hour * 60;
  const hourEnd = (hour + 1) * 60;

  return filterNonDraftAppointments(props.appointments[dentistId] || [])
    .filter((appt) => {
      const s = apptStart(appt);
      const e = apptEnd(appt);
      return s < hourEnd && e > hourStart;
    })
    .filter((appt) => {
      const s = apptStart(appt);
      const renderHour = Math.floor(s / 60);
      return renderHour === hour || (s < WORK_START * 60 && hour === WORK_START);
    })
    .sort((a, b) => apptStart(a) - apptStart(b));
}

const isHourFull = (dentistId, hour) => {
  const appts = getAppointmentsOverlappingHour(dentistId, hour);
  let occupied = 0;
  appts.forEach((a) => {
    const s = apptStart(a);
    const e = apptEnd(a);
    const lo = Math.max(s, hour * 60);
    const hi = Math.min(e, (hour + 1) * 60);
    occupied += Math.max(0, hi - lo) / INTERVAL_MINS;
  });
  return occupied >= MICRO_PER_HR;
};

const apptCardStyle = (appt) => {
  // Check if this appointment is being resized
  const isResizingThisAppt = resizing.active && resizing.appt?.id === appt.id;

  let s, e;
  if (isResizingThisAppt) {
    s = resizing.curStart;
    e = resizing.curEnd;
  } else {
    s = Math.max(apptStart(appt), WORK_START * 60);
    e = Math.min(apptEnd(appt), WORK_END * 60);
  }

  const hourStart = Math.floor(s / 60) * 60;
  const offsetMins = s - hourStart;
  const duration = Math.max(INTERVAL_MINS, e - s);

  return {
    ...apptStyleFor(appt.status),
    position: "absolute",
    top: `${(offsetMins / 60) * 100}%`,
    height: `${(duration / 60) * 100}%`,
    left: "4px",
    right: "4px",
    zIndex: isResizingThisAppt ? 30 : 20, // Higher z-index during resize
  };
};

// ─── Week-view style ──────────────────────────────────────────
const appointmentStyle = (appt) => {
  const s = apptStart(appt);
  const e = apptEnd(appt);
  const total = Math.max(1, WORK_END - WORK_START) * 60;
  const dayS = WORK_START * 60;
  return {
    top: `${((s - dayS) / total) * 100}%`,
    height: `${((e - s) / total) * 100}%`,
  };
};

// ─── Cell click (open appointment modal) ─────────────────────────────────────
const onCellClick = (dent, slot) => {
  emit("slot-click", { dentist: dent, hour: slot.hour, minute: slot.minute });
};
const onCellClickGuard = (dent, slot) => {
  if (dragCreate.mouseDown || dragCreate.active) return;

  // Check if dentist is unavailable
  if (!isDentistBookable(dent.id, slot.hour)){
    const message =
      props.dentistAvailability[dent.id]?.message ||
      `${dent.name} is not available on this day.`;
    emit("slot-full", {
      dentist: dent,
      hour: slot.hour,
      unavailable: true,
      message,
    });
    return;
  }

  // Check if slot is outside working hours
if (!isDentistBookable(dent.id, slot.hour)) {    const availability = props.dentistAvailability[dent.id];
    const workStart = availability?.workingHours?.startTime || "9:00 AM";
    const workEnd = availability?.workingHours?.endTime || "5:00 PM";
    const message = `${dent.name} works from ${workStart} to ${workEnd}.`;
    emit("slot-full", {
      dentist: dent,
      hour: slot.hour,
      outOfHours: true,
      message,
    });
    return;
  }

  if (isHourFull(dent.id, slot.hour)) {
    emit("slot-full", { dentist: dent, hour: slot.hour });
    return;
  }
  onCellClick(dent, slot);
};

const openPatient = (appt) => {
  if (appt.patientId) router.push(`/patients/${appt.patientId}`);
};

// ─── DRAG-TO-CREATE (FIXED FOR MULTI-HOUR) ───────────────────────────────────
const dragCreate = reactive({
  mouseDown: false,
  active: false,
  dentistId: null,
  startMins: null,
  endMins: null,
});

const dragCreateLabel = computed(() => {
  if (!dragCreate.startMins || !dragCreate.endMins) return "";
  const s = toHHMM(dragCreate.startMins);
  const e = toHHMM(dragCreate.endMins);
  const dur = dragCreate.endMins - dragCreate.startMins;
  return `${s}–${e} (${dur} min)`;
});

/** Get minutes from mouse position relative to ANY slot cell */
function getMinutesFromMouse(event, targetCell = null) {
  const cell = targetCell || event.currentTarget;
  if (!cell) return null;

  const hour = Number(cell.dataset.hour);
  const rect = cell.getBoundingClientRect();
  if (!rect || !rect.height) return hour * 60;

  const relY = Math.min(Math.max(event.clientY - rect.top, 0), rect.height);
  const segH = rect.height / MICRO_PER_HR;
  const segIdx = Math.floor(relY / Math.max(segH, 1));
  const minuteOffset = Math.min(segIdx, MICRO_PER_HR - 1) * INTERVAL_MINS;

  return hour * 60 + minuteOffset;
}

function onSlotMouseDown(event, dent, slot) {
  if (event.button !== 0) return;
  if (event.target.closest(".appointment-card")) return;

  // Prevent drag-creating on disabled slots
  if (isSlotDisabled(dent.id, slot.hour)) return;

  event.preventDefault();

  const cell = event.currentTarget;
  const mins = getMinutesFromMouse(event, cell);
  if (mins === null) return;

  dragCreate.mouseDown = true;
  dragCreate.dentistId = dent.id;
  dragCreate.startMins = mins;
  dragCreate.endMins = mins + INTERVAL_MINS;

  // Add global listeners
  window.addEventListener("mousemove", onGlobalMouseMove);
  window.addEventListener("mouseup", onGlobalMouseUp);
}

function onGlobalMouseMove(event) {
  if (!dragCreate.mouseDown) return;

  // Find the element under cursor
  const elemUnderCursor = document.elementFromPoint(
    event.clientX,
    event.clientY,
  );
  const slotCell = elemUnderCursor?.closest?.("[data-dentist-id]");

  if (!slotCell) return;

  const dentistId = String(slotCell.dataset.dentistId);

  // Only allow dragging within same dentist column
  if (dentistId !== String(dragCreate.dentistId)) return;

  dragCreate.active = true;

  const currentMins = getMinutesFromMouse(event, slotCell);
  if (currentMins === null) return;

  // Update end minutes (always keep start as earliest, end as latest)
  if (currentMins < dragCreate.startMins) {
    dragCreate.endMins = dragCreate.startMins + INTERVAL_MINS;
    dragCreate.startMins = currentMins;
  } else {
    dragCreate.endMins = currentMins + INTERVAL_MINS;
  }
}

function onGlobalMouseUp(event) {
  if (!dragCreate.mouseDown) return;

  const start = dragCreate.startMins;
  const end = dragCreate.endMins;

  // Clean up global listeners
  window.removeEventListener("mousemove", onGlobalMouseMove);
  window.removeEventListener("mouseup", onGlobalMouseUp);

  dragCreate.mouseDown = false;
  dragCreate.active = false;

  if (!start || !end || end <= start) {
    resetDragCreate();
    return;
  }

  // Emit create event
  const dentist = visibleDentists.value.find(
    (d) => String(d.id) === String(dragCreate.dentistId),
  );

  emit("slot-click", {
    dentist,
    hour: Math.floor(start / 60),
    minute: start % 60,
    duration: end - start,
  });

  resetDragCreate();
}

function onSlotMouseUp(event, dent, slot) {
  // Handled by global mouse up
}

function isHourInDragRange(hour) {
  if (!dragCreate.active) return false;
  const s = dragCreate.startMins;
  const e = dragCreate.endMins;
  if (s === null || e === null) return false;
  const hourStart = hour * 60;
  const hourEnd = (hour + 1) * 60;
  return s < hourEnd && e > hourStart;
}

function getDragCreateGhostStyle(hour) {
  if (!dragCreate.active) return null;
  const s = dragCreate.startMins;
  const e = dragCreate.endMins;
  if (s === null || e === null) return null;

  const hourStart = hour * 60;
  const hourEnd = (hour + 1) * 60;
  if (s >= hourEnd || e <= hourStart) return null;

  const overlapStart = Math.max(s, hourStart);
  const overlapEnd = Math.min(e, hourEnd);
  const topPercent = ((overlapStart - hourStart) / 60) * 100;
  const heightPercent = ((overlapEnd - overlapStart) / 60) * 100;

  return {
    top: `${topPercent}%`,
    height: `${heightPercent}%`,
    position: "absolute",
    left: "4px",
    right: "4px",
    zIndex: 20,
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    border: "2px solid #6366f1",
    borderRadius: "6px",
    pointerEvents: "none",
  };
}

function resetDragCreate() {
  dragCreate.mouseDown = false;
  dragCreate.active = false;
  dragCreate.dentistId = null;
  dragCreate.startMins = null;
  dragCreate.endMins = null;
}

// ─── DRAG-TO-MOVE (existing appointments) ────────────────────────────────────
const hoverSlot = ref({ dentistId: null, hour: null });

const buildDragPayload = (appt, dentistId) => ({
  dentistId,
  appointmentId: appt?.id,
  start: appt?.start || appt?.startTime,
  end: appt?.end || appt?.endTime,
  date: appt?.date || activeDate.value,
});

const onAppointmentDragStart = (event, appt, dentistId) => {
  const p = JSON.stringify(buildDragPayload(appt, dentistId));
  if (event?.dataTransfer) {
    event.dataTransfer.setData(DRAG_MIME, p);
    event.dataTransfer.setData("text/plain", p);
    event.dataTransfer.effectAllowed = "move";
  }
};
const onAppointmentDragEnd = () => {
  hoverSlot.value = { dentistId: null, hour: null };
};
// Simplify the clipboard drop handlers
const onSlotDragOver = (event) => {
  event.preventDefault();

  // Get the slot info from the event target
  const cell = event.currentTarget;
  const dentistId = cell?.dataset?.dentistId;
  const hour = parseInt(cell?.dataset?.hour, 10);

  // Check if this slot is available for dropping
  const isAvailable = dentistId && !isSlotDisabled(dentistId, hour);

  if (event.dataTransfer) {
    if (isAvailable) {
      event.dataTransfer.dropEffect = isClipboardDataTransfer(event)
        ? "copy"
        : "move";
    } else {
      event.dataTransfer.dropEffect = "none"; // Not allowed
    }
  }
};
const onSlotDragEnter = (event, dent, slot) => {
  event.preventDefault();

  // Check if dentist is available on this date and slot is within working hours
  if (!isDentistAvailable(dent.id) || isSlotDisabled(dent.id, slot.hour)) {
    // Don't set drop target for unavailable slots
    return;
  }

  if (isClipboardDataTransfer(event)) {
    clipboardDropTarget.value = { dentistId: dent.id, hour: slot.hour };
    console.log("Clipboard drag entered slot", {
      dentistId: dent.id,
      hour: slot.hour,
    });
  } else {
    hoverSlot.value = { dentistId: dent.id, hour: slot.hour };
  }
};
const isHoverSlot = (dentistId, hour) =>
  hoverSlot.value.dentistId === dentistId && hoverSlot.value.hour === hour;

// ─── CLIPBOARD DRAG AND DROP ──────────────────────────────────────────────────
const isClipboardDropTarget = (dentistId, hour) => {
  return (
    clipboardDropTarget.value.dentistId === dentistId &&
    clipboardDropTarget.value.hour === hour
  );
};

const onSlotDragOverForClipboard = (event) => {
  if (!isClipboardDataTransfer(event)) return;
  event.preventDefault();

  // Get the slot info from the event target
  const cell = event.currentTarget;
  const dentistId = cell?.dataset?.dentistId;
  const hour = parseInt(cell?.dataset?.hour, 10);

  // Check if this slot is available for dropping
  const isAvailable = dentistId && !isSlotDisabled(dentistId, hour);

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = isAvailable ? "copy" : "none";
  }
};

const onSlotDragEnterForClipboard = (event, dent, slot) => {
  if (!isClipboardDataTransfer(event)) return;
  event.preventDefault();

  // Check if dentist is available on this date and slot is within working hours
  if (!isDentistAvailable(dent.id) || isSlotDisabled(dent.id, slot.hour)) {
    // Don't set drop target for unavailable slots
    return;
  }

  clipboardDropTarget.value = { dentistId: dent.id, hour: slot.hour };
  console.log("Clipboard drag entered slot", {
    dentistId: dent.id,
    dentistName: dent.name,
    hour: slot.hour,
  });
};

const onSlotDragLeaveForClipboard = (event, dent, slot) => {
  if (!isClipboardDataTransfer(event)) return;
  if (
    clipboardDropTarget.value.dentistId === dent.id &&
    clipboardDropTarget.value.hour === slot.hour
  ) {
    clipboardDropTarget.value = { dentistId: null, hour: null };
  }
};

// Improve the clipboard drop handler
const onClipboardDrop = (event, dentist, slot) => {
  event.preventDefault();

  // Clear drop target
  clipboardDropTarget.value = { dentistId: null, hour: null };

  // ─── Validation: Check if dentist is available and slot is within working hours ────
  if (!isDentistAvailable(dentist.id)) {
    emit("slot-full", {
      dentist,
      hour: slot.hour,
      unavailable: true,
      message: `${dentist.name} is not available on this day. Appointment cannot be created.`,
    });
    return;
  }

  if (isSlotDisabled(dentist.id, slot.hour)) {
    const availability = props.dentistAvailability[dentist.id];
    const workStart = availability?.workingHours?.startTime || "9:00 AM";
    const workEnd = availability?.workingHours?.endTime || "5:00 PM";
    emit("slot-full", {
      dentist,
      hour: slot.hour,
      outOfHours: true,
      message: `${dentist.name} works from ${workStart} to ${workEnd}. Cannot create appointment outside these hours.`,
    });
    return;
  }

  // ─── Get the draft data ────────────────────────────────────────────────────────────
  let raw = event?.dataTransfer?.getData(CLIPBOARD_MIME);
  if (!raw) {
    raw = event?.dataTransfer?.getData("text/plain");
  }

  if (!raw) {
    console.log("No data in clipboard drop");
    return;
  }

  let dragData;
  try {
    dragData = JSON.parse(raw);
  } catch (e) {
    console.error("Failed to parse clipboard data:", e);
    return;
  }

  // Check if it's a clipboard draft
  if (dragData.type !== "clipboard-draft" && !dragData.draft) {
    // console.log("Not a clipboard draft:", dragData);
    return;
  }

  const draft = dragData.draft;
  if (!draft) {
    // console.log("No draft in clipboard data");
    return;
  }

  // Calculate drop time based on mouse position
  const cell = event.currentTarget;
  const rect = cell?.getBoundingClientRect();
  let newStartMinutes = slot.hour * 60;

  if (rect?.height) {
    const relY = Math.min(Math.max(event.clientY - rect.top, 0), rect.height);
    const segH = rect.height / MICRO_PER_HR;
    const microSlot = Math.floor(relY / Math.max(segH, 1));
    newStartMinutes =
      slot.hour * 60 + Math.min(microSlot, MICRO_PER_HR - 1) * INTERVAL_MINS;
  }

  const newStartTime = toHHMM(newStartMinutes);
  const duration = draft.duration || INTERVAL_MINS;

  // Emit the create-from-draft event
  emit("create-from-draft", {
    draft,
    dentistId: dentist.id,
    date: activeDate.value,
    start: newStartTime,
    duration: duration,
  });
};

// Update the main drop handler
const onAppointmentDrop = (event, dentist, slot) => {
  event.preventDefault();
  event.stopPropagation();

  // ─── Validation: Check if dentist is available and slot is within working hours ────
  if (!isDentistAvailable(dentist.id)) {
    emit("slot-full", {
      dentist,
      hour: slot.hour,
      unavailable: true,
      message: `${dentist.name} is not available on this day. Appointment cannot be moved here.`,
    });
    return;
  }

  if (isSlotDisabled(dentist.id, slot.hour)) {
    const availability = props.dentistAvailability[dentist.id];
    const workStart = availability?.workingHours?.startTime || "9:00 AM";
    const workEnd = availability?.workingHours?.endTime || "5:00 PM";
    emit("slot-full", {
      dentist,
      hour: slot.hour,
      outOfHours: true,
      message: `${dentist.name} works from ${workStart} to ${workEnd}. Cannot move appointment outside these hours.`,
    });
    return;
  }

  // Clear hover states
  hoverSlot.value = { dentistId: null, hour: null };

  // Handle clipboard drops
  if (isClipboardDataTransfer(event)) {
    onClipboardDrop(event, dentist, slot);
    return;
  }

  // Handle appointment move drops
  const raw =
    event?.dataTransfer?.getData(DRAG_MIME) ||
    event?.dataTransfer?.getData("text/plain");
  if (!raw) return;

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return;
  }

  // Check if it's an appointment move (no type or type is not clipboard-draft)
  if (payload.type === "clipboard-draft") {
    // This should have been caught above, but just in case
    onClipboardDrop(event, dentist, slot);
    return;
  }

  const dur = Math.max(
    INTERVAL_MINS,
    toMins(payload.end) - toMins(payload.start),
  );

  const rect = event.currentTarget?.getBoundingClientRect?.();
  let newStart = slot.hour * 60;
  if (rect?.height) {
    const relY = Math.min(Math.max(event.clientY - rect.top, 0), rect.height);
    const segH = rect.height / MICRO_PER_HR;
    newStart =
      slot.hour * 60 + Math.floor(relY / Math.max(segH, 1)) * INTERVAL_MINS;
  }

  const newStartTime = toHHMM(newStart);
  const newEndTime = toHHMM(newStart + dur);

  emit("move-appointment", {
    appointmentId: payload.appointmentId,
    from: {
      dentistId: payload.dentistId,
      date: payload.date,
      start: payload.start,
      end: payload.end,
    },
    to: {
      dentistId: dentist.id,
      date: activeDate.value || payload.date,
      start: newStartTime,
      end: newEndTime,
    },
    appointment: payload,
  });
};

// ─── RESIZE ───────────────────────────────────────────────────────────────────
const resizing = reactive({
  active: false,
  direction: null,
  appt: null,
  dentist: null,
  origStart: null,
  origEnd: null,
  curStart: null,
  curEnd: null,
});

function onResizeStart({ event, appt, direction }, dentist) {
  resizing.active = true;
  resizing.direction = direction;
  resizing.appt = appt;
  resizing.dentist = dentist;
  resizing.origStart = toMins(appt.start);
  resizing.origEnd = toMins(appt.end);
  resizing.curStart = resizing.origStart;
  resizing.curEnd = resizing.origEnd;
  document.body.style.cursor = "ns-resize";
}

function onResizeMove(event) {
  if (!resizing.active) {
    return;
  }

  // Temporarily hide overlay to get element under cursor
  const overlay = document.querySelector(".resize-overlay");
  if (overlay) overlay.style.pointerEvents = "none";

  const el = document.elementFromPoint(event.clientX, event.clientY);

  // Restore overlay
  if (overlay) overlay.style.pointerEvents = "auto";

  const cell = el?.closest?.("[data-hour]");

  if (!cell) {
    return;
  }

  const hour = Number(cell.dataset.hour);
  const rect = cell.getBoundingClientRect();
  const relY = Math.min(Math.max(event.clientY - rect.top, 0), rect.height);
  const segH = rect.height / MICRO_PER_HR;
  const mins = hour * 60 + Math.floor(relY / Math.max(segH, 1)) * INTERVAL_MINS;

  if (resizing.direction === "bottom") {
    resizing.curEnd = Math.max(
      resizing.origStart + INTERVAL_MINS,
      mins + INTERVAL_MINS,
    );
  } else {
    resizing.curStart = Math.min(resizing.origEnd - INTERVAL_MINS, mins);
  }
}

function onResizeEnd() {
  if (!resizing.active) return;
  document.body.style.cursor = "";

  const newStart = toHHMM(resizing.curStart);
  const newEnd = toHHMM(resizing.curEnd);

  emit("move-appointment", {
    appointmentId: resizing.appt?.id,
    from: {
      dentistId: resizing.dentist?.id,
      date: resizing.appt?.date || activeDate.value,
      start: resizing.appt?.start,
      end: resizing.appt?.end,
    },
    to: {
      dentistId: resizing.dentist?.id,
      date: resizing.appt?.date || activeDate.value,
      start: newStart,
      end: newEnd,
    },
    appointment: resizing.appt,
  });

  // Open the appointment modal for editing after resize
  emit("open-appointment", {
    appt: { ...resizing.appt, start: newStart, end: newEnd },
    dentist: resizing.dentist,
  });

  resizing.active = false;
  resizing.appt = null;
}

// Clean up on unmount
onUnmounted(() => {
  window.removeEventListener("mousemove", onGlobalMouseMove);
  window.removeEventListener("mouseup", onGlobalMouseUp);
});
</script>

<style scoped>
/* ── Wrapper ── */
.calendar-wrap {
  width: 100%;
  overflow-x: auto;
  background: #fff;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
  position: relative;
}

/* ── Day-view grid ── */
.calendar-grid {
  display: grid;
  grid-template-columns: 72px repeat(var(--cols, 3), minmax(260px, 1fr));
  grid-auto-rows: auto;
  background: #eef2f7;
  border-radius: 12px;
  overflow: auto;
  border: 1px solid #e5e7eb;
  height: 73vh;
}

/* Header cells */
.time-head {
  height: 52px;
  background: #f6f7fb;
  border-bottom: 1px solid #e5e7eb;
}

.dentist-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #f6f7fb;
  border-left: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
  min-width: 260px;
}
.dentist-head.dentist-unavailable {
  background: #fef2f2;
  opacity: 0.75;
}
.dentist-head.dentist-unavailable .avatar {
  background: #ffe0e0;
  color: #c00;
}
.dentist-head.dentist-unavailable .name {
  color: #c00;
}
.dentist-head.dentist-unavailable .text-error {
  color: #dc2626;
  font-weight: 500;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e6eaf5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 12px;
  color: #1e2b80;
  flex-shrink: 0;
}

.dentist-head-text {
  flex: 1;
  min-width: 0;
}
.dentist-head-text .name {
  font-weight: 600;
  font-size: 13px;
  color: #111827;
}
.dentist-head-text .subtitle {
  font-size: 11px;
  color: #6b7280;
}
.header-actions {
  display: flex;
  gap: 2px;
  margin-left: auto;
}

/* Time cells */
.time-cell {
  background: linear-gradient(180deg, #f6f7fb 0%, #fff 70%);
  font-size: 11px;
  font-weight: 600;
  color: #4b5563;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 8px 8px 0 0;
  border-right: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
  min-height: calc(4 * 36px + 24px);
}
/* Add to the style section in calendar/index.vue */
.slot-cell.clipboard-hover {
  background: rgba(109, 74, 255, 0.08);
  box-shadow: inset 0 0 0 2px #6d4aff;
}
/* Slot cells */
.slot-cell {
  background: #fff;
  border-left: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
  min-width: 260px;
  cursor: crosshair;
  transition: background 0.1s;
  position: relative;
  overflow: visible;
}
.slot-cell:hover {
  background: #f9fafb;
}
.slot-cell.slot-full {
  cursor: not-allowed;
  background: #f8f8f8;
  opacity: 0.75;
}
.slot-cell.slot-disabled {
  cursor: not-allowed;
  background: #f5f5f5;
  opacity: 0.6;
  position: relative;
}
.slot-cell.slot-disabled::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 10px,
    rgba(200, 200, 200, 0.1) 10px,
    rgba(200, 200, 200, 0.1) 20px
  );
  pointer-events: none;
}
.slot-cell.drop-hover {
  background: #eef2ff;
  box-shadow: inset 0 0 0 2px #c7d2fe;
}
.slot-cell.slot-hover {
  background: rgba(99, 102, 241, 0.04);
}

/* Slot grid: 4 rows of compact micro-slots */
.slot-grid {
  display: grid;
  grid-template-rows: repeat(4, 36px);
  gap: 3px;
  padding: 6px 8px;
  position: relative;
}

.appointment-overlay {
  position: absolute;
  inset: auto 4px 0 4px;
  z-index: 15;
}

.empty-micro-slot {
  background: transparent;
  border-radius: 5px;
  border: 1px dashed #e5e7eb;
  transition:
    background 0.15s,
    border-color 0.15s;
}
.slot-cell:hover .empty-micro-slot {
  border-color: #d1d5db;
  background: rgba(0, 0, 0, 0.01);
}

/* Drag-create ghost */
.drag-create-ghost {
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  transition: none;
  z-index: 25;
}
.ghost-label {
  font-size: 11px;
  font-weight: 600;
  color: #4338ca;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 4px;
  padding: 2px 6px;
}

/* Clipboard drop indicator */
.clipboard-drop-indicator {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(109, 74, 255, 0.15);
  border: 2px solid #6d4aff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  pointer-events: none;
}

.drop-label {
  background: #6d4aff;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

/* Break overlay */
.break-overlay {
  position: absolute;
  left: 0;
  right: 0;

  /* ❌ REMOVE THIS */
  /* top: 0;
  bottom: 0; */

  background: repeating-linear-gradient(
    45deg,
    rgba(239, 68, 68, 0.2),
    rgba(239, 68, 68, 0.2) 10px,
    rgba(239, 68, 68, 0.35) 10px,
    rgba(239, 68, 68, 0.35) 20px
  );

  border: 2px solid rgba(239, 68, 68, 0.5);
  border-radius: 8px;

  display: flex;
  align-items: center;
  justify-content: center;

  z-index: 101;
  pointer-events: none;
}

.break-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.break-label {
  background: rgba(239, 68, 68, 0.95);
  color: white;
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.break-timing {
  background: rgba(239, 68, 68, 0.85);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 500;
  white-space: nowrap;
}

/* Resize overlay (full-screen capture) */
.resize-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  cursor: ns-resize;
}

/* ── Week view ── */
.week-day-section {
  margin-bottom: 24px;
}
.week-day-header {
  font-weight: 600;
  color: #374151;
  margin: 8px 0 6px 8px;
}
.grid {
  display: grid;
  grid-template-columns: 80px repeat(var(--cols, 3), 1fr);
  background: #eef2f7;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}
.time-col {
  background: #f6f7fb;
  border-right: 1px solid #e5e7eb;
}
.dentist-col {
  background: #fff;
  border-left: 1px solid #e5e7eb;
  min-width: 220px;
}
.dentist-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid #e5e7eb;
  background: #f6f7fb;
}
.slot-col {
  position: relative;
  cursor: pointer;
  background: repeating-linear-gradient(
    to bottom,
    #fff,
    #fff 59px,
    #f9fafb 60px
  );
}
.appt-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.now-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: #ff3b30;
  z-index: 5;
}
.appt {
  position: absolute;
  left: 4px;
  right: 4px;
  border-radius: 6px;
  padding: 4px 6px;
  pointer-events: auto;
  cursor: pointer;
  border-left: 3px solid;
  overflow: hidden;
}
.appt-title {
  font-weight: 600;
  font-size: 12px;
}
.appt-time {
  font-size: 11px;
}
</style>
