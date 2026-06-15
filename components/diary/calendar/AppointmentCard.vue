<template>
  <!-- Compact View (15 min or less) -->
  <div
    v-if="compact"
    class="appointment-card compact"
    :style="{
      ...styleObj,
      borderLeftColor: statusColors[appt.status]?.chip || '#d948a8',
      '--status-bg': statusColors[appt.status]?.bg || '#fceaf6',
      '--status-chip': statusColors[appt.status]?.chip || '#d948a8',
    }"
    @click="$emit('open-appointment', appt)"
    @mousedown.stop="onCardMouseDown"
  >
    <!-- Resize handle top -->
    <div
      v-if="showResizeHandles"
      class="resize-handle resize-handle--top"
      @mousedown.stop.prevent="onResizeStart($event, 'top')"
      title="Drag to resize"
    ></div>

    <div class="card-inner compact">
      <div class="compact-left">
        <img :src="statusIcon" alt="status" class="status-icon compact-icon" />
        <span
          class="patient-name compact-name"
          :class="{ 'patient-name--link': demoMode && appt.patientId }"
          @click.stop="demoMode && appt.patientId && $emit('open-patient', appt)"
        >{{ appt.patient }}</span>
      </div>

      <div class="compact-right">
        <v-menu offset-y content-class="appt-status-menu" @click.stop>
          <template #activator="{ props: menuProps }">
            <div v-bind="menuProps" class="status-badge compact-badge" @click.stop>
              <span class="status-dot"></span>
              <span class="status-label">{{ shortStatus(appt.status) }}</span>
              <v-icon size="10" class="ml-1">mdi-chevron-down</v-icon>
            </div>
          </template>
          <v-list density="compact" class="appt-status-menu__list">
            <v-list-item
              v-for="status in statusOptions"
              :key="status.value"
              class="appt-status-menu__item"
              :class="{ 'appt-status-menu__item--active': normalizedStatus(appt.status) === status.value }"
              @click.stop="$emit('update-status', status.label)"
            >
              <template #prepend>
                <span
                  class="status-indicator"
                  :style="{ background: status.color }"
                ></span>
              </template>
              <v-list-item-title>{{ status.label }}</v-list-item-title>
              <template #append>
                <v-icon
                  v-if="normalizedStatus(appt.status) === status.value"
                  size="16"
                  color="primary"
                >
                  mdi-check
                </v-icon>
              </template>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </div>

    <!-- Resize handle bottom -->
    <div
      v-if="showResizeHandles"
      class="resize-handle resize-handle--bottom"
      @mousedown.stop.prevent="onResizeStart($event, 'bottom')"
      title="Drag to resize"
    ></div>
  </div>

  <!-- Full View (more than 15 min) -->
  <div
    v-else
    class="appointment-card full"
    :style="{
      ...styleObj,
      borderLeftColor: statusColors[appt.status]?.chip || '#d948a8',
      '--status-bg': statusColors[appt.status]?.bg || '#fceaf6',
      '--status-chip': statusColors[appt.status]?.chip || '#d948a8',
    }"
    @click="$emit('open-appointment', appt)"
    @mousedown.stop="onCardMouseDown"
  >
    <!-- Resize handle top -->
    <div
      v-if="showResizeHandles"
      class="resize-handle resize-handle--top"
      @mousedown.stop.prevent="onResizeStart($event, 'top')"
      title="Drag to resize"
    ></div>

    <div class="card-inner full">
      <div class="full-header">
        <div class="full-left">
          <img :src="statusIcon" alt="status" class="status-icon full-icon" />
          <div class="full-details">
            <span
              class="patient-name full-name"
              :class="{ 'patient-name--link': demoMode && appt.patientId }"
              @click.stop="demoMode && appt.patientId && $emit('open-patient', appt)"
            >{{ appt.patient }}</span>
            <div class="appointment-time">{{ displayStart }} – {{ displayEnd }}</div>
          </div>
        </div>

        <v-menu offset-y content-class="appt-status-menu" @click.stop>
          <template #activator="{ props: menuProps }">
            <div v-bind="menuProps" class="status-badge full-badge" @click.stop>
              <span class="status-dot"></span>
              <span class="status-label">{{ shortStatus(appt.status) }}</span>
              <v-icon size="10" class="ml-1">mdi-chevron-down</v-icon>
            </div>
          </template>
          <v-list density="compact" class="appt-status-menu__list">
            <v-list-item
              v-for="status in statusOptions"
              :key="status.value"
              class="appt-status-menu__item"
              :class="{ 'appt-status-menu__item--active': normalizedStatus(appt.status) === status.value }"
              @click.stop="$emit('update-status', status.label)"
            >
              <template #prepend>
                <span
                  class="status-indicator"
                  :style="{ background: status.color }"
                ></span>
              </template>
              <v-list-item-title>{{ status.label }}</v-list-item-title>
              <template #append>
                <v-icon
                  v-if="normalizedStatus(appt.status) === status.value"
                  size="16"
                  color="primary"
                >
                  mdi-check
                </v-icon>
              </template>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>

      <div class="full-meta" v-if="appt.treatmentName || hasNotes">
        <v-tooltip v-if="hasNotes" location="bottom">
          <template #activator="{ props: tipProps }">
            <div class="meta-chip note-chip" v-bind="tipProps" @click.stop>
              <v-icon 
                size="14" 
                class="mr-1 note-icon" 
                :style="{ color: `var(--status-chip)` }"
              >mdi-note-text-outline</v-icon>
              <span class="note-text">{{ truncatedNotes }}</span>
            </div>
          </template>
          <div class="notes-tooltip">{{ appt.notes }}</div>
        </v-tooltip>
        <div
          class="meta-chip treatment-chip"
          v-if="appt.treatmentName"
          :style="treatmentChipStyle"
        >
          {{ appt.treatmentName }}
        </div>
      </div>
    </div>

    <!-- Resize handle bottom -->
    <div
      v-if="showResizeHandles"
      class="resize-handle resize-handle--bottom"
      @mousedown.stop.prevent="onResizeStart($event, 'bottom')"
      title="Drag to resize"
    ></div>
  </div>
