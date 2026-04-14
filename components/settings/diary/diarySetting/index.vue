<template>
  <v-card elevation="0" class="pa-6 mt-5" style="border: 1px solid #dbdbdb; border-radius: 12px">

    <v-row>
      <v-col cols="12" md="6">
        <label class="text-caption font-weight-medium text-grey-darken-1">
          Slot Duration (minutes)
        </label>
        <v-select
          v-model="form.slotDuration"
          :items="durationOptions"
          variant="outlined"
          density="compact"
          class="mt-1"
          hide-details
          :error="!!errors.slotDuration"
          :error-messages="errors.slotDuration"
        />
        <div class="text-caption text-grey mt-1">
          Duration of each time slot in the calendar grid
        </div>
      </v-col>

      <v-col cols="12" md="6">
        <label class="text-caption font-weight-medium text-grey-darken-1">
          Start Time
        </label>
        <v-text-field 
          v-model="form.startTime" 
          type="time"
          variant="outlined"
          density="compact"
          class="mt-1"
          hide-details
          :error="!!errors.startTime"
          :error-messages="errors.startTime"
          @blur="validateTimes"
        />
        <div class="text-caption text-grey mt-1">
          First available appointment time of the day
        </div>
      </v-col>

      <v-col cols="12" md="6">
        <label class="text-caption font-weight-medium text-grey-darken-1">
          End Time
        </label>
        <v-text-field 
          v-model="form.endTime" 
          type="time"
          variant="outlined"
          density="compact"
          class="mt-1"
          hide-details
          :error="!!errors.endTime"
          :error-messages="errors.endTime"
          @blur="validateTimes"
        />
        <div class="text-caption text-grey mt-1">
          Last available appointment time of the day
        </div>
      </v-col>

      <v-col cols="12" md="6">
        <label class="text-caption font-weight-medium text-grey-darken-1">
          Allow Overlapping Appointments
        </label>
        <v-switch 
          v-model="form.allowOverlap" 
          hide-details
          color="primary"
          class="mt-1"
        />
        <div class="text-caption text-grey mt-1">
          Allow multiple appointments at the same time slot
        </div>
      </v-col>

      <v-col cols="12" md="6">
        <label class="text-caption font-weight-medium text-grey-darken-1">
          Default Appointment Status
        </label>
        <v-select
          v-model="form.defaultStatus"
          :items="statusOptions"
          variant="outlined"
          density="compact"
          class="mt-1"
          hide-details
        />
        <div class="text-caption text-grey mt-1">
          Default status when creating new appointments
        </div>
      </v-col>

      <v-col cols="12" md="6">
        <label class="text-caption font-weight-medium text-grey-darken-1">
          Break Time Between Appointments (minutes)
        </label>
        <v-select
          v-model="form.breakTime"
          :items="breakOptions"
          variant="outlined"
          density="compact"
          class="mt-1"
          hide-details
        />
        <div class="text-caption text-grey mt-1">
          Buffer time between consecutive appointments
        </div>
      </v-col>
    </v-row>

    <!-- Preview section -->
    <v-card 
      v-if="showPreview" 
      variant="tonal" 
      class="mt-4 pa-3" 
      color="grey-lighten-4"
      rounded="lg"
    >
      <div class="d-flex align-center justify-space-between">
        <div>
          <div class="text-caption font-weight-medium text-grey-darken-1">
            Schedule Preview
          </div>
          <div class="text-body-2 mt-1">
            Working hours: {{ form.startTime }} - {{ form.endTime }}
            <span v-if="form.slotDuration"> • {{ form.slotDuration }} min slots</span>
            <span v-if="form.breakTime"> • {{ form.breakTime }} min break</span>
          </div>
          <div class="text-caption text-grey mt-1">
            Total slots: {{ totalSlots }} appointments per day per dentist
          </div>
        </div>
        <v-btn
          size="small"
          variant="text"
          @click="showPreview = false"
        >
          Hide
        </v-btn>
      </div>
    </v-card>

    <v-btn
      v-else
      size="small"
      variant="text"
      color="primary"
      class="mt-2"
      @click="showPreview = true"
    >
      Show Preview
    </v-btn>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useMainStore } from '@/stores/index'

const props = defineProps({
  // Can receive initial settings from parent
  initialSettings: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:settings', 'settings-saved'])

const mainStore = useMainStore()
const isSaving = ref(false)
const showPreview = ref(false)

// Form data
const form = ref({
  slotDuration: 15,
  startTime: '09:00',
  endTime: '17:00',
  allowOverlap: false,
  defaultStatus: 'Pending',
  breakTime: 0
})

// Validation errors
const errors = ref({
  slotDuration: '',
  startTime: '',
  endTime: ''
})

// Options
const durationOptions = [10, 15, 20, 30, 45, 60, 90, 120]
const breakOptions = [0, 5, 10, 15, 20, 30]
const statusOptions = ['Pending', 'Confirmed', 'Arrived', 'In Surgery']

// Computed
const totalSlots = computed(() => {
  if (!form.value.startTime || !form.value.endTime || !form.value.slotDuration) return 0
  
  const start = timeToMinutes(form.value.startTime)
  const end = timeToMinutes(form.value.endTime)
  const duration = form.value.slotDuration
  const breakTime = form.value.breakTime
  
  if (start >= end) return 0
  
  let slots = 0
  let current = start
  
  while (current + duration <= end) {
    slots++
    current += duration + breakTime
  }
  
  return slots
})

// Helper functions
const timeToMinutes = (time) => {
  if (!time) return 0
  const [hours, minutes] = time.split(':').map(Number)
  return (hours * 60) + (minutes || 0)
}

const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

// Validation
const validateTimes = () => {
  let isValid = true
  
  if (!form.value.startTime) {
    errors.value.startTime = 'Start time is required'
    isValid = false
  } else {
    errors.value.startTime = ''
  }
  
  if (!form.value.endTime) {
    errors.value.endTime = 'End time is required'
    isValid = false
  } else {
    errors.value.endTime = ''
  }
  
  if (form.value.startTime && form.value.endTime) {
    const start = timeToMinutes(form.value.startTime)
    const end = timeToMinutes(form.value.endTime)
    
    if (start >= end) {
      errors.value.endTime = 'End time must be after start time'
      isValid = false
    }
    
    const minDuration = 60 // Minimum 1 hour work day
    if (end - start < minDuration) {
      errors.value.endTime = `Working day must be at least ${minDuration} minutes`
      isValid = false
    }
  }
  
  if (form.value.slotDuration < 5) {
    errors.value.slotDuration = 'Slot duration must be at least 5 minutes'
    isValid = false
  } else if (form.value.slotDuration > 120) {
    errors.value.slotDuration = 'Slot duration cannot exceed 120 minutes'
    isValid = false
  } else {
    errors.value.slotDuration = ''
  }
  
  return isValid
}

// Save settings to localStorage and emit
const saveSettings = async () => {
  if (!validateTimes()) {
    mainStore?.setSnackbar?.({
      title: 'Please fix validation errors',
      type: 'error'
    })
    return
  }
  
  isSaving.value = true
  
  try {
    // Save to localStorage
    const settingsToSave = {
      ...form.value,
      updatedAt: new Date().toISOString()
    }
    
    localStorage.setItem('diary_settings', JSON.stringify(settingsToSave))
    
    // Emit to parent
    emit('update:settings', settingsToSave)
    emit('settings-saved', settingsToSave)
    
    mainStore?.setSnackbar?.({
      title: 'Diary settings saved successfully',
      type: 'success'
    })
    
    console.log('Saved Diary Settings:', settingsToSave)
  } catch (error) {
    console.error('Failed to save settings:', error)
    mainStore?.setSnackbar?.({
      title: 'Failed to save settings',
      type: 'error'
    })
  } finally {
    isSaving.value = false
  }
}

// Reset to default values
const resetSettings = () => {
  form.value = {
    slotDuration: 15,
    startTime: '09:00',
    endTime: '17:00',
    allowOverlap: false,
    defaultStatus: 'Pending',
    breakTime: 0
  }
  validateTimes()
  
  mainStore?.setSnackbar?.({
    title: 'Settings reset to default',
    type: 'info'
  })
}

// Load saved settings
const loadSettings = () => {
  try {
    const saved = localStorage.getItem('diary_settings')
    if (saved) {
      const parsed = JSON.parse(saved)
      form.value = {
        ...form.value,
        ...parsed
      }
      validateTimes()
    }
  } catch (error) {
    console.error('Failed to load settings:', error)
  }
}

// Watch for changes to emit real-time updates
watch(form, (newVal) => {
  if (!isSaving.value) {
    emit('update:settings', newVal)
  }
}, { deep: true })

// Initialize
onMounted(() => {
  // Merge props.initialSettings if provided
  if (props.initialSettings && Object.keys(props.initialSettings).length) {
    form.value = {
      ...form.value,
      ...props.initialSettings
    }
  } else {
    loadSettings()
  }
  validateTimes()
})

// Expose methods for parent component
defineExpose({
  saveSettings,
  resetSettings,
  getSettings: () => ({ ...form.value }),
  validateTimes
})
</script>

<style scoped lang="scss">
:deep(.v-field) {
  border-radius: 8px !important;
}

.gap-2 {
  gap: 8px;
}
</style>