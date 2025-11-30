<template>
  <div
    class="appointment-card"
    :style="{
      ...styleObj,
      gridRow: `span ${microSlots}`,
      borderLeftColor: statusColors[appt.status]?.chip || '#d948a8'
    }"
    @click="$emit('open-appointment', appt)"
  >
    <div class="card-header">
      <div class="patient-info">
        <img :src="statusIcon" alt="status" class="status-icon" />
        <div class="patient-details">
          <button class="patient-name" type="button" @click.stop="$emit('open-patient', appt)">
            {{ appt.patient }}
          </button>
          <div class="appointment-time">{{ displayStart }} - {{ displayEnd }}</div>
        </div>
      </div>

      <v-menu offset-y>
        <template #activator="{ props }">
          <v-chip
            v-bind="props"
            size="small"
            :style="{
              background: statusColors[appt.status]?.chip || '#d948a8',
              color: 'white'
            }"
            class="status-chip"
          >
            <span class="status-dot"></span>
            {{ appt.status || 'Pending' }}
            <v-icon size="14" class="ml-1">mdi-chevron-down</v-icon>
          </v-chip>
        </template>
        <v-list density="compact">
          <v-list-item
            v-for="status in statusOptions"
            :key="status"
            @click="$emit('update-status', status)"
          >
            <template #prepend>
              <span
                class="status-indicator"
                :style="{ background: statusColors[status]?.chip }"
              ></span>
            </template>
            <v-list-item-title>{{ status }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>

    <div class="card-meta" v-if="appt.treatmentName || hasNotes">
      <v-tooltip v-if="hasNotes" location="bottom">
        <template #activator="{ props: tipProps }">
          <div class="meta-chip note-chip" v-bind="tipProps" @click.stop>
            <v-icon size="16" class="mr-1">mdi-note-text-outline</v-icon>
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
</template>

<script setup>
import { clinicTimeToHM } from '@/lib/dateFormatter'
import pendingIcon from '@/assets/diary/appointment/pending.svg'
import confirmedIcon from '@/assets/diary/appointment/confirmed.svg'
import arrivedIcon from '@/assets/diary/appointment/arrived.svg'
import inSurgeryIcon from '@/assets/diary/appointment/inSurgery.svg'
import completeIcon from '@/assets/diary/appointment/complete.svg'
import cancelledIcon from '@/assets/diary/appointment/cancelled.svg'
import dnaIcon from '@/assets/diary/appointment/didNotAttend.svg'

const props = defineProps({
  appt: { type: Object, required: true },
  microSlots: { type: Number, default: 1 }, // Now represents vertical slots occupied
  styleObj: { type: Object, default: () => ({}) },
  statusColors: { type: Object, required: true }
})

const hasValue = (val) => !(val === null || val === undefined || (typeof val === 'string' && val.trim() === ''))
const REQUIRED_APPT_FIELDS = ['patient','start','end','status','date']
const missingFields = REQUIRED_APPT_FIELDS.filter((field) => !hasValue(props.appt?.[field]))
if (missingFields.length) {
  throw new Error(`AppointmentCard requires ${missingFields.join(', ')} but received: ${JSON.stringify(props.appt || {})}`)
}

const emit = defineEmits(['update-status', 'open-patient', 'open-appointment'])

const statusOptions = [
  'Pending',
  'Confirmed',
  'Arrived',
  'In Surgery',
  'Complete',
  'Cancelled',
  'Did not attend'
]

const iconMap = {
  pending: pendingIcon,
  confirmed: confirmedIcon,
  arrived: arrivedIcon,
  'in surgery': inSurgeryIcon,
  insurgery: inSurgeryIcon,
  complete: completeIcon,
  cancelled: cancelledIcon,
  'did not attend': dnaIcon,
  didnotattend: dnaIcon,
}

const statusIcon = computed(() => {
  const key = String(props.appt?.status || 'pending').trim().toLowerCase()
  return iconMap[key] || pendingIcon
})

function getInitials(name) {
  if (!name) return '?'
  const parts = String(name).trim().split(' ')
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

function truncateNotes(notes) {
  if (!notes) return ''
  return notes.length > 40 ? notes.substring(0, 40) + '...' : notes
}

const displayStart = computed(() => clinicTimeToHM(props.appt.start || props.appt.startTime))
const displayEnd = computed(() => clinicTimeToHM(props.appt.end || props.appt.endTime))
const hasNotes = computed(() => !!props.appt?.notes)
const truncatedNotes = computed(() => truncateNotes(props.appt?.notes || ''))
const treatmentChipStyle = computed(() => {
  const key = String(props.appt?.status || '').trim()
  const color = props.statusColors?.[key]?.chip || '#1e40af'
  return { background: color, color: '#fff' }
})
</script>

<style scoped>
.appointment-card {
  background: white;
  border-radius: 10px;
  padding: 12px;
  border-left: 4px solid;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 84px;
}

.appointment-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.patient-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.status-icon {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  flex-shrink: 0;
  object-fit: contain;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.04);
}

.patient-details {
  flex: 1;
  min-width: 0;
}

.patient-name {
  font-weight: 600;
  font-size: 13px;
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
  font-size: 11px;
  color: #6b7280;
  margin-top: 2px;
}

.status-chip {
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
  height: 24px !important;
  padding: 0 8px !important;
}

.status-chip:hover {
  opacity: 0.9;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  display: inline-block;
  margin-right: 6px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
  min-width: 0;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 10px;
  line-height: 1.2;
}

.note-chip {
  align-items: center;
  color: #4b5563;
  background: rgba(0, 0, 0, 0.03);
}

.note-text {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notes-tooltip {
  max-width: 320px;
  white-space: pre-wrap;
  font-size: 12px;
  color: #1f2937;
}

.treatment-chip {
  background: #eff6ff;
  color: #1e40af;
  font-weight: 600;
}

.status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
}

:deep(.v-list-item) {
  min-height: 36px !important;
}

:deep(.v-list-item-title) {
  font-size: 13px;
}
</style>
