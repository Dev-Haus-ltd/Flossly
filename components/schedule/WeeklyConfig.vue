<template>
  <div class="weekly-config">
    <v-alert
      type="info"
      variant="tonal"
      class="mb-6"
      icon="mdi-information"
      style="border-radius: 8px; background-color: #EFF6FF; border-left: 3px solid #0061FB"
    >
      Configure working hours for each day of the week. You can also add breaks within working hours
    </v-alert>

    <!-- Days grid -->
    <v-row>
      <v-col
        v-for="(day, index) in localWeekDays"
        :key="index"
        cols="12"
        md="6"
        lg="4"
      >
        <v-card
          elevation="0"
          class="day-card pa-4 h-100"
          :class="{ 'non-working-day': !day.isWorkingDay }"
        >
          <!-- Day Header -->
          <div class="d-flex justify-space-between align-center mb-4">
            <div>
              <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-3">
                {{ day.dayName }}
              </h3>
              <span class="text-caption text-grey">
                {{ index < 5 ? 'Weekday' : 'Weekend' }}
              </span>
            </div>

            <!-- Working day toggle -->
            <v-switch
              v-model="day.isWorkingDay"
              color="primary"
              density="compact"
              hide-details
              @update:model-value="onDayToggle(day, index)"
            />
          </div>

          <!-- Working Hours (shown only for working days) -->
          <transition name="fade">
            <div v-if="day.isWorkingDay" class="mb-4">
              <div class="d-flex gap-3">
                <div class="flex-grow-1">
                  <label class="text-caption font-weight-medium text-grey-darken-1">
                    Start Time
                  </label>
                  <div class="mt-1">
                    <input
                      type="time"
                      v-model="day.startTime"
                      class="custom-time-input"
                      :class="{ 'border-error': getTimeError(index) }"
                      @change="validateDayTimes(index)"
                    />
                  </div>
                </div>
                <div class="flex-grow-1">
                  <label class="text-caption font-weight-medium text-grey-darken-1">
                    End Time
                  </label>
                  <div class="mt-1">
                    <input
                      type="time"
                      v-model="day.endTime"
                      class="custom-time-input"
                      :class="{ 'border-error': getTimeError(index) }"
                      @change="validateDayTimes(index)"
                    />
                  </div>
                </div>
              </div>

              <div
                v-if="getTimeError(index)"
                class="text-caption text-error mt-2"
              >
                {{ getTimeError(index) }}
              </div>

              <!-- Working hours preview -->
              <div class="mt-3 pa-2 rounded working-hours-preview">
                <div class="text-caption font-weight-medium text-grey-darken-2">
                  Working hours
                </div>
                <div class="text-body-2 text-grey-darken-3">
                  {{ formatTimeForDisplay(day.startTime) || '--' }} - {{ formatTimeForDisplay(day.endTime) || '--' }}
                </div>
              </div>
            </div>
          </transition>

          <!-- Non-working day message -->
          <div v-if="!day.isWorkingDay" class="text-caption text-grey py-4 text-center">
            <v-icon class="mr-1" size="small" color="#9CA3AF">mdi-close-circle-outline</v-icon>
            Not a working day
          </div>

          <!-- Breaks Section -->
          <transition name="fade">
            <div v-if="day.isWorkingDay" class="mt-4 pt-4 border-t">
              <div class="d-flex justify-space-between align-center mb-3">
                <label class="text-caption font-weight-medium text-grey-darken-1">
                  Breaks ({{ day.breaks?.length || 0 }})
                </label>
                <v-btn
                  size="small"
                  variant="text"
                  color="primary"
                  prepend-icon="mdi-plus"
                  @click="openAddBreakDialog(index)"
                >
                  Add Break
                </v-btn>
              </div>

              <!-- Breaks List -->
              <div v-if="day.breaks?.length" class="space-y-2">
                <div
                  v-for="(breakItem, breakIndex) in day.breaks"
                  :key="breakIndex"
                  class="break-item pa-2 rounded d-flex justify-space-between align-center"
                >
                  <div class="flex-grow-1">
                    <div class="text-caption font-weight-medium">
                      {{ breakItem.breakName }}
                    </div>
                    <div class="text-caption text-grey">
                      {{ formatTimeForDisplay(breakItem.startTime) }} - {{ formatTimeForDisplay(breakItem.endTime) }}
                    </div>
                  </div>
                  <div class="d-flex gap-1">
                    <v-btn
                      size="x-small"
                      variant="text"
                      color="primary"
                      icon="mdi-pencil"
                      @click="openEditBreakDialog(index, breakIndex)"
                    />
                    <v-btn
                      size="x-small"
                      variant="text"
                      color="error"
                      icon="mdi-delete-outline"