</template>

<script setup>
import { formatTime12Hour } from '@/lib/dateFormatter'
import pendingIcon from '@/assets/diary/appointment/pending.svg'
import confirmedIcon from '@/assets/diary/appointment/confirmed.svg'
import arrivedIcon from '@/assets/diary/appointment/arrived.svg'
import inSurgeryIcon from '@/assets/diary/appointment/inSurgery.svg'
import completeIcon from '@/assets/diary/appointment/complete.svg'
import cancelledIcon from '@/assets/diary/appointment/cancelled.svg'
import dnaIcon from '@/assets/diary/appointment/didNotAttend.svg'
// import draftIcon from '@/assets/icons/mainDrawerIcons/dashboard.svg'
const props = defineProps({
  appt: { type: Object, required: true },
  microSlots: { type: Number, default: 1 },
  styleObj: { type: Object, default: () => ({}) },
  statusColors: { type: Object, required: true },
  compact: { type: Boolean, default: false },
  showResizeHandles: { type: Boolean, default: true },
  overrideStart: { type: String, default: null },
  overrideEnd: { type: String, default: null },
  demoMode: { type: Boolean, default: false },
})


const emit = defineEmits(['update-status', 'open-appointment', 'open-patient', 'resize-start'])

// Validation
const REQUIRED = ['patient', 'start', 'end', 'status', 'date']
const missing = REQUIRED.filter(f => {
  const v = props.appt?.[f]
  return v === null || v === undefined || (typeof v === 'string' && !v.trim())
})
if (missing.length) {
  throw new Error(`AppointmentCard missing: ${missing.join(', ')}`)
}

const normalizedStatus = (status) => String(status || '').trim().toLowerCase()

const statusOptions = [
  { label: 'Pending', value: 'pending', color: '#d948a8' },
  { label: 'Confirmed', value: 'confirmed', color: '#0061FB' },
  { label: 'Arrived', value: 'arrived', color: '#f59e0b' },
  { label: 'In Surgery', value: 'in surgery', color: '#8b5cf6' },
  { label: 'Complete', value: 'complete', color: '#16a34a' },
  { label: 'Cancelled', value: 'cancelled', color: '#6b7280' },
  { label: 'Did not attend', value: 'did not attend', color: '#dc2626' },
]

const iconMap = {
  // 'draft': draftIcon,
  'pending': pendingIcon,
  'confirmed': confirmedIcon,
  'arrived': arrivedIcon,
  'in surgery': inSurgeryIcon,
  'insurgery': inSurgeryIcon,
  'complete': completeIcon,
  'cancelled': cancelledIcon,
  'did not attend': dnaIcon,
  'didnotattend': dnaIcon,
}

const statusIcon = computed(() => {
  const key = String(props.appt?.status || 'pending').trim().toLowerCase()
  return iconMap[key] || pendingIcon
})

const shortStatus = (s) => {
  const map = {
    // 'Draft':'Draft',
    'Pending': 'Pending',
    'Confirmed': 'Confirmed',
    'Arrived': 'Arrived',
    'In Surgery': 'In Surgery',
    'Complete': 'Complete',
    'Cancelled': 'Cancelled',
    'Did not attend': 'DNA',
  }
  return map[s] || s
}

const displayStart = computed(() => {
  return formatTime12Hour(props.overrideStart || props.appt.start || props.appt.startTime)
})
const displayEnd = computed(() => {
  return formatTime12Hour(props.overrideEnd || props.appt.end || props.appt.endTime)
})

