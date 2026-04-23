<template>
  <div class="schedule-review">
    <v-alert
      type="info"
      variant="tonal"
      class="mb-6"
      icon="mdi-information-outline"
      style="border-radius: 8px; background-color: #EFF6FF; border-left: 3px solid #0061FB"
    >
      Review your schedule configuration before creating
    </v-alert>

    <!-- Basic Info Review -->
    <v-card elevation="0" class="review-card pa-4 mb-4">
      <h3 class="text-subtitle-2 font-weight-bold mb-4 d-flex align-center">
        <v-icon class="mr-2" size="18" color="#0061FB">mdi-information-outline</v-icon>
        Basic Information
      </h3>

      <v-row>
        <v-col cols="12" md="6">
          <div class="review-item mb-3">
            <div class="text-caption text-grey">Schedule Name</div>
            <div class="text-body-2 font-weight-medium">{{ form.scheduleName || '—' }}</div>
          </div>
        </v-col>

        <v-col cols="12" md="6">
          <div class="review-item mb-3">
            <div class="text-caption text-grey">Repeat Pattern</div>
            <div class="text-body-2 font-weight-medium text-capitalize">
              {{ form.repeatPattern || '—' }}
            </div>
          </div>
        </v-col>

        <v-col cols="12" md="6">
          <div class="review-item mb-3">
            <div class="text-caption text-grey">Start Date</div>
            <div class="text-body-2 font-weight-medium">
              {{ formatDate(form.startDate) }}
            </div>
          </div>
        </v-col>

        <v-col cols="12" md="6">
          <div class="review-item mb-3">
            <div class="text-caption text-grey">End Date</div>
            <div class="text-body-2 font-weight-medium">
              {{ form.endDate ? formatDate(form.endDate) : 'Open-ended (No end date)' }}
            </div>
          </div>
        </v-col>

        <v-col cols="12">
          <div class="review-item mb-3">
            <div class="text-caption text-grey">Description</div>
            <div class="text-body-2">
              {{ form.description || '—' }}
            </div>
          </div>
        </v-col>

        <v-col cols="12">
          <div class="d-flex align-center gap-2">
            <v-icon
              :color="form.isActive ? '#10B981' : '#EF4444'"
              size="18"
            >
              {{ form.isActive ? 'mdi-check-circle' : 'mdi-close-circle' }}
            </v-icon>
            <span class="text-body-2 font-weight-medium">
              {{ form.isActive ? 'Schedule is Active' : 'Schedule is Inactive' }}
            </span>
          </div>
        </v-col>
      </v-row>
    </v-card>

    <!-- Weekly Schedule Review -->
    <v-card elevation="0" class="review-card pa-4 mb-4">
      <h3 class="text-subtitle-2 font-weight-bold mb-4 d-flex align-center">
        <v-icon class="mr-2" size="18" color="#0061FB">mdi-calendar-week</v-icon>
        Weekly Schedule
      </h3>

      <div class="schedule-grid">
        <div
          v-for="(day, index) in form.weekDays"
          :key="index"
          class="day-review-card pa-3"
          :class="{ 'non-working': !day.isWorkingDay }"
        >
          <!-- Day Header -->
          <div class="d-flex justify-space-between align-center mb-3">
            <div>
              <h4 class="text-subtitle-2 font-weight-bold">
                {{ day.dayName }}
              </h4>
              <span class="text-caption text-grey">
                {{ index < 5 ? 'Weekday' : 'Weekend' }}
              </span>
            </div>
            <v-chip
              v-if="day.isWorkingDay"
              size="x-small"
              color="#10B981"
              text-color="white"
              style="border-radius: 100px"
            >
              Working
            </v-chip>
            <v-chip
              v-else
              size="x-small"
              color="#9CA3AF"
              text-color="white"
              style="border-radius: 100px"
            >
              Off
            </v-chip>
          </div>

          <!-- Working Hours -->
          <div v-if="day.isWorkingDay" class="mb-3">
            <div class="text-caption text-grey">Working Hours</div>
            <div class="text-body-2 font-weight-medium">
              {{ formatWorkingHours(day) }}
            </div>
          </div>

          <!-- Breaks -->
          <div v-if="day.isWorkingDay && day.breaks?.length">
            <div class="text-caption text-grey mb-2">Breaks</div>
            <div class="space-y-1">
              <div
                v-for="(breakItem, breakIndex) in day.breaks"
                :key="breakIndex"
                class="break-review-item pa-2 rounded"
              >
                <div class="text-caption font-weight-medium">
                  {{ breakItem.breakName }}
                </div>
                <div class="text-caption text-grey">
                  {{ formatBreakTime(breakItem) }}
                </div>
              </div>
            </div>
          </div>

          <!-- No breaks message -->
          <div v-if="day.isWorkingDay && !day.breaks?.length" class="text-caption text-grey">
            No breaks configured
          </div>
        </div>
      </div>
    </v-card>

    <!-- Summary Statistics -->
    <v-card elevation="0" class="review-card pa-4">
      <h3 class="text-subtitle-2 font-weight-bold mb-4 d-flex align-center">
        <v-icon class="mr-2" size="18" color="#0061FB">mdi-chart-box-outline</v-icon>
        Summary
      </h3>

      <v-row>
        <v-col cols="12" sm="6">
          <div class="stat-card pa-3 rounded text-center">
            <div class="text-caption text-grey">Working Days</div>
            <div class="text-h5 font-weight-bold text-primary">
              {{ workingDaysCount }}/7
            </div>
          </div>
        </v-col>

        <v-col cols="12" sm="6">
          <div class="stat-card pa-3 rounded text-center">
            <div class="text-caption text-grey">Total Breaks</div>
            <div class="text-h5 font-weight-bold text-primary">
              {{ totalBreaksCount }}
            </div>
          </div>
        </v-col>
      </v-row>
    </v-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatTimeTo12Hour, formatTimeToHHMM } from '@/lib/timeFormatters'

