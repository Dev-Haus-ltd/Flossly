<template>
  <div class="calendar-wrap">
    <!-- Day mode (content-driven grid) -->
    <template v-if="view === 'day'">
      <div class="calendar-grid" :style="{ '--cols': visibleDentists.length }">
        <!-- Top-left head cell -->
        <div class="time-head" style="grid-row: 1; grid-column: 1;"></div>

        <!-- Dentist headers (row 1, columns 2..N) -->
        <div
          v-for="(dent, ci) in visibleDentists"
          :key="dent.id"
          class="dentist-head"
          :style="{ gridRow: 1, gridColumn: ci + 2 }"
        >
          <div class="avatar">{{ initials(dent?.name) }}</div>
          <div class="dentist-head-text">
            <div class="name">{{ dent.name }}</div>
            <div class="subtitle">Today's Appointment: {{ (appointments[dent.id]||[]).length }} Patient(s)</div>
          </div>
          <div class="header-actions">
            <v-btn icon="mdi-file-outline" size="28" variant="text" @click="$emit('open-notes', dent)"></v-btn>
            <v-btn icon="mdi-dots-horizontal" size="28" variant="text"></v-btn>
          </div>
        </div>

        <!-- Rows: one per HOUR. Each row shows 4 vertical appointment slots. -->
        <template v-for="(t, ri) in timeSlots" :key="t.key">
          <!-- Time label (show hour) -->
          <div class="time-cell" :style="{ gridRow: ri + 2, gridColumn: 1 }">
            {{ t.label }}
          </div>

          <!-- Dentist slot cells for this hour row -->
          <div
            v-for="(dent, ci) in visibleDentists"
            :key="dent.id + '-' + t.key"
            class="slot-cell"
            :class="{ 'slot-full': isHourFull(dent.id, t.hour) }"
            :style="{ gridRow: ri + 2, gridColumn: ci + 2 }"
            @click="onCellClickGuard(dent, t)"
            :title="isHourFull(dent.id, t.hour) ? 'No available 15-min slots in this hour' : ''"
          >
            <div class="slot-grid">
              <!-- Render appointments that START in this hour -->
              <template v-for="(appt, i) in getAppointmentsForHour(dent.id, t.hour)" :key="i">
                <AppointmentCard
                  :appt="appt"
                  :micro-slots="getMicroSlots(appt)"
                  :style-obj="apptStyleFor(appt.status)"
                  :status-colors="statusColors"
                  @update-status="$emit('update-status', { appt, status: $event, dentistId: dent.id })"
                  @open-patient="openPatient"
                  @click.stop
                />
              </template>
              <!-- Calculate remaining empty slots -->
              <div 
                v-for="n in getRemainingSlots(dent.id, t.hour)" 
                :key="'empty-' + n" 
                class="empty-slot"
              ></div>
            </div>
          </div>
        </template>
      </div>
    </template>

    <!-- Week mode: stack days vertically (kept from original) -->
    <template v-else>
      <div v-for="(d, di) in weekDates" :key="d" class="week-day-section">
        <div class="week-day-header">{{ weekLabels[di] }}</div>
        <div class="grid" :style="{ '--cols': visibleDentists.length }">
          <div class="time-col">
            <div v-for="t in timeSlots" :key="t.key" class="time-cell">
              {{ t.label }}
            </div>
          </div>
          <div class="dentist-col" v-for="dent in visibleDentists" :key="dent.id">
            <div class="dentist-header">
              <div class="avatar" />
              <div class="name">{{ dent.name }}</div>
            </div>
            <div class="slot-col" :style="{ height: columnHeight + 'px' }">
              <div v-for="t in timeSlots" :key="t.key" class="slot-cell" @click="onCellClick(dent, t)" />
              <div class="appt-layer">
                <div v-if="isToday(d)" class="now-line" :style="{ top: nowTop + '%' }"></div>
                <div v-for="(appt, i) in (appointments[dent.id] || []).filter(a => a.date === d)" :key="i" class="appt" :style="{ ...appointmentStyle(appt), ...apptStyleFor(appt.status) }" @click.stop="openPatient(appt)">
                  <div class="appt-title">{{ appt.patient }}</div>
                  <div class="appt-time">{{ appt.start }} - {{ appt.end }}</div>
                  <div class="appt-footer">
                    <v-chip size="x-small" variant="flat" :style="{ background: apptStyleFor(appt.status).chip, color: 'white' }">{{ appt.status || 'Pending' }}</v-chip>
                    <v-chip v-if="appt.treatmentName" class="ml-2" size="x-small" variant="elevated" color="primary">{{ appt.treatmentName }}</v-chip>
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
import AppointmentCard from '@/components/diary/calendar/AppointmentCard.vue'
import { clinicMinutesFromTime, formatDateDDMMYYYY } from '@/lib/dateFormatter'
  const props = defineProps({
  date: { type: [String, Date], required: true },
  view: { type: String, default: 'day' },
  dentists: { type: Array, default: () => [] },
  selectedDentistIds: { type: Array, default: () => [] },
  appointments: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['slot-click','update-status','open-notes','slot-full'])
const router = useRouter()
function initials(name) {
  if (!name) return '';
  const parts = String(name).trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
const defaultStart = 9
const defaultEnd = 17
const intervalMins = 15
const maxMicroSlots = 4 // Each 15-min slot can hold 4 appointments side-by-side

const allAppts = computed(() => Object.values(props.appointments || {}).flat())
const parseHM = (t) => {
  if (!t || typeof t !== 'string') return null
  const [h, m] = t.split(':').map((n) => parseInt(n, 10))
  if (isNaN(h) || isNaN(m)) return null
  return h * 60 + m
}

// Show only standard working hours (09:00–17:00)
const startHourC = computed(() => defaultStart)
const endHourC = computed(() => defaultEnd)

const timeSlots = computed(() => {
  const slots = []
  // Create one slot per HOUR instead of per 15 minutes
  for (let h = startHourC.value; h <= endHourC.value; h++) {
    const label = h === 0 ? '12AM' : h < 12 ? `${h}AM` : h === 12 ? '12PM' : `${h - 12}PM`
    slots.push({ 
      key: `${String(h).padStart(2,'0')}:00`, 
      hour: h, 
      minute: 0, 
      label, 
      isHour: true 
    })
  }
  return slots
})

const weekDates = computed(() => {
  const base = new Date(props.date)
  const day = base.getDay()
  const diff = (day + 6) % 7
  const start = new Date(base); start.setDate(base.getDate() - diff)
  const arr = []
  for (let i=0;i<7;i++){ const d=new Date(start); d.setDate(start.getDate()+i); arr.push(d.toISOString().slice(0,10)) }
  return arr
})

const weekLabels = computed(() => weekDates.value.map((d)=>{
  return formatDateDDMMYYYY(d)
}))

const visibleDentists = computed(() => {
  const ids = (props.selectedDentistIds || []).map(String)
  if (!ids.length) return props.dentists
  return props.dentists.filter(d => ids.includes(String(d.id)))
})

const onCellClick = (dent, slot) => {
  emit('slot-click', { dentist: dent, hour: slot.hour, minute: slot.minute })
}
const onCellClickGuard = (dent, slot) => {
  if (isHourFull(dent.id, slot.hour)) {
    emit('slot-full', { dentist: dent, hour: slot.hour })
    return
  }
  onCellClick(dent, slot)
}

  const appointmentStartMinutes = (appt) => {
    const mins = clinicMinutesFromTime(appt?.start || appt?.startTime || appt?.time || appt?.startTime)
    return typeof mins === 'number' ? mins : 0
  }
  const toMinutes = (time) => {
    const mins = clinicMinutesFromTime(time)
    return typeof mins === 'number' ? mins : 0
  }

const isApptInCell = (appt, slot) => {
  const start = toMinutes(appt.start)
  const end = toMinutes(appt.end)
  const cell = slot.hour * 60 + slot.minute
  const nextCell = cell + intervalMins
  return start < nextCell && end > cell
}

// Render an appointment only in the hour it starts in
const startsInHour = (appt, hour) => {
  const startTime = appt?.start || appt?.startTime
  if (!startTime) return false
  const start = toMinutes(startTime)
  const hourStart = hour * 60
  const hourEnd = (hour + 1) * 60
  return start >= hourStart && start < hourEnd
}

// Calculate how many 15-min "micro-slots" an appointment occupies
const getMicroSlots = (appt) => {
  const startTime = appt?.start || appt?.startTime
  const endTime = appt?.end || appt?.endTime
  if (!startTime || !endTime) return 1
  const start = toMinutes(startTime)
  const end = toMinutes(endTime)
  const duration = end - start
  return Math.max(1, Math.ceil(duration / intervalMins))
}

// Get appointments that start in this hour
  function getAppointmentsForHour(dentistId, hour) {
    return (props.appointments[dentistId] || [])
      .filter(appt => {
        if (!appt?.start && !appt?.startTime) return false
        return startsInHour(appt, hour)
      })
      .slice()
      .sort((a, b) => appointmentStartMinutes(a) - appointmentStartMinutes(b))
  }

// Calculate how many empty slots to show (max 4 per hour)
function getRemainingSlots(dentistId, hour) {
  const apptsInHour = getAppointmentsForHour(dentistId, hour)
  
  // Calculate total slots occupied by considering appointment durations
  let occupiedSlots = 0
  apptsInHour.forEach(appt => {
    const duration = getMicroSlots(appt) // This gives us how many 15-min slots it takes
    occupiedSlots += Math.min(duration, maxMicroSlots) // Cap at 4 slots per hour
  })
  
  return Math.max(0, maxMicroSlots - occupiedSlots)
}

function isHourFull(dentistId, hour) {
  return getRemainingSlots(dentistId, hour) <= 0
}

const appointmentStyle = (appt) => {
  const start = toMinutes(appt.start)
  const end = toMinutes(appt.end)
  const dayStart = startHourC.value * 60
  const totalMinutes = Math.max(1, (endHourC.value - startHourC.value)) * 60
  const topPct = ((start - dayStart) / totalMinutes) * 100
  const heightPct = ((end - start) / totalMinutes) * 100
  return {
    top: `${topPct}%`,
    height: `${heightPct}%`,
  }
}
const columnHeight = computed(() => (endHourC.value - startHourC.value) * 100)

const statusColors = {
  'Pending':   { bg: '#fceaf6', border: '#f4c3df', chip: '#d948a8', text:'#37223b' },
  'Confirmed': { bg: '#ede8ff', border: '#cfc2ff', chip: '#6d4aff', text:'#2d2565' },
  'Arrived':   { bg: '#e8f0ff', border: '#c7d8ff', chip: '#397bff', text:'#1b3260' },
  'In Surgery':{ bg: '#e5fbf8', border: '#baf2eb', chip: '#00b2a5', text:'#11413b' },
  'Complete':  { bg: '#e5fbea', border: '#b8f1c8', chip: '#23b96d', text:'#163b2b' },
  'Cancelled': { bg: '#ffeaea', border: '#ffbcbc', chip: '#ff5353', text:'#441d1d' },
  'Did not attend': { bg: '#fff2e0', border: '#ffd4a3', chip: '#ffa12e', text:'#573a0d' },
};

const apptStyleFor = (status) => {
  const c = statusColors[status] || statusColors['Pending']
  return { background: c.bg, borderColor: c.border, color: c.text }
}

const openPatient = (appt) => {
  if(appt.patientId) {
    router.push(`/patients/${appt.patientId}`)
  }
  }

const showNow = computed(() => isToday(String(props.date).slice(0,10)))
function isToday(ds){ const today = new Date().toISOString().slice(0,10); return ds === today }
const nowTop = computed(() => {
  const now = new Date(); const mins = now.getHours()*60 + now.getMinutes()
  const dayStart = startHourC.value*60
  const total = Math.max(1,(endHourC.value - startHourC.value))*60
  return ((mins - dayStart)/total)*100
})
</script>

<style scoped>
/* ───────────────────────────────
   CALENDAR BASE
─────────────────────────────── */
.calendar-wrap {
  width: 100%;
  overflow-x: auto;
  background-color: #fafafa;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  height: 75vh;
}

/* ───────────────────────────────
   NEW DAY-VIEW GRID (content-driven)
─────────────────────────────── */
.calendar-grid {
  display: grid;
  grid-template-columns: 90px repeat(var(--cols, 3), minmax(var(--dent-col-min, 420px), max-content));
  grid-auto-rows: auto; /* each 15-min slot row grows with tallest cell */
  background-color: #e5e7eb;
}

/* Dentist header cells (row 1, columns 2..N) */
.dentist-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #fff;
  border-left: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
  min-width: var(--dent-col-min, 420px);
}

/* Top-left time head (row 1, col 1) */
.time-head {
  height: 64px;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
}

/* Time cells (column 1, rows >= 2) */
.time-cell {
  background: #fff;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 12px 12px 0 0;
  border-right: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
  min-height: 120px; /* minimum row height for hour block */
}

/* Slot cells (dentist columns) */
.slot-cell {
  background: #fff;
  border-left: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
  min-width: var(--dent-col-min, 420px);
  cursor: pointer;
  transition: background 0.15s ease;
}

.slot-cell:hover {
  background: #f9fafb;
}

.slot-cell.slot-full {
  cursor: not-allowed;
  background: #f8f8f8;
  opacity: 0.7;
}

.slot-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  min-height: 380px; /* 4 slots * 90px + gaps */
}

.empty-slot {
  background: #f9fafb;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  min-height: 84px;
  flex: 1;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 12px;
}

.empty-slot:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
  cursor: pointer;
}

/* ───────────────────────────────
   GRID LAYOUT (week view)
─────────────────────────────── */
.grid {
  display: grid;
  grid-template-columns: 80px repeat(var(--cols, 3), 1fr);
  background-color: #e5e7eb;
  position: relative;
}

.grid::after {
  content: '';
  position: absolute;
  top: 0;
  left: 80px; /* match time col */
  right: 0;
  bottom: 0;
  background: repeating-linear-gradient(
    to bottom,
    transparent,
    transparent 59px,
    rgba(229, 231, 235, 0.6) 60px
  );
  pointer-events: none;
}

/* ───────────────────────────────
   TIME COLUMN (week view)
─────────────────────────────── */
.time-col {
  background: #fff;
  border-right: 1px solid #e5e7eb;
}

/* ───────────────────────────────
   DENTIST COLUMNS (week view)
─────────────────────────────── */
.dentist-col {
  background: #fff;
  border-left: 1px solid #e5e7eb;
  min-width: 300px;
}

.dentist-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #e6eaf5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #1e2b80;
}

.dentist-head-text {
  display: flex;
  flex-direction: column;
  margin-left: 8px;
}