const hasNotes = computed(() => !!props.appt?.notes)
const truncatedNotes = computed(() => {
  if (!props.appt?.notes) return ''
  return props.appt.notes.length > 40 ? props.appt.notes.substring(0, 40) + '...' : props.appt.notes
})

const treatmentChipStyle = computed(() => {
  const key = String(props.appt?.status || '').trim()
  const color = props.statusColors?.[key]?.chip || '#1e40af'
  return { background: color, color: '#fff' }
})

const onResizeStart = (event, direction) => {
  emit('resize-start', { event, appt: props.appt, direction })
}

const onCardMouseDown = (e) => {
  e.stopPropagation()
}
</script>

<style scoped>
/* Base styles */
.appointment-card {
  background: var(--status-bg, #fceaf6);
  border-radius: 7px;
  border-left: 3px solid var(--status-chip, #d948a8);
  cursor: pointer;
  transition: box-shadow 0.15s ease, transform 0.15s ease;
  position: relative;
  box-sizing: border-box;
  user-select: none;
}

.appointment-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  z-index: 2;
}

/* Resize handles */
.resize-handle {
  position: absolute;
  left: 0;
  right: 0;
  height: 6px;
  cursor: ns-resize;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}
.resize-handle--top { top: 0; border-radius: 7px 7px 0 0; }
.resize-handle--bottom { bottom: 0; border-radius: 0 0 7px 7px; }

.resize-handle::after {
  content: '';
  display: block;
  width: 24px;
  height: 2px;
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.18);
  opacity: 0;
  transition: opacity 0.15s;
}
.appointment-card:hover .resize-handle::after { opacity: 1; }

/* Compact View */
.appointment-card.compact {
  min-height: 36px;
  height: 100%;
}

.card-inner.compact {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 5px 8px;
  height: 100%;
}

.compact-left {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.compact-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.compact-name {
  font-weight: 600;
  font-size: 11px;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}

.compact-badge {
  padding: 2px 6px;
  font-size: 9px;
}

.compact-right {
  flex-shrink: 0;
}

/* Full View */
.appointment-card.full {
  padding: 8px;
  min-height: 70px;
}

.card-inner.full {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.full-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.full-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.full-icon {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
}

.full-details {
  flex: 1;
  min-width: 0;
}

.full-name {
  font-weight: 600;
  font-size: 12px;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-align: left;
}

.appointment-time {
  font-size: 10px;
  color: #6b7280;
  margin-top: 2px;
}

.full-badge {
  padding: 2px 8px;
  font-size: 10px;
}

.full-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 10px;
  line-height: 1.2;
}

.note-chip {
  color: #4b5563;
  background: rgba(0, 0, 0, 0.03);
  cursor: default;
}

.note-icon {
  color: var(--status-chip);
  transition: color 0.2s ease;
}

.note-text {
  max-width: 150px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notes-tooltip {
  max-width: 320px;
  white-space: pre-wrap;
  font-size: 12px;
  color: #eff6ff;
}

.treatment-chip {
  background: #eff6ff;
  color: #1e40af;
  font-weight: 500;
}

/* Common styles */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  background: var(--status-chip, #d948a8);
  color: #fff;
  border-radius: 20px;
  cursor: pointer;
  white-space: nowrap;
  line-height: 1.4;
}

.status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.75);
  flex-shrink: 0;
}

.status-label { font-size: inherit; }

.patient-name--link {
  color: #0061FB;
  text-decoration: underline;
  cursor: pointer;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
  flex-shrink: 0;
}

:deep(.appt-status-menu) {
  border-radius: 12px !important;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1) !important;
  border: 1px solid #e5e7eb !important;
  overflow: hidden;
  margin-top: 6px;
}

:deep(.appt-status-menu .appt-status-menu__list) {
  padding: 6px !important;
  background: #fff !important;
  border-radius: 12px !important;
  min-width: 180px;
}

:deep(.appt-status-menu .appt-status-menu__item) {
  border-radius: 8px !important;
  min-height: 38px !important;
  padding: 0 12px !important;
  margin-bottom: 2px;
  transition: background-color 0.15s ease;
}

:deep(.appt-status-menu .appt-status-menu__item:last-child) {
  margin-bottom: 0;
}

:deep(.appt-status-menu .appt-status-menu__item:hover) {
  background: #f0f4ff !important;
}

:deep(.appt-status-menu .appt-status-menu__item--active) {
  background: #e8f1ff !important;
}

:deep(.appt-status-menu .appt-status-menu__item--active .v-list-item-title) {
  color: #0061FB !important;
  font-weight: 500;
}

:deep(.appt-status-menu .v-list-item-title) {
  font-size: 13px !important;
  color: #1f2937;
}
</style>
