<template>
  <div 
    class="appointment-card" 
    :style="{ 
      ...styleObj, 
      gridColumn: `span ${microSlots}`,
      borderLeftColor: statusColors[appt.status]?.chip || '#d948a8'
    }"
    @click="$emit('open-patient', appt)"
  >
    <!-- Header -->
    <div class="card-header">
      <div class="patient-info">
        <div class="patient-avatar">
          {{ getInitials(appt.patient) }}
        </div>
        <div class="patient-details">
          <div class="patient-name">{{ appt.patient }}</div>
          <div class="appointment-time">{{ displayStart }} - {{ displayEnd }}</div>
        </div>
      </div>
      
      <!-- Status dropdown -->
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

    <!-- Treatment -->
    <div v-if="appt.treatmentName" class="treatment-badge">
      <v-icon size="14" class="mr-1">mdi-tooth</v-icon>
      {{ appt.treatmentName }}
    </div>

    <!-- Notes -->
    <div v-if="appt.notes" class="appointment-notes">
      <v-icon size="14" class="mr-1">mdi-note-text-outline</v-icon>
      <span>{{ truncateNotes(appt.notes) }}</span>
    </div>
  </div>
</template>

<script setup>
import { clinicTimeToHM } from '@/lib/dateFormatter'

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

const emit = defineEmits(['update-status', 'open-patient'])

const statusOptions = [
  'Pending',
  'Confirmed',
  'Arrived',
  'In Surgery',
  'Complete',
  'Cancelled',
  'Did not attend'
]

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
  gap: 8px;
  min-height: 84px;
  /* Removed grid-column span - now just a regular flex item */
}

.appointment-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.patient-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.patient-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 12px;
  color: white;
  flex-shrink: 0;
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

.treatment-badge {
  display: flex;
  align-items: center;
  background: #eff6ff;
  color: #1e40af;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  width: fit-content;
}

.appointment-notes {
  display: flex;
  align-items: flex-start;
  font-size: 11px;
  color: #6b7280;
  line-height: 1.4;
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