.dentist-head-text .name {
  font-weight: 600;
  font-size: 14px;
  color: #111827;
}

.dentist-head-text .subtitle {
  font-size: 12px;
  color: #6b7280;
}

.header-actions {
  margin-left: auto;
  display: flex;
  gap: 6px;
}

/* ───────────────────────────────
   TIME GRID AREA (week view)
─────────────────────────────── */
.slot-col {
  position: relative;
  height: 720px;
  background: repeating-linear-gradient(
    to bottom,
    #fff,
    #fff 59px,
    #f9fafb 60px
  );
  cursor: pointer;
}

/* ───────────────────────────────
   CURRENT TIME INDICATOR (week view)
─────────────────────────────── */
.now-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: #ff3b30;
  opacity: 0.8;
  z-index: 5;
}

/* ───────────────────────────────
   APPOINTMENTS (week view overlay)
─────────────────────────────── */
.appt-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.appt-body { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.appt-icon { width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: rgba(0, 0, 0, 0.08); }
.appt-content { flex: 1; }
.appt-title { font-weight: 600; font-size: 14px; color: #1f2937; }
.appt-time { font-size: 12px; color: #4b5563; }
.appt-notes { font-size: 12px; color: #4b5563; margin-top: 2px; display: flex; align-items: center; }
.appt-controls { width: 130px; }

/* ───────────────────────────────
   STATUS SELECT
─────────────────────────────── */
.status-select :deep(.v-field) { border-radius: 10px; min-height: 28px; background: white; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06); }
.status-select :deep(.v-field__input) { padding: 0 6px; }
.select-chip { display: flex; align-items: center; gap: 6px; font-size: 13px; }
.dot { width: 8px; height: 8px; border-radius: 50%; }

/* ───────────────────────────────
   APPOINTMENT FOOTER
─────────────────────────────── */
.appt-footer-row { display: flex; justify-content: flex-end; margin-top: 6px; }
.treatment-pill { border-radius: 999px; font-size: 12px; font-weight: 500; padding: 0 10px; height: 22px; }

/* ───────────────────────────────
   WEEK VIEW HEADERS
─────────────────────────────── */
.week-day-section { margin-bottom: 24px; }
.week-day-header { font-weight: 600; color: #374151; margin: 8px 0 6px 8px; }

/* ───────────────────────────────
   MISC
─────────────────────────────── */
.appt-title .clickable { cursor: pointer; border-radius: 6px; padding: 2px 4px; }
.appt-title .clickable:hover { background: rgba(0, 0, 0, 0.05); }
</style>