@click="openDeleteBreakDialog(index, breakIndex)"                      
                    />
                  </div>
                </div>
              </div>
              <div v-else class="text-caption text-grey py-2 text-center">
                No breaks added
              </div>
            </div>
          </transition>
        </v-card>
      </v-col>
    </v-row>

    <!-- Add/Edit Break Dialog -->
    <v-dialog v-model="breakDialog.open" max-width="480" persistent>
  <v-card class="break-dialog-card">
    
    <!-- Header -->
    <div class="dialog-header">
      <div>
        <h3 class="dialog-title">
          {{ breakDialog.isEdit ? 'Edit Break' : 'Add Break' }}
        </h3>
        <p class="dialog-subtitle">
          Set a time range when the dentist is unavailable
        </p>
      </div>
    </div>

    <!-- Body -->
    <div class="dialog-body">
      <v-text-field
        v-model="breakDialog.form.breakName"
        label="Break Name"
        placeholder="e.g. Lunch Break"
        variant="outlined"
        density="comfortable"
        hide-details="auto"
        :error="!!breakDialog.errors.breakName"
        :error-messages="breakDialog.errors.breakName"
      />

      <!-- Time Inputs -->
      <div class="time-row">
        <v-text-field
          v-model="breakDialog.form.startTime"
          label="Start Time"
          type="time"
          variant="outlined"
          density="comfortable"
          hide-details="auto"
          :error="!!breakDialog.errors.startTime"
        />

        <v-text-field
          v-model="breakDialog.form.endTime"
          label="End Time"
          type="time"
          variant="outlined"
          density="comfortable"
          hide-details="auto"
          :error="!!breakDialog.errors.endTime"
        />
      </div>

      <!-- Error block -->
      <div
        v-if="breakDialog.errors.startTime || breakDialog.errors.endTime"
        class="error-box"
      >
        <div v-if="breakDialog.errors.startTime">
          {{ breakDialog.errors.startTime }}
        </div>
        <div v-if="breakDialog.errors.endTime">
          {{ breakDialog.errors.endTime }}
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="dialog-footer">
      <v-btn variant="text" @click="closeBreakDialog">
        Cancel
      </v-btn>

      <v-btn
        color="primary"
        variant="flat"
        :loading="breakDialog.saving"
        @click="confirmAddEditBreak"
      >
        {{ breakDialog.isEdit ? 'Update' : 'Add Break' }}
      </v-btn>
    </div>
  </v-card>
</v-dialog>
<CommonConfirmDialog
  v-model="deleteDialog.open"
  :title="deleteDialog.title"
  :message="deleteDialog.message"
  :loading="deleteDialog.loading"
  confirm-text="Delete"
  @confirm="confirmDeleteBreak"
  @cancel="closeDeleteBreakDialog"
/>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { useScheduleStore } from '@/stores/schedule'
import { useMainStore } from '@/stores/index'

const props = defineProps({
  weekDays: { type: Array, required: true },
  errors: { type: Object, default: () => ({}) },
  isEditMode: { type: Boolean, default: false },
  scheduleId: { type: Number, default: null }
})

const emit = defineEmits(['update:weekDays', 'update:errors', 'break-added', 'break-updated', 'break-deleted'])

const scheduleStore = useScheduleStore()
const mainStore = useMainStore()

const localWeekDays = ref([])
const timeErrors = reactive({})
const breakDialog = reactive({
  open: false,
  isEdit: false,
  dayIndex: null,
  breakIndex: null,
  saving: false,
  form: {
    breakName: '',
    startTime: '',
    endTime: ''
  },
  errors: {
    breakName: '',
    startTime: '',
    endTime: ''
  }
})

watch(
  () => props.weekDays,
  (newVal) => {
    localWeekDays.value = newVal?.length ? [...newVal] : []
  },
  { immediate: true, deep: true }
)

const deleteDialog = reactive({
  open: false,
  dayIndex: null,
  breakIndex: null,
  breakName: '',
  loading :false,
  title:'',
  message:''
})