const props = defineProps({
  form: { type: Object, required: true },
  schedule: { type: Object, default: null }
})
const weekDays = computed(() => {
  return (props.form.weekDays || []).map(day => ({
    ...day,
    isWorkingDay: Boolean(day.isWorkingDay)
  }))
});
const formatDate = (dateString) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

/**
 * Format working hours with consistent time display
 * @param {Object} day - Day object with startTime and endTime
 * @returns {string} - Formatted time range (e.g., "9:00 AM - 5:00 PM")
 */
const formatWorkingHours = (day) => {
  if (!day?.isWorkingDay || !day?.startTime || !day?.endTime) {
    return 'Not working'
  }
  const start = formatTimeTo12Hour(normalizeTime(day.startTime))
const end = formatTimeTo12Hour(normalizeTime(day.endTime))
  return `${start} - ${end}`
}

/**
 * Format break time range
 * @param {Object} breakItem - Break object with startTime and endTime
 * @returns {string} - Formatted time range
 */
const formatBreakTime = (breakItem) => {
  if (!breakItem?.startTime || !breakItem?.endTime) return '—'
const start = formatTimeTo12Hour(normalizeTime(breakItem.startTime))
const end = formatTimeTo12Hour(normalizeTime(breakItem.endTime))
  return `${start} - ${end}`
}

const workingDaysCount = computed(() =>
  weekDays.value.filter(d => d.isWorkingDay).length
)
const normalizeTime = (time) => {
  if (!time) return null
  return formatTimeToHHMM(time) // always convert once
}
const totalBreaksCount = computed(() => {
  return weekDays.value.reduce((total, day) => {
    return total + (day.breaks?.length || 0)
  }, 0) || 0
})

</script>

<style scoped lang="scss">
.schedule-review {
  max-width: 100%;
}

.review-card {
  border: 1px solid #E5E7EB;
  border-radius: 8px !important;
  background-color: #FFFFFF;
}

.schedule-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
}

.day-review-card {
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  background-color: #FFFFFF;
  transition: all 0.2s ease;

  &:hover {
    border-color: #D1D5DB;
  }

  &.non-working {
    background-color: #F9FAFB;
  }
}

.break-review-item {
  background-color: #FFFBEB;
  border: 1px solid #FDE68A;
}

.stat-card {
  background-color: #F9FAFB;
  border: 1px solid #E5E7EB;
}

.text-primary {
  color: #0061FB;
}

.space-y-1 {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.gap-2 {
  gap: 8px;
}
</style>