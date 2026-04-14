<template>
  <div class="schedule-list-container">
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h2 class="text-h6 text-grey-darken-3 font-weight-bold">
          Dentist Schedules
        </h2>
        <p class="text-caption text-grey mt-1">
          Manage working schedules for {{ dentistName }}
        </p>
      </div>

      <v-btn
        variant="flat"
        color="primary"
        @click="$emit('create-new')"
      >
        <v-icon class="mr-2">mdi-plus</v-icon>
        New Schedule
      </v-btn>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="d-flex justify-center py-8">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <!-- Empty State -->
    <v-card
      v-else-if="!schedules.length"
      elevation="0"
      class="pa-8 text-center"
      style="border: 1px solid #dbdbdb; border-radius: 12px"
    >
      <v-icon size="80" color="grey-lighten-1" class="mb-4">
        mdi-calendar-blank
      </v-icon>
      <h3 class="text-h6 text-grey-darken-2 mb-2">No schedules created</h3>
      <p class="text-caption text-grey mb-4">
        Create your first schedule to set up working hours and breaks
      </p>
      <v-btn
        variant="flat"
        color="primary"
        @click="$emit('create-new')"
      >
        Create Schedule
      </v-btn>
    </v-card>

    <!-- Schedules Grid -->
    <v-row v-else>
      <v-col
        v-for="schedule in schedules"
        :key="schedule.id"
        cols="12"
        md="6"
        lg="4"
      >
        <v-card
          elevation="0"
          class="h-100"
          style="border: 1px solid #dbdbdb; border-radius: 12px"
          :class="{ 'opacity-75': !schedule.isActive }"
        >
          <!-- Header -->
          <div class="pa-4 border-b d-flex justify-space-between align-center">
            <div>
              <h3 class="text-subtitle2 font-weight-bold">
                {{ schedule.scheduleName }}
              </h3>
              <p class="text-caption text-grey mt-1">
                {{ schedule.repeatPattern }}
              </p>
            </div>

            <!-- Status Badge -->
            <v-chip
              :color="schedule.isActive ? 'success' : 'grey'"
              text-color="white"
              size="small"
            >
              {{ schedule.isActive ? 'Active' : 'Inactive' }}
            </v-chip>
          </div>

          <!-- Content -->
          <div class="pa-4">
            <!-- Date Range -->
            <div class="mb-4">
              <div class="text-caption text-grey font-weight-medium">
                Date Range
              </div>
              <div class="text-body-2 mt-1">
                {{ formatDate(schedule.startDate) }}
                <span v-if="schedule.endDate" class="text-grey">
                  – {{ formatDate(schedule.endDate) }}
                </span>
                <span v-else class="text-grey"> – Open-ended</span>
              </div>
            </div>

            <!-- Working Days Summary -->
            <div class="mb-4">
              <div class="text-caption text-grey font-weight-medium mb-2">
                Working Days ({{ workingDaysCount(schedule) }}/7)
              </div>
              <div class="d-flex gap-1 flex-wrap">
                <v-chip
                  v-for="day in schedule.days"
                  :key="day.id"
                  size="small"
                  variant="outlined"
                  :color="day.isWorkingDay ? 'primary' : 'grey'"
                >
                  {{ day.dayName.substring(0, 3) }}
                </v-chip>
              </div>
            </div>

            <!-- Breaks Count -->
            <div class="mb-4">
              <div class="text-caption text-grey font-weight-medium">
                {{ totalBreaksCount(schedule) }} Breaks configured
              </div>
            </div>

            <!-- Description -->
            <div v-if="schedule.description" class="mb-4 pa-2 rounded bg-grey-lighten-5">
              <div class="text-caption text-grey">Notes</div>
              <div class="text-body-2 text-grey-darken-2 mt-1">
                {{ schedule.description }}
              </div>
            </div>

            <!-- Metadata -->
            <div class="text-caption text-grey">
              Created {{ formatDateRelative(schedule.createdAt) }}
            </div>
          </div>

          <!-- Actions -->
          <v-divider />
          <div class="pa-4 d-flex gap-2 justify-end">
            <v-btn
              size="small"
              variant="text"
              @click="editSchedule(schedule.id)"
            >
              <v-icon size="small" class="mr-1">mdi-pencil</v-icon>
              Edit
            </v-btn>

            <v-btn
              size="small"
              variant="text"
              :color="schedule.isActive ? 'warning' : 'success'"
              @click="toggleSchedule(schedule.id)"
            >
              <v-icon size="small" class="mr-1">
                {{ schedule.isActive ? 'mdi-pause-circle' : 'mdi-play-circle' }}
              </v-icon>
              {{ schedule.isActive ? 'Disable' : 'Enable' }}
            </v-btn>

            <v-btn
              size="small"
              variant="text"
              color="error"
              @click="deleteSchedule(schedule.id)"
            >
              <v-icon size="small">mdi-delete</v-icon>
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  schedules: { type: Array, required: true },
  dentistName: { type: String, default: 'selected dentist' },
  isLoading: { type: Boolean, default: false }
})

const emit = defineEmits(['create-new', 'edit', 'toggle', 'delete'])

const formatDate = (dateString) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

const formatDateRelative = (dateString) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  if (days < 365) return `${Math.floor(days / 30)} months ago`
  return `${Math.floor(days / 365)} years ago`
}

const workingDaysCount = (schedule) => {
  return schedule.days.filter(d => d.isWorkingDay).length
}

const totalBreaksCount = (schedule) => {
  return schedule.days.reduce((total, day) => {
    return total + (day.breaks?.length || 0)
  }, 0)
}

const editSchedule = (scheduleId) => {
  emit('edit', scheduleId)
}

const toggleSchedule = (scheduleId) => {
  emit('toggle', scheduleId)
}

const deleteSchedule = (scheduleId) => {
  if (confirm('Are you sure you want to delete this schedule?')) {
    emit('delete', scheduleId)
  }
}
</script>

<style scoped lang="scss">
.schedule-list-container {
  max-width: 1400px;
  margin: 0 auto;
}

.border-b {
  border-bottom: 1px solid #dbdbdb;
}

.h-100 {
  height: 100%;
}

.bg-grey-lighten-5 {
  background-color: #f5f5f5;
}

.opacity-75 {
  opacity: 0.75;
}

.gap-1 {
  gap: 4px;
}

.gap-2 {
  gap: 8px;
}
</style>