const openDeleteBreakDialog = (dayIndex, breakIndex) => {
  const breakItem = localWeekDays.value[dayIndex].breaks[breakIndex]

  deleteDialog.open = true
  deleteDialog.dayIndex = dayIndex
  deleteDialog.breakIndex = breakIndex
  deleteDialog.breakName = breakItem.breakName
  deleteDialog.title = 'Delete Break'
  deleteDialog.message = `Are you sure you want to delete "${breakItem.breakName}"? This action cannot be undone.`
}
// Convert 24-hour format to 12-hour format for display
const formatTimeForDisplay = (time24h) => {
  if (!time24h) return null
  const [hours, minutes] = time24h.split(':')
  const hour = parseInt(hours, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

const timeToMinutes = (time24h) => {
  if (!time24h) return 0
  const [hours, minutes] = time24h.split(':').map(Number)
  return (hours * 60) + (minutes || 0)
}

const validateDayTimes = (dayIndex) => {
  const day = localWeekDays.value[dayIndex]
  const key = `day-${dayIndex}`

  if (!day.startTime || !day.endTime) {
    timeErrors[key] = 'Both start and end times are required'
    return false
  }

  if (timeToMinutes(day.startTime) >= timeToMinutes(day.endTime)) {
    timeErrors[key] = 'Start time must be before end time'
    return false
  }

  delete timeErrors[key]
  emit('update:errors', { ...timeErrors })
  return true
}

const getTimeError = (dayIndex) => {
  const key = `day-${dayIndex}`
  return timeErrors[key] || ''
}

const onDayToggle = async (day, dayIndex) => {
  if (!day.isWorkingDay) {
    day.breaks = []
  }
  
  // If in edit mode, update the day via API
  if (props.isEditMode && day.id) {
    try {
      await scheduleStore.updateScheduleDay({
        scheduleDayId: day.id,
        isWorkingDay: day.isWorkingDay,
        startTime: day.isWorkingDay ? day.startTime : null,
        endTime: day.isWorkingDay ? day.endTime : null
      })
      mainStore?.setSnackbar?.({
        message: `${day.dayName} updated successfully`,
        color: 'success'
      })
    } catch (err) {
      console.error('Failed to update day:', err)
      mainStore?.setSnackbar?.({
        message: 'Failed to update working hours',
        color: 'error'
      })
    }
  }
  
  emit('update:weekDays', localWeekDays.value)
}

const openAddBreakDialog = (dayIndex) => {
  breakDialog.isEdit = false
  breakDialog.dayIndex = dayIndex
  breakDialog.breakIndex = null
  breakDialog.form = {
    breakName: '',
    startTime: '',
    endTime: ''
  }
  breakDialog.errors = {
    breakName: '',
    startTime: '',
    endTime: ''
  }
  breakDialog.open = true
}

const openEditBreakDialog = (dayIndex, breakIndex) => {
  const day = localWeekDays.value[dayIndex]
  const breakItem = day.breaks[breakIndex]
  
  breakDialog.isEdit = true
  breakDialog.dayIndex = dayIndex
  breakDialog.breakIndex = breakIndex
  breakDialog.form = {
    breakName: breakItem.breakName,
    startTime: breakItem.startTime,
    endTime: breakItem.endTime
  }
  breakDialog.errors = {
    breakName: '',
    startTime: '',
    endTime: ''
  }
  breakDialog.open = true
}

const closeBreakDialog = () => {
  breakDialog.open = false
}

const validateBreak = () => {
  const form = breakDialog.form
  const day = localWeekDays.value[breakDialog.dayIndex]
  breakDialog.errors = {}

  if (!form.breakName?.trim()) {
    breakDialog.errors.breakName = 'Break name is required'
  }

  if (!form.startTime || !form.endTime) {
    if (!form.startTime) breakDialog.errors.startTime = 'Start time is required'
    if (!form.endTime) breakDialog.errors.endTime = 'End time is required'
    return false
  }

  const breakStart = timeToMinutes(form.startTime)
  const breakEnd = timeToMinutes(form.endTime)
  const workStart = timeToMinutes(day.startTime)
  const workEnd = timeToMinutes(day.endTime)

  if (breakStart >= breakEnd) {
    breakDialog.errors.endTime = 'End time must be after start time'
    return false
  }

  if (breakStart < workStart || breakEnd > workEnd) {
    breakDialog.errors.endTime = `Break must fall within working hours (${formatTimeForDisplay(day.startTime)} - ${formatTimeForDisplay(day.endTime)})`
    return false
  }

  // Check for overlaps with existing breaks (excluding current break when editing)
  for (let i = 0; i < (day.breaks || []).length; i++) {
    if (breakDialog.isEdit && i === breakDialog.breakIndex) continue
    
    const existing = day.breaks[i]
    const existStart = timeToMinutes(existing.startTime)
    const existEnd = timeToMinutes(existing.endTime)

    if (breakStart < existEnd && breakEnd > existStart) {
      breakDialog.errors.startTime = `Overlaps with existing break: ${existing.breakName}`
      return false
    }
  }

  return true
}

const confirmAddEditBreak = async () => {
  if (!validateBreak()) return

  breakDialog.saving = true
  
  try {
    const day = localWeekDays.value[breakDialog.dayIndex]
    const breakData = {
      breakName: breakDialog.form.breakName,
      startTime: breakDialog.form.startTime,
      endTime: breakDialog.form.endTime
    }

    if (breakDialog.isEdit) {
      // Update existing break
      const existingBreak = day.breaks[breakDialog.breakIndex]
      
      if (props.isEditMode && existingBreak.id) {
        // API call to update break
        await scheduleStore.updateBreak({
          breakId: existingBreak.id,
          breakName: breakData.breakName,
          startTime: breakData.startTime,
          endTime: breakData.endTime
        })
        
        // Update local data
        day.breaks[breakDialog.breakIndex] = {
          ...existingBreak,
          ...breakData
        }
        
        mainStore?.setSnackbar?.({
          message: 'Break updated successfully',
          color: 'success'
        })
      } else {
        // Just update locally
        day.breaks[breakDialog.breakIndex] = {
          ...existingBreak,
          ...breakData
        }
      }
      
      emit('break-updated', {
        dayIndex: breakDialog.dayIndex,
        breakIndex: breakDialog.breakIndex,
        breakData
      })
    } else {
      // Add new break
      if (props.isEditMode && day.id) {
        // API call to add break
        const newBreak = await scheduleStore.addBreak({
          scheduleDayId: day.id,
          breakName: breakData.breakName,
          startTime: breakData.startTime,
          endTime: breakData.endTime
        })
        
        // Add to local data with ID from server
        if (!day.breaks) day.breaks = []
        day.breaks.push({
          id: newBreak.id,
          ...breakData
        })
        
        mainStore?.setSnackbar?.({
          message: 'Break added successfully',
          color: 'success'
        })
      } else {
        // Just add locally
        if (!day.breaks) day.breaks = []
        day.breaks.push(breakData)
      }
      
      emit('break-added', {
        dayIndex: breakDialog.dayIndex,
        breakData
      })
    }
    
    emit('update:weekDays', localWeekDays.value)
    closeBreakDialog()
  } catch (err) {
    console.error('Failed to save break:', err)
    mainStore?.setSnackbar?.({
      message: err.message || 'Failed to save break',
      color: 'error'
    })
  } finally {
    breakDialog.saving = false
  }
}

const confirmDeleteBreak = async () => {
  deleteDialog.loading = true

  const { dayIndex, breakIndex } = deleteDialog
  const day = localWeekDays.value[dayIndex]
  const breakItem = day.breaks[breakIndex]

  try {
    if (props.isEditMode && breakItem.id) {
      await scheduleStore.deleteBreak(breakItem.id, day.id)
      
      mainStore?.setSnackbar?.({
        message: 'Break deleted successfully',
        color: 'success'
      })
    }

    // Remove locally
    day.breaks.splice(breakIndex, 1)

    emit('break-deleted', { dayIndex, breakIndex })
    emit('update:weekDays', localWeekDays.value)

    closeDeleteBreakDialog()
  } catch (err) {
    console.error('Failed to delete break:', err)
    mainStore?.setSnackbar?.({
      message: err.message || 'Failed to delete break',
      color: 'error'
    })
  } finally {
    deleteDialog.loading = false
  }
}
const closeDeleteBreakDialog = () => {
  deleteDialog.open = false
  deleteDialog.dayIndex = null
  deleteDialog.breakIndex = null
}
</script>

<style scoped lang="scss">
.weekly-config {
  max-width: 100%;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.space-y-2 {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.border-t {
  border-top: 1px solid #E5E7EB;
}

.day-card {
  border: 1px solid #E5E7EB;
  border-radius: 8px !important;
  background-color: #FFFFFF;
  transition: all 0.2s ease;

  &:hover {
    border-color: #D1D5DB;
  }

  &.non-working-day {
    background-color: #F9FAFB;
  }
}

.working-hours-preview {
  background-color: #F0F7FF;
  border-left: 3px solid #0061FB;
}

.break-item {
  background-color: #FFFBEB;
  border: 1px solid #FDE68A;
}

.text-error {
  color: #EF4444;
}

.border-error {
  border: 1px solid #EF4444 !important;
}

.custom-time-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  background-color: #FFFFFF;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #D1D5DB;
  }
  
  &:focus {
    outline: none;
    border-color: #0061FB;
    box-shadow: 0 0 0 2px rgba(0, 97, 251, 0.1);
  }
  
  &::-webkit-calendar-picker-indicator {
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    
    &:hover {
      background-color: #F3F4F6;
    }
  }
}

.gap-1 {
  gap: 4px;
}

.gap-3 {
  
  gap: 12px;
}

.w-100 {
  width: 100%;
}

.h-100 {
  height: 100%;
}
.break-dialog-card {
  border-radius: 16px;
  padding: 0;
  overflow: hidden;
}

/* Header */
.dialog-header {
  padding: 20px 24px 10px;
}

.dialog-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.dialog-subtitle {
  font-size: 13px;
  color: #6b7280;
  margin-top: 2px;
}

/* Body */
.dialog-body {
  padding: 16px 24px 8px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.time-row {
  display: flex;
  gap: 12px;
}

/* Error */
.error-box {
  background: #fef2f2;
  color: #dc2626;
  font-size: 12px;
  padding: 8px 10px;
  border-radius: 8px;
}

/* Footer */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 24px;
}
</style>