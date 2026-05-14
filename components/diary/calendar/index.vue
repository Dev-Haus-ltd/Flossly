<!-- components/diary/calendar/index.vue -->
<!--
  ARCHITECTURE: All appointment cards and break overlays are rendered in a
  single absolutely-positioned `.overlay-layer` div that is a sibling of the
  `.calendar-grid`. It is positioned to exactly cover the scrollable grid
  content (excluding the sticky header row) and uses pixel coordinates derived
  from the grid's measured row/column dimensions. This avoids any clipping from
  `overflow: auto` on the scroll container, which is the root cause of
  overlays being cut at hour-row boundaries.
-->
<template>
  <div class="calendar-wrap">
    <!-- ── Day mode ── -->
    <template v-if="view === 'day'">
      <!--
        .grid-scroll-host: the single scrollable container.
        It holds both the background grid and the overlay layer as siblings,
        so they scroll together and the overlay is never clipped by the grid.
      -->
      <div
        ref="gridScrollHost"
        class="grid-scroll-host"
        :style="{ '--cols': visibleDentists.length }"
        @scroll="onGridScroll"
      >
        <!-- ── Background grid (structure + interaction only, no appt cards) ── -->
        <div ref="calendarGrid" class="calendar-grid">
          <!-- Sticky header row -->
          <div class="time-head header-sticky"></div>

          <div
            v-for="(dent, ci) in visibleDentists"
            :key="'h-' + dent.id"
            class="dentist-head header-sticky"
            :class="{
              'dentist-unavailable': !dentistAvailability[dent.id]?.isAvailable,
            }"
            :style="{ gridColumn: ci + 2 }"
          >
            <div class="avatar">{{ initials(dent?.name) }}</div>
            <div class="dentist-head-text">
              <div class="name">{{ dent.name }}</div>
              <div class="subtitle">
                <span v-if="dentistAvailability[dent.id]?.isAvailable">
                  Today:
                  {{
                    filterNonDraftAppointments(appointments[dent.id] || [])
                      .length
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
              <v-menu
                location="bottom end"
                :offset="8"
                content-class="calendar-head-menu"
              >
                <template #activator="{ props: menuProps }">
                  <v-btn
                    v-bind="menuProps"
                    icon="mdi-dots-horizontal"
                    size="x-small"
                    variant="text"
                  />
                </template>
                <v-list
                  density="compact"
                  min-width="220"
                  class="calendar-head-menu__list"
                >
                  <v-list-item
                    :title="
                      dentistAvailability[dent.id]?.isAvailable
                        ? 'Turn Off Day Slots'
                        : 'Turn On Day Slots'
                    "
                    @click="$emit('toggle-day-slots', dent)"
                  />
                </v-list>
              </v-menu>
            </div>
          </div>

          <!-- Hour rows: interaction cells only, zero appointment rendering here -->
          <template v-for="(t, ri) in timeSlots" :key="t.key">
            <div class="time-cell" :data-row-index="ri" :data-hour="t.hour">
              {{ t.label }}
            </div>

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
              :data-dentist-id="dent.id"
              :data-dentist-col="ci"
              :data-hour="t.hour"
              :data-row-index="ri"
              @click="onCellClickGuard($event, dent, t)"
              @mousedown="onSlotMouseDown($event, dent, t)"
              @mouseup="onSlotMouseUp($event, dent, t)"
              @dragover.prevent="onSlotDragOver($event)"
              @dragenter.prevent="onSlotDragEnter($event, dent, t)"
              @dragleave="onSlotDragLeave($event, dent, t)"
              @drop="onAppointmentDrop($event, dent, t)"
            >
              <!-- micro-slot dashes for visual rhythm -->
              <div class="slot-grid">
                <div
                  v-for="i in MICRO_PER_HR"
                  :key="i"
                  class="empty-micro-slot"
                ></div>
              </div>

              <!-- Drag-create ghost (still lives in the cell, spans only within it) -->
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

              <!-- Clipboard hover indicator -->
              <div
                v-if="isClipboardDropTarget(dent.id, t.hour)"
                class="clipboard-drop-indicator"
              >
                <span class="drop-label">Drop here</span>
              </div>
            </div>
          </template>
        </div>
        <!-- /.calendar-grid -->

        <!--
          ── OVERLAY LAYER ──────────────────────────────────────────────────────
          Sibling of .calendar-grid, absolute-positioned to cover the exact
          same area. All appointment cards and break overlays live here.
          pointer-events:none on the layer itself; cards set pointer-events:auto.
        -->
        <div
          ref="overlayLayer"
          class="overlay-layer"
          :style="overlayLayerStyle"
        >
          <!-- Per-dentist column overlays -->
          <div
            v-for="(dent, ci) in visibleDentists"
            :key="'ol-' + dent.id"
            class="overlay-col"
            :style="getOverlayColStyle(ci)"
          >
            <!-- Appointments -->
            <template
              v-for="appt in filterNonDraftAppointments(
                appointments[dent.id] || [],
              )"
              :key="appt.id"
            >
              <AppointmentCard
                :appt="appt"
                :compact="isShortAppointment(appt)"
                :show-resize-handles="true"
                :style-obj="getApptOverlayStyle(appt, dent.id)"
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
              />
            </template>

            <!-- Zone overlays -->
            <template
              v-for="zone in getDentistZones(dent.id)"
              :key="'zone-' + zone.id"
            >
              <div class="zone-overlay" :style="getZoneOverlayStyle(zone)">
                <div class="zone-label">{{ zone.title }}</div>
              </div>
            </template>

            <!-- Break overlays -->
            <template
              v-for="brk in getDentistBreaks(dent.id)"
              :key="'brk-' + dent.id + '-' + brk.startTime"
            >
              <div class="break-overlay" :style="getBreakOverlayStyle(brk)">
                <div class="break-content">
                  <span class="break-label">{{ brk.name }}</span>
                  <span class="break-timing"
                    >{{ brk.startTime12 }} - {{ brk.endTime12 }}</span
                  >
                </div>
              </div>
            </template>
          </div>
        </div>
        <!-- /.overlay-layer -->

        <!--
          ── RESIZE CAPTURE OVERLAY ─────────────────────────────────────────────
          FIXED: Moved inside .grid-scroll-host so it scrolls with content and
          covers the entire scrollable area. Uses position:absolute so it
          doesn't interfere with the fixed viewport. When resizing is active,
          it captures all mouse events and forwards them to the resize handler.
          pointer-events are toggled via JS so elementFromPoint can pierce it.
        -->
        <div
          v-if="resizing.active"
          ref="resizeCaptureOverlay"
          class="resize-capture-overlay"
          @mousemove="onResizeMove"
          @mouseup="onResizeEnd"
          @mouseleave="onResizeOverlayLeave"
        ></div>
      </div>
      <!-- /.grid-scroll-host -->
    </template>

    <!-- ── Week mode (unchanged) ── -->
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
              <template
                v-for="zone in getDentistZones(dent.id, d)"
                :key="'week-zone-' + zone.id"
              >
                <div class="zone-overlay zone-overlay-week" :style="getZoneOverlayStyle(zone)">
                  <div class="zone-label">{{ zone.title }}</div>
                </div>
              </template>
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
                  <div class="appt-time">
                    {{ formatAppointmentRange(appt) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, onUnmounted, nextTick } from "vue";
import { useRoute } from "vue-router";

import AppointmentCard from "@/components/diary/calendar/AppointmentCard.vue";
import {
  clinicMinutesFromTime,
  formatDateDDMMYYYY,
  formatTime12Hour,
} from "@/lib/dateFormatter";
import { formatTimeTo12Hour } from "@/lib/timeFormatters";

const props = defineProps({
  date: { type: [String, Date], required: true },
  view: { type: String, default: "day" },
  dentists: { type: Array, default: () => [] },
  selectedDentistIds: { type: Array, default: () => [] },
  appointments: { type: Object, default: () => ({}) },
  dentistAvailability: { type: Object, default: () => ({}) },
  zones: { type: Array, default: () => [] },
  highlightedAppointmentId: { type: [String, Number], default: null },
});

const emit = defineEmits([
  "slot-click",
  "update-status",
  "open-notes",
  "toggle-day-slots",
  "open-schedule-settings",
  "slot-full",
  "move-appointment",
  "open-appointment",
  "create-appointment",
  "create-from-draft",
]);

const router = useRouter();
const route = useRoute();
// ─── Constants ────────────────────────────────────────────────────────────────
// WORK_START and WORK_END are now computed properties based on dentist schedules (see Derived section)
// FALLBACK values if no schedule is available
const DEFAULT_WORK_START = 9;
const DEFAULT_WORK_END = 17;
const INTERVAL_MINS = 15;
const MICRO_PER_HR = 4;

// Pixel height of one complete hour row.
// = slot-grid padding-top(6) + 4×row(36) + 3×gap(3) + padding-bottom(6) = 165
// If you change .slot-grid CSS, update this constant to match.
const HOUR_ROW_PX = 165;

// Pixel height of the sticky dentist-header row (must match .dentist-head height in CSS)
const HEADER_ROW_PX = 52;

const DRAG_MIME = "application/x-flossly-appointment";
const CLIPBOARD_MIME = "application/x-flossly-draft";

// ─── Template refs ────────────────────────────────────────────────────────────
const gridScrollHost = ref(null);
const calendarGrid = ref(null);
const overlayLayer = ref(null);
// FIX: ref for the resize capture overlay (now inside scroll host)
const resizeCaptureOverlay = ref(null);

const scrollTop = ref(0);
const scrollLeft = ref(0);

// Measured DOM dimensions — updated on mount and on grid resize
const colWidths = ref([]); // [timeLabelWidth, dentistCol0Width, dentistCol1Width, ...]
const rowHeights = ref([]); // one entry per timeSlot row

const onGridScroll = (e) => {
  scrollTop.value = e.target.scrollTop;
  scrollLeft.value = e.target.scrollLeft;
};

// ─── Overlay layer style ──────────────────────────────────────────────────────
// The overlay-layer is absolute inside .grid-scroll-host (position:relative),
// so it scrolls with the content and is never independently clipped.
const overlayLayerStyle = computed(() => ({
  position: "absolute",
  top: "0px",
  left: "0px",
  width: "100%",
  height: "100%",
  pointerEvents: "none",
  zIndex: 10,
}));

// ─── Column layout helpers ─────────────────────────────────────────────────────
const getOverlayColStyle = (ci) => {
  if (!colWidths.value.length) return { display: "none" };
  // colWidths[0] = time-label column; colWidths[1+] = dentist columns
  const left = colWidths.value.slice(0, ci + 1).reduce((a, b) => a + b, 0);
  const width = colWidths.value[ci + 1] ?? 260;
  return {
    position: "absolute",
    top: "0px",
    left: `${left}px`,
    width: `${width}px`,
    height: "100%",
    pointerEvents: "none",
  };
};

// Measure grid column widths and row heights from the live DOM
const measureGrid = async () => {
  await nextTick();
  const grid = calendarGrid.value;
  if (!grid) return;

  const timeLabelCell = grid.querySelector(".time-cell");
  const dentistCells = grid.querySelectorAll(".dentist-head");
  if (!timeLabelCell || !dentistCells.length) return;

  colWidths.value = [
    timeLabelCell.getBoundingClientRect().width,
    ...Array.from(dentistCells).map((el) => el.getBoundingClientRect().width),
  ];

  // Collect row heights indexed by data-row-index (one cell per row is enough)
  const byRow = {};
  grid.querySelectorAll(".slot-cell[data-row-index]").forEach((el) => {
    const ri = Number(el.dataset.rowIndex);
    if (!(ri in byRow)) byRow[ri] = el.getBoundingClientRect().height;
  });
  rowHeights.value = Object.keys(byRow)
    .sort((a, b) => Number(a) - Number(b))
    .map((k) => byRow[k]);
};

// Convert absolute minutes-since-midnight to a pixel Y offset from the very
// top of the overlay column (i.e. including the header row height).
const minsToOverlayPx = (mins) => {
  const relMins = mins - WORK_START.value * 60;
  const hourIndex = Math.floor(relMins / 60);
  const minInHour = relMins % 60;

  // Sum all full hour rows above this one
  let py = HEADER_ROW_PX;
  for (let i = 0; i < hourIndex; i++) {
    py += rowHeights.value[i] ?? HOUR_ROW_PX;
  }
  // Add fractional offset within the current row
  const rowH = rowHeights.value[hourIndex] ?? HOUR_ROW_PX;
  py += (minInHour / 60) * rowH;
  return py;
};

// ResizeObserver: remeasure whenever the grid reflows
let resizeObserver = null;
onMounted(() => {
  measureGrid();
  resizeObserver = new ResizeObserver(measureGrid);
  if (calendarGrid.value) resizeObserver.observe(calendarGrid.value);
});
onUnmounted(() => {
  resizeObserver?.disconnect();
  window.removeEventListener("mousemove", onGlobalMouseMove);
  window.removeEventListener("mouseup", onGlobalMouseUp);
  // FIX: Also clean up global resize listeners on unmount
  window.removeEventListener("mousemove", onGlobalResizeMove);
  window.removeEventListener("mouseup", onGlobalResizeEnd);
});

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
const formatRange12Hour = (s, e) =>
  `${formatTime12Hour(toHHMM(s))} - ${formatTime12Hour(toHHMM(e))}`;
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
const timeToMinutes = (time) => {
  if (!time) return 0;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
};
const formatTo12Hour = (time) => {
  // Use centralized formatter
  return formatTimeTo12Hour(time);
};

// ─── Derived ──────────────────────────────────────────────────────────────────
// const activeDate = computed(() => normDate(props.date));
console.log("routeQuery",route.query.date)
const activeDate = computed(() => {
  return route.query.date || normDate(props.date);
});
/**
 * Calculate actual working hours from visible dentists' schedules
 * Returns { startHour, endHour } based on availability data
 * Falls back to DEFAULT_WORK_START/END if no schedules available
 */
const dynamicWorkingHours = computed(() => {
  const visibleIds = visibleDentists.value.map((d) => String(d.id));
  if (!visibleIds.length) {
    return { startHour: DEFAULT_WORK_START, endHour: DEFAULT_WORK_END };
  }

  let minStartTime = null;
  let maxEndTime = null;

  for (const dentistId of visibleIds) {
    const avail = props.dentistAvailability[dentistId];
    if (avail?.isAvailable && avail?.workingHours) {
      const startMins = timeToMinutes(avail.workingHours.startTime || "09:00");
      const endMins = timeToMinutes(avail.workingHours.endTime || "17:00");

      if (minStartTime === null || startMins < minStartTime) {
        minStartTime = startMins;
      }
      if (maxEndTime === null || endMins > maxEndTime) {
        maxEndTime = endMins;
      }
    }
  }

  // If no valid schedule found, use defaults
  if (minStartTime === null || maxEndTime === null) {
    return { startHour: DEFAULT_WORK_START, endHour: DEFAULT_WORK_END };
  }

  const startHour = Math.floor(minStartTime / 60);
  const endHour = Math.ceil(maxEndTime / 60);

  return { startHour, endHour };
});

/**
 * Dynamic WORK_START derived from actual dentist schedules
 */
const WORK_START = computed(() => dynamicWorkingHours.value.startHour);

/**
 * Dynamic WORK_END derived from actual dentist schedules
 */
const WORK_END = computed(() => dynamicWorkingHours.value.endHour);

const visibleDentists = computed(() => {
  const ids = (props.selectedDentistIds || []).map(String);
  return ids.length
    ? props.dentists.filter((d) => ids.includes(String(d.id)))
    : props.dentists;
});
const timeSlots = computed(() => {
  const s = [];
  for (let h = WORK_START.value; h <= WORK_END.value; h++) {
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
const columnHeight = computed(() => (WORK_END.value - WORK_START.value) * 100);
const nowTop = computed(() => {
  const now = new Date();
  const m = now.getHours() * 60 + now.getMinutes();
  return (
    ((m - WORK_START.value * 60) / (Math.max(1, WORK_END.value - WORK_START.value) * 60)) * 100
  );
});

const isShortAppointment = (appt) => {
  const isResizingThis = resizing.active && resizing.appt?.id === appt.id;
  const dur = isResizingThis
    ? resizing.curEnd - resizing.curStart
    : toMins(appt?.end || appt?.endTime) -
      toMins(appt?.start || appt?.startTime);
  return dur <= INTERVAL_MINS;
};

// ─── Status colours ───────────────────────────────────────────────────────────
const statusColors = {
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
const isDentistAvailable = (dentistId) =>
  props.dentistAvailability[dentistId]?.isAvailable === true;

const getMinuteRangeAvailability = (dentist, startMinutes, endMinutes) => {
  const avail = props.dentistAvailability[dentist?.id];
  if (!avail?.isAvailable) {
    return {
      available: false,
      message:
        avail?.message ||
        `${dentist?.name || "This dentist"} is not available on this day.`,
    };
  }
  const workStart = timeToMinutes(avail?.workingHours?.startTime || "09:00");
  const workEnd = timeToMinutes(avail?.workingHours?.endTime || "17:00");
  if (startMinutes < workStart || endMinutes > workEnd) {
    return {
      available: false,
      message: `${dentist?.name} works from ${formatTime12Hour(avail?.workingHours?.startTime)} to ${formatTime12Hour(avail?.workingHours?.endTime)}.`,
    };
  }
  for (const b of avail?.workingHours?.breaks || []) {
    const bs = timeToMinutes(b.startTime);
    const be = timeToMinutes(b.endTime);
    if (startMinutes < be && endMinutes > bs) {
      return {
        available: false,
        message: `${dentist?.name} is on a break between ${formatTime12Hour(b.startTime)} and ${formatTime12Hour(b.endTime)}.`,
      };
    }
  }
  return { available: true, message: "" };
};

const hasAvailableQuarterHourInHour = (dentistId, hour) => {
  const dentist = visibleDentists.value.find(
    (d) => String(d.id) === String(dentistId),
  );
  if (!dentist) return false;
  const hs = hour * 60;
  for (let offset = 0; offset < 60; offset += INTERVAL_MINS) {
    if (
      getMinuteRangeAvailability(
        dentist,
        hs + offset,
        hs + offset + INTERVAL_MINS,
      ).available
    )
      return true;
  }
  return false;
};

const isSlotDisabled = (dentistId, hour) =>
  !isDentistAvailable(dentistId) ||
  !hasAvailableQuarterHourInHour(dentistId, hour);

// ─── Appointment helpers ──────────────────────────────────────────────────────
const apptStart = (appt) => toMins(appt?.start || appt?.startTime);
const apptEnd = (appt) => toMins(appt?.end || appt?.endTime);
const formatAppointmentRange = (appt) =>
  `${formatTime12Hour(appt?.start) || appt?.start || ""} - ${formatTime12Hour(appt?.end) || appt?.end || ""}`;

const filterNonDraftAppointments = (list) =>
  (list || []).filter((a) => a.status !== "Draft");

const isDentistBookable = (dentistId, hour = null) => {
  if (!isDentistAvailable(dentistId)) return false;
  if (hour !== null && isSlotDisabled(dentistId, hour)) return false;
  return true;
};

const zoneDayIndex = (dateString) => {
  if (!dateString) return null;
  const d = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const jsDay = d.getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
};

const isZoneApplicableOnDate = (zone, dateString) => {
  if (!zone || !dateString) return false;
  const dayIndex = zoneDayIndex(dateString);
  if (dayIndex === null) return false;
  if (!Array.isArray(zone.selectedDays) || !zone.selectedDays.includes(dayIndex)) return false;
  if (zone.startDate && zone.endDate) {
    const start = new Date(`${zone.startDate}T00:00:00`);
    const end = new Date(`${zone.endDate}T23:59:59`);
    const target = new Date(`${dateString}T00:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || Number.isNaN(target.getTime())) {
      return false;
    }
    if (target < start || target > end) return false;
  }
  return true;
};

const getDentistZones = (dentistId, dateString = activeDate.value) =>
  (props.zones || [])
    .filter(
      (zone) =>
        String(zone.dentistId) === String(dentistId) &&
        isZoneApplicableOnDate(zone, dateString),
    );

const getAppointmentsOverlappingHour = (dentistId, hour) => {
  const hs = hour * 60,
    he = (hour + 1) * 60;
  return filterNonDraftAppointments(props.appointments[dentistId] || [])
    .filter((a) => apptStart(a) < he && apptEnd(a) > hs)
    .sort((a, b) => apptStart(a) - apptStart(b));
};

const isHourFull = (dentistId, hour) => {
  let occupied = 0;
  getAppointmentsOverlappingHour(dentistId, hour).forEach((a) => {
    const lo = Math.max(apptStart(a), hour * 60);
    const hi = Math.min(apptEnd(a), (hour + 1) * 60);
    occupied += Math.max(0, hi - lo) / INTERVAL_MINS;
  });
  return occupied >= MICRO_PER_HR;
};

// ─── Overlay style helpers ────────────────────────────────────────────────────

/**
 * Pixel-perfect style for an appointment card in the overlay layer.
 * top    = distance from top of overlay column to the appointment start
 * height = full duration in px — never capped at a row boundary
 *
 * FIX: Height now correctly sums row heights across all spanned hours
 * instead of using only the starting hour's row height.
 */
const getApptOverlayStyle = (appt) => {
  const isResizing = resizing.active && resizing.appt?.id === appt.id;
  const isHighlighted =
    props.highlightedAppointmentId !== null &&
    String(props.highlightedAppointmentId) === String(appt?.id);

  const rawStart = isResizing
    ? resizing.curStart
    : toMins(appt?.start || appt?.startTime);
  const rawEnd = isResizing
    ? resizing.curEnd
    : toMins(appt?.end || appt?.endTime);

  const clampedStart = Math.max(rawStart, WORK_START.value * 60);
  const clampedEnd = Math.min(rawEnd, WORK_END.value * 60);
  const duration = Math.max(INTERVAL_MINS, rawEnd - rawStart);

  const topPx = minsToOverlayPx(clampedStart);

  // FIX: Compute height by summing pixel offsets from start to end,
  // correctly spanning across multiple hour rows.
  const bottomPx = minsToOverlayPx(Math.min(rawEnd, WORK_END.value * 60));
  const heightPx = Math.max(bottomPx - topPx, 20); // minimum 20px so handle is always visible

  return {
    ...apptStyleFor(appt.status),
    position: "absolute",
    top: `${topPx}px`,
    height: `${heightPx}px`,
    left: "4px",
    right: "4px",
    zIndex: isResizing ? 30 : isHighlighted ? 25 : 20,
    pointerEvents: "auto",
    boxShadow: isHighlighted
      ? "0 0 0 2px #f59e0b, 0 10px 22px rgba(245,158,11,0.28)"
      : undefined,
  };
};

/**
 * Returns a flat list of break descriptors for a dentist, ready for rendering.
 */
const getDentistBreaks = (dentistId) => {
  const avail = props.dentistAvailability[dentistId];
  if (!avail?.isAvailable || !avail?.workingHours?.breaks) return [];
  return avail.workingHours.breaks.map((b) => ({
    name: b.breakName || "Break",
    startTime: b.startTime,
    endTime: b.endTime,
    startTime12: formatTo12Hour(b.startTime),
    endTime12: formatTo12Hour(b.endTime),
    startMins: timeToMinutes(b.startTime),
    endMins: timeToMinutes(b.endTime),
  }));
};

/**
 * Pixel-perfect style for a break overlay in the overlay layer.
 */
const getBreakOverlayStyle = (brk) => {
  const topPx = minsToOverlayPx(brk.startMins);
  // FIX: Use minsToOverlayPx for bottom too, for multi-row accuracy
  const bottomPx = minsToOverlayPx(brk.endMins);
  const heightPx = bottomPx - topPx;
  return {
    position: "absolute",
    top: `${topPx}px`,
    height: `${heightPx}px`,
    left: "0px",
    right: "0px",
    zIndex: 101,
    pointerEvents: "none",
  };
};

const getZoneOverlayStyle = (zone) => {
  const startMins = timeToMinutes(zone.startTime);
  const endMins = timeToMinutes(zone.endTime);
  const clampedStart = Math.max(startMins, WORK_START.value * 60);
  const clampedEnd = Math.min(endMins, WORK_END.value * 60);
  if (!Number.isFinite(startMins) || !Number.isFinite(endMins) || clampedEnd <= clampedStart) {
    return { display: "none" };
  }

  const topPx = minsToOverlayPx(clampedStart);
  const bottomPx = minsToOverlayPx(clampedEnd);
  const heightPx = bottomPx - topPx;
  const color = zone.color || "#0061FB";
  const background =
    zone.displayType === "border"
      ? "transparent"
      : `${color}22`;
  const border =
    zone.displayType === "background"
      ? "none"
      : `2px solid ${color}`;

  return {
    position: "absolute",
    top: `${topPx}px`,
    height: `${heightPx}px`,
    left: "4px",
    right: "4px",
    borderRadius: "10px",
    backgroundColor: background,
    border,
    zIndex: 8,
    pointerEvents: "none",
  };
};

// ─── Week-view style ──────────────────────────────────────────────────────────
const appointmentStyle = (appt) => {
  const s = apptStart(appt),
    e = apptEnd(appt);
  const total = Math.max(1, WORK_END.value - WORK_START.value) * 60;
  return {
    top: `${((s - WORK_START.value * 60) / total) * 100}%`,
    height: `${((e - s) / total) * 100}%`,
  };
};

// ─── Cell interaction ─────────────────────────────────────────────────────────
const onCellClick = (dent, slot, minute = slot.minute) =>
  emit("slot-click", { dentist: dent, hour: slot.hour, minute });

const onCellClickGuard = (event, dent, slot) => {
  if (dragCreate.mouseDown || dragCreate.active) return;

  const clicked = getMinutesFromMouse(event, event.currentTarget);
  const minute = clicked === null ? slot.minute : clicked % 60;

  const startMins = slot.hour * 60 + minute;

  const availability = getMinuteRangeAvailability(
    dent,
    startMins,
    startMins + INTERVAL_MINS,
  );

  const isUnavailable = !isDentistAvailable(dent.id);
  const isOutOfHours = !availability.available;

  // ✅ ALWAYS allow opening modal
  emit("slot-click", {
    dentist: dent,
    hour: slot.hour,
    minute,
    startMins,

    // NEW META FLAGS
    meta: {
      isOutOfHours,
      isUnavailable,
      message: availability.message || null,
    },
  });
};

const openPatient = (appt) => {
  if (appt.patientId) router.push(`/patients/${appt.patientId}`);
};

// ─── Drag-to-create ───────────────────────────────────────────────────────────
const dragCreate = reactive({
  mouseDown: false,
  active: false,
  dentistId: null,
  startMins: null,
  endMins: null,
});

const dragCreateLabel = computed(() => {
  if (dragCreate.startMins === null || dragCreate.endMins === null) return "";
  return `${formatRange12Hour(dragCreate.startMins, dragCreate.endMins)} (${dragCreate.endMins - dragCreate.startMins} min)`;
});

function getMinutesFromMouse(event, targetCell = null) {
  const cell = targetCell || event.currentTarget;
  if (!cell) return null;
  const hour = Number(cell.dataset.hour);
  const rect = cell.getBoundingClientRect();
  if (!rect?.height) return hour * 60;
  const relY = Math.min(Math.max(event.clientY - rect.top, 0), rect.height);
  return (
    hour * 60 +
    Math.min(
      Math.floor(relY / (rect.height / MICRO_PER_HR)),
      MICRO_PER_HR - 1,
    ) *
      INTERVAL_MINS
  );
}

function onSlotMouseDown(event, dent, slot) {
  if (event.button !== 0 || event.target.closest(".appointment-card")) return;
  event.preventDefault();
  const mins = getMinutesFromMouse(event, event.currentTarget);
  if (
    mins === null ||
    !getMinuteRangeAvailability(dent, mins, mins + INTERVAL_MINS).available
  )
    return;
  Object.assign(dragCreate, {
    mouseDown: true,
    dentistId: dent.id,
    startMins: mins,
    endMins: mins + INTERVAL_MINS,
  });
  window.addEventListener("mousemove", onGlobalMouseMove);
  window.addEventListener("mouseup", onGlobalMouseUp);
}

function onGlobalMouseMove(event) {
  if (!dragCreate.mouseDown) return;
  const el = document.elementFromPoint(event.clientX, event.clientY);
  const cell = el?.closest?.("[data-dentist-id]");
  if (!cell || String(cell.dataset.dentistId) !== String(dragCreate.dentistId))
    return;
  dragCreate.active = true;
  const cur = getMinutesFromMouse(event, cell);
  if (cur === null) return;
  if (cur < dragCreate.startMins) {
    dragCreate.endMins = dragCreate.startMins + INTERVAL_MINS;
    dragCreate.startMins = cur;
  } else {
    dragCreate.endMins = cur + INTERVAL_MINS;
  }
}

function onGlobalMouseUp() {
  if (!dragCreate.mouseDown) return;
  const { startMins, endMins, dentistId } = dragCreate;
  window.removeEventListener("mousemove", onGlobalMouseMove);
  window.removeEventListener("mouseup", onGlobalMouseUp);
  dragCreate.mouseDown = false;
  dragCreate.active = false;
  if (startMins === null || endMins === null || endMins <= startMins) {
    resetDragCreate();
    return;
  }
  const dentist = visibleDentists.value.find(
    (d) => String(d.id) === String(dentistId),
  );
  emit("slot-click", {
    dentist,
    hour: Math.floor(startMins / 60),
    minute: startMins % 60,
    duration: endMins - startMins,
  });
  resetDragCreate();
}

function onSlotMouseUp() {
  /* handled by global listener */
}

function isHourInDragRange(hour) {
  if (!dragCreate.active || dragCreate.startMins === null) return false;
  return (
    dragCreate.startMins < (hour + 1) * 60 && dragCreate.endMins > hour * 60
  );
}

function getDragCreateGhostStyle(hour) {
  if (!dragCreate.active || dragCreate.startMins === null) return null;
  const hs = hour * 60,
    he = (hour + 1) * 60;
  if (dragCreate.startMins >= he || dragCreate.endMins <= hs) return null;
  const os = Math.max(dragCreate.startMins, hs);
  const oe = Math.min(dragCreate.endMins, he);
  return {
    top: `${((os - hs) / 60) * 100}%`,
    height: `${((oe - os) / 60) * 100}%`,
    position: "absolute",
    left: "4px",
    right: "4px",
    zIndex: 20,
    backgroundColor: "rgba(99,102,241,0.2)",
    border: "2px solid #6366f1",
    borderRadius: "6px",
    pointerEvents: "none",
  };
}

function resetDragCreate() {
  Object.assign(dragCreate, {
    mouseDown: false,
    active: false,
    dentistId: null,
    startMins: null,
    endMins: null,
  });
}

// ─── Drag-to-move ─────────────────────────────────────────────────────────────
const hoverSlot = ref({ dentistId: null, hour: null });
const clipboardDropTarget = ref({ dentistId: null, hour: null });

const isClipboardDataTransfer = (event) => {
  if (!event?.dataTransfer) return false;
  if ((event.dataTransfer.types || []).includes(CLIPBOARD_MIME)) return true;
  try {
    return (
      JSON.parse(event.dataTransfer.getData("text/plain"))?.type ===
      "clipboard-draft"
    );
  } catch {
    return false;
  }
};

const onAppointmentDragStart = (event, appt, dentistId) => {
  const p = JSON.stringify({
    dentistId,
    appointmentId: appt?.id,
    start: appt?.start || appt?.startTime,
    end: appt?.end || appt?.endTime,
    date: appt?.date || activeDate.value,
  });
  event?.dataTransfer?.setData(DRAG_MIME, p);
  event?.dataTransfer?.setData("text/plain", p);
  if (event?.dataTransfer) event.dataTransfer.effectAllowed = "move";
};
const onAppointmentDragEnd = () => {
  hoverSlot.value = { dentistId: null, hour: null };
};

const onSlotDragOver = (event) => {
  event.preventDefault();
  const { dentistId, hour } = event.currentTarget.dataset;
  if (event.dataTransfer)
    event.dataTransfer.dropEffect =
      dentistId && !isSlotDisabled(dentistId, parseInt(hour, 10))
        ? isClipboardDataTransfer(event)
          ? "copy"
          : "move"
        : "none";
};
const onSlotDragEnter = (event, dent, slot) => {
  event.preventDefault();
  if (!isDentistAvailable(dent.id) || isSlotDisabled(dent.id, slot.hour))
    return;
  if (isClipboardDataTransfer(event))
    clipboardDropTarget.value = { dentistId: dent.id, hour: slot.hour };
  else hoverSlot.value = { dentistId: dent.id, hour: slot.hour };
};
const onSlotDragLeave = (event, dent, slot) => {
  if (
    clipboardDropTarget.value.dentistId === dent.id &&
    clipboardDropTarget.value.hour === slot.hour
  )
    clipboardDropTarget.value = { dentistId: null, hour: null };
};

const isHoverSlot = (did, h) =>
  hoverSlot.value.dentistId === did && hoverSlot.value.hour === h;
const isClipboardDropTarget = (did, h) =>
  clipboardDropTarget.value.dentistId === did &&
  clipboardDropTarget.value.hour === h;

const onClipboardDrop = (event, dentist, slot) => {
  event.preventDefault();
  clipboardDropTarget.value = { dentistId: null, hour: null };
  if (!isDentistAvailable(dentist.id)) {
    emit("slot-full", {
      dentist,
      hour: slot.hour,
      unavailable: true,
      message: `${dentist.name} is not available on this day.`,
    });
    return;
  }
  const raw =
    event?.dataTransfer?.getData(CLIPBOARD_MIME) ||
    event?.dataTransfer?.getData("text/plain");
  if (!raw) return;
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return;
  }
  if (data.type !== "clipboard-draft" && !data.draft) return;
  const draft = data.draft;
  if (!draft) return;

  const rect = event.currentTarget?.getBoundingClientRect();
  let newStart = slot.hour * 60;
  if (rect?.height) {
    const relY = Math.min(Math.max(event.clientY - rect.top, 0), rect.height);
    newStart =
      slot.hour * 60 +
      Math.min(
        Math.floor(relY / (rect.height / MICRO_PER_HR)),
        MICRO_PER_HR - 1,
      ) *
        INTERVAL_MINS;
  }
  const duration = draft.duration || INTERVAL_MINS;
  const avail = getMinuteRangeAvailability(
    dentist,
    newStart,
    newStart + duration,
  );
  if (!avail.available) {
    emit("slot-full", {
      dentist,
      hour: slot.hour,
      outOfHours: true,
      message: avail.message,
    });
    return;
  }
  emit("create-from-draft", {
    draft,
    dentistId: dentist.id,
    date: activeDate.value,
    start: toHHMM(newStart),
    duration,
  });
};

const onAppointmentDrop = (event, dentist, slot) => {
  event.preventDefault();
  event.stopPropagation();
  if (!isDentistAvailable(dentist.id)) {
    emit("slot-full", {
      dentist,
      hour: slot.hour,
      unavailable: true,
      message: `${dentist.name} is not available on this day.`,
    });
    return;
  }
  hoverSlot.value = { dentistId: null, hour: null };
  if (isClipboardDataTransfer(event)) {
    onClipboardDrop(event, dentist, slot);
    return;
  }

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
  if (payload.type === "clipboard-draft") {
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
    newStart =
      slot.hour * 60 +
      Math.floor(relY / (rect.height / MICRO_PER_HR)) * INTERVAL_MINS;
  }
  const avail = getMinuteRangeAvailability(dentist, newStart, newStart + dur);
  if (!avail.available) {
    emit("slot-full", {
      dentist,
      hour: slot.hour,
      outOfHours: true,
      message: avail.message,
    });
    return;
  }

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
      start: toHHMM(newStart),
      end: toHHMM(newStart + dur),
    },
    appointment: payload,
  });
};

// ─── Resize ───────────────────────────────────────────────────────────────────
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

/**
 * FIX 1: onResizeStart — use the same appt?.start || appt?.startTime fallback
 * pattern used everywhere else in this file, so both field naming conventions work.
 *
 * FIX 2: Attach global window listeners for resize mousemove/mouseup so the
 * user can move the mouse anywhere (even outside the scroll host) without
 * losing the resize. The resize-capture-overlay (now inside .grid-scroll-host)
 * also catches events when the pointer stays inside the scroll area.
 */
function onResizeStart({ event, appt, direction }, dentist) {
  // Prevent text selection and drag-to-move from firing during resize
  event?.preventDefault?.();
  event?.stopPropagation?.();

  // FIX: Use the same dual-field fallback that apptStart/apptEnd use
  const startMins = toMins(appt?.start || appt?.startTime);
  const endMins = toMins(appt?.end || appt?.endTime);

  Object.assign(resizing, {
    active: true,
    direction,
    appt,
    dentist,
    origStart: startMins,
    origEnd: endMins,
    curStart: startMins,
    curEnd: endMins,
  });

  document.body.style.cursor = "ns-resize";
  document.body.style.userSelect = "none";

  // FIX: Use global window listeners so resize works even when mouse
  // leaves the scroll container or the resize-capture-overlay
  window.addEventListener("mousemove", onGlobalResizeMove);
  window.addEventListener("mouseup", onGlobalResizeEnd);
}

/**
 * FIX: Replaced onResizeMove (which used a fixed-position overlay and
 * elementFromPoint — both broken by the scroll host's overflow:auto) with a
 * global window listener that computes the target hour row directly from
 * measured DOM positions, correctly accounting for scroll offset.
 *
 * Strategy:
 *  1. Get all slot-cell elements from the live DOM (they have data-hour).
 *  2. Find which cell's bounding rect contains the current mouse Y.
 *  3. Compute the snapped minute within that cell.
 *  4. Update resizing.curStart or resizing.curEnd accordingly.
 */
function onGlobalResizeMove(event) {
  if (!resizing.active) return;

  const grid = calendarGrid.value;
  if (!grid) return;

  // Find which slot-cell the mouse is currently over by checking bounding rects.
  // We only care about the dentist column that owns the appointment being resized.
  const dentistId = String(resizing.dentist?.id);
  const cells = Array.from(
    grid.querySelectorAll(`.slot-cell[data-dentist-id="${dentistId}"]`),
  );

  let targetCell = null;
  let clampedY = event.clientY;

  // Find the cell whose vertical rect contains the mouse
  for (const cell of cells) {
    const rect = cell.getBoundingClientRect();
    if (event.clientY >= rect.top && event.clientY <= rect.bottom) {
      targetCell = cell;
      break;
    }
  }

  // If mouse is above the first cell or below the last cell, clamp to boundary
  if (!targetCell && cells.length) {
    const firstRect = cells[0].getBoundingClientRect();
    const lastRect = cells[cells.length - 1].getBoundingClientRect();

    if (event.clientY < firstRect.top) {
      targetCell = cells[0];
      clampedY = firstRect.top + 1;
    } else if (event.clientY > lastRect.bottom) {
      targetCell = cells[cells.length - 1];
      clampedY = lastRect.bottom - 1;
    }
  }

  if (!targetCell) return;

  const hour = Number(targetCell.dataset.hour);
  const rect = targetCell.getBoundingClientRect();
  const relY = Math.min(Math.max(clampedY - rect.top, 0), rect.height);

  // Snap to INTERVAL_MINS boundaries within the hour
  const microSlotIndex = Math.min(
    Math.floor(relY / (rect.height / MICRO_PER_HR)),
    MICRO_PER_HR - 1,
  );
  const mins = hour * 60 + microSlotIndex * INTERVAL_MINS;

  if (resizing.direction === "bottom") {
    resizing.curEnd = Math.max(
      resizing.origStart + INTERVAL_MINS,
      mins + INTERVAL_MINS,
    );
  } else {
    resizing.curStart = Math.min(resizing.origEnd - INTERVAL_MINS, mins);
  }
}

/**
 * FIX: Global mouseup handler for resize, paired with onGlobalResizeMove.
 * Cleans up listeners, resets cursor, and emits the move-appointment event.
 */
function onGlobalResizeEnd() {
  if (!resizing.active) return;

  window.removeEventListener("mousemove", onGlobalResizeMove);
  window.removeEventListener("mouseup", onGlobalResizeEnd);

  document.body.style.cursor = "";
  document.body.style.userSelect = "";

  const newStart = toHHMM(resizing.curStart);
  const newEnd = toHHMM(resizing.curEnd);

  emit("move-appointment", {
    appointmentId: resizing.appt?.id,
    from: {
      dentistId: resizing.dentist?.id,
      date: resizing.appt?.date || activeDate.value,
      start: resizing.appt?.start || resizing.appt?.startTime,
      end: resizing.appt?.end || resizing.appt?.endTime,
    },
    to: {
      dentistId: resizing.dentist?.id,
      date: resizing.appt?.date || activeDate.value,
      start: newStart,
      end: newEnd,
    },
    appointment: resizing.appt,
  });

  emit("open-appointment", {
    appt: { ...resizing.appt, start: newStart, end: newEnd },
    dentist: resizing.dentist,
  });

  resizing.active = false;
  resizing.appt = null;
}

/**
 * FIX: Handler for when mouse leaves the resize-capture-overlay.
 * We do NOT end the resize here — onGlobalResizeMove/End on window
 * continue tracking even outside the overlay, so the resize stays live.
 */
function onResizeOverlayLeave() {
  // Intentionally empty — global listeners handle out-of-bounds movement.
}

// Keep these as no-ops / aliases so any legacy references don't break,
// but all actual work is done by the global handlers above.
const onResizeMove = () => {};
const onResizeEnd = () => {};
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

/*
 * ── Scroll host ──
 * Single scrollable container. Both .calendar-grid and .overlay-layer are
 * children, so they scroll as one unit. No overflow clipping on any child.
 */
.grid-scroll-host {
  position: relative; /* containing block for .overlay-layer */
  overflow: auto;
  height: 73vh;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #eef2f7;
}

/* ── Day-view grid ── */
.calendar-grid {
  display: grid;
  grid-template-columns: 72px repeat(var(--cols, 3), minmax(260px, 1fr));
  grid-auto-rows: auto;
  /* NO overflow property here — only .grid-scroll-host clips */
}

/* Sticky header row */
.header-sticky {
  position: sticky;
  top: 0;
  z-index: 50;
}

.time-head {
  height: 52px; /* = HEADER_ROW_PX */
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
  height: 52px; /* = HEADER_ROW_PX */
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

/* Time label cells */
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
  /*
   * Must equal HOUR_ROW_PX (165px):
   *   slot-grid: pad-top 6 + 4 rows×36 + 3 gaps×3 + pad-bottom 6 = 165
   */
  min-height: 165px;
}

/* Slot cells — interaction surface only */
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
  cursor: pointer;
  background: #f5f5f5;
  opacity: 0.6;
}
.slot-cell.slot-disabled::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 10px,
    rgba(200, 200, 200, 0.1) 10px,
    rgba(200, 200, 200, 0.1) 20px
  );
}
.slot-cell.drop-hover {
  background: #eef2ff;
  box-shadow: inset 0 0 0 2px #c7d2fe;
}
.slot-cell.slot-hover {
  background: rgba(99, 102, 241, 0.04);
}
.slot-cell.clipboard-hover {
  background: rgba(109, 74, 255, 0.08);
  box-shadow: inset 0 0 0 2px #6d4aff;
}

/* Micro-slot rhythm grid */
.slot-grid {
  display: grid;
  grid-template-rows: repeat(4, 36px);
  gap: 3px;
  padding: 6px 8px; /* 6+4×36+3×3+6 = 165 = HOUR_ROW_PX ✓ */
  position: relative;
  overflow: visible;
}
.empty-micro-slot {
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

/* Drag-create ghost (scoped to one cell, OK to clip) */
.drag-create-ghost {
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
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

/* Clipboard hover indicator */
.clipboard-drop-indicator {
  position: absolute;
  inset: 0;
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
  color: #fff;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

/* Break overlay (inside .overlay-col) */
.break-overlay {
  /* top / height set inline via getBreakOverlayStyle() */
  left: 0;
  right: 0;
  background: repeating-linear-gradient(
    45deg,
    rgba(239, 68, 68, 0.2),
    rgba(239, 68, 68, 0.2) 10px,
    rgba(239, 68, 68, 0.35),
    rgba(239, 68, 68, 0.35) 20px
  );
  border: 2px solid rgba(239, 68, 68, 0.5);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.break-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.break-label {
  background: rgba(239, 68, 68, 0.95);
  color: #fff;
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
  color: #fff;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 500;
  white-space: nowrap;
}

.zone-overlay {
  position: absolute;
  left: 4px;
  right: 4px;
  border-radius: 10px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 8px;
  box-sizing: border-box;
  overflow: hidden;
}
.zone-overlay-week {
  left: 4px;
  right: 4px;
}
.zone-label {
  font-size: 11px;
  font-weight: 700;
  color: #111827;
  line-height: 1.2;
  max-width: 100%;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

/*
 * ── Resize capture overlay ──
 * FIX: Now position:absolute inside .grid-scroll-host (position:relative)
 * instead of position:fixed. This means it scrolls with the grid content,
 * covers the exact same area as the calendar, and doesn't interfere with
 * elements outside the scroll host. z-index:200 puts it above appointment
 * cards (z-index:20-30) and break overlays (z-index:101) so all mouse
 * events during resize are captured reliably.
 */
.resize-capture-overlay {
  position: absolute;
  inset: 0;
  z-index: 200;
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

:deep(.calendar-head-menu) {
  border-radius: 12px !important;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.14) !important;
  border: 1px solid #e5e7eb !important;
  overflow: hidden;
}
:deep(.calendar-head-menu .v-list) {
  padding: 6px !important;
  background: #fff !important;
}
:deep(.calendar-head-menu .v-list-item) {
  min-height: 40px !important;
  border-radius: 8px !important;
  padding: 0 12px !important;
}
:deep(.calendar-head-menu .v-list-item:hover) {
  background: #f0f4ff !important;
}
:deep(.calendar-head-menu .v-list-item-title) {
  font-size: 13px !important;
  color: #1f2937 !important;
}
</style>