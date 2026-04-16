import { computed, ref } from 'vue'
import { useScheduleStore } from '@/stores/schedule'
import { formatTime12Hour } from '@/lib/dateFormatter'

const parseLocalDate = (value) => {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'string') {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (match) {
      return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    }
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/**
 * Composable for checking dentist availability based on their schedule
 * Handles schedule periods, working days, breaks, and availability checks
 */
export const useDentistAvailability = () => {
  const scheduleStore = useScheduleStore()
  const dentistSchedules = ref([])

  /**
   * Load all schedules for a dentist
   * @param {Number} organisationId
   * @param {Number} dentistId
   */
  const loadDentistSchedules = async (organisationId, dentistId) => {
    try {
      const schedules = await scheduleStore.fetchSchedules(organisationId, dentistId)
      dentistSchedules.value = schedules || []
      return dentistSchedules.value
    } catch (error) {
      console.error('Error loading schedules:', error)
      dentistSchedules.value = []
      return []
    }
  }

  /**
   * Get the active schedule for a specific date
   * Checks if the date falls within the schedule's date range and if it's active
   * @param {String} dateString - YYYY-MM-DD format
   * @returns {Object|null} - The active schedule or null
   */
  const getActiveScheduleForDate = (dateString) => {
    if (!dateString || !dentistSchedules.value.length) return null

    const targetDate = parseLocalDate(dateString)
    if (!targetDate) return null
    
    return dentistSchedules.value.find(schedule => {
      // Schedule must be active
      if (!schedule.isActive) return false

      // Check if date falls within schedule period
      const startDate = parseLocalDate(schedule.startDate)
      if (!startDate) return false
      if (targetDate < startDate) return false

      // Check end date if it exists
      if (schedule.endDate) {
        const endDate = parseLocalDate(schedule.endDate)
        if (!endDate) return false
        if (targetDate > endDate) return false
      }

      return true
    }) || null
  }

  /**
   * Check if dentist is available on a specific date
   * @param {String} dateString - YYYY-MM-DD format
   * @returns {Boolean}
   */
  const isAvailableOnDate = (dateString) => {
    const schedule = getActiveScheduleForDate(dateString)
    if (!schedule) return false

    const dayOfWeek = getDayOfWeek(dateString)
    const dayConfig = schedule.days?.find(d => d.dayOfWeek === dayOfWeek)

    return dayConfig?.isWorkingDay === true
  }

  /**
   * Get day of week from date string (0 = Monday, 6 = Sunday)
   * @param {String} dateString - YYYY-MM-DD format
   * @returns {Number} - 0-6 where Monday=0
   */
  const getDayOfWeek = (dateString) => {
    const date = parseLocalDate(dateString)
    if (!date) return null
    // JavaScript getDay: 0=Sunday, 1=Monday...
    // We need: 0=Monday, 1=Tuesday...
    const jsDay = date.getDay()
    return jsDay === 0 ? 6 : jsDay - 1
  }

  /**
   * Get working hours for a dentist on a specific date
   * Returns { startTime: "HH:MM", endTime: "HH:MM", breaks: [...] } or null if not available
   * @param {String} dateString - YYYY-MM-DD format
   * @returns {Object|null}
   */
  const getWorkingHoursForDate = (dateString) => {
    const schedule = getActiveScheduleForDate(dateString)
    if (!schedule) return null

    const dayOfWeek = getDayOfWeek(dateString)
    const dayConfig = schedule.days?.find(d => d.dayOfWeek === dayOfWeek)

    if (!dayConfig || !dayConfig.isWorkingDay) return null

    return {
      startTime: dayConfig.startTime, // e.g., "09:00"
      endTime: dayConfig.endTime,     // e.g., "17:00"
      breaks: dayConfig.breaks || []
    }
  }

  /**
   * Convert time string to minutes from midnight
   * @param {String} time - "HH:MM" format
   * @returns {Number} - minutes from midnight
   */
  const timeToMinutes = (time) => {
    if (!time) return 0
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + (minutes || 0)
  }

  const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
  }

  const getTimeRangeAvailability = (dateString, startTime, endTime, dentist = {}) => {
    if (!isAvailableOnDate(dateString)) {
      return {
        available: false,
        code: 'unavailable_day',
        message: `${dentist.name || 'This dentist'} is not available on this day.`,
      }
    }

    const workingHours = getWorkingHoursForDate(dateString)
    if (!workingHours) {
      return {
        available: false,
        code: 'missing_schedule',
        message: 'No availability information',
      }
    }

    const slotStart = timeToMinutes(startTime)
    const slotEnd = timeToMinutes(endTime)
    const workStart = timeToMinutes(workingHours.startTime)
    const workEnd = timeToMinutes(workingHours.endTime)

    if (!Number.isFinite(slotStart) || !Number.isFinite(slotEnd) || slotEnd <= slotStart) {
      return {
        available: false,
        code: 'invalid_range',
        message: 'End time must be after start time.',
      }
    }

    if (slotStart < workStart || slotEnd > workEnd) {
      return {
        available: false,
        code: 'outside_hours',
        message: `${dentist.name || 'This dentist'} works from ${formatTime12Hour(workingHours.startTime)} to ${formatTime12Hour(workingHours.endTime)}.`,
      }
    }

    if (workingHours.breaks && workingHours.breaks.length > 0) {
      for (const breakPeriod of workingHours.breaks) {
        const breakStart = timeToMinutes(breakPeriod.startTime)
        const breakEnd = timeToMinutes(breakPeriod.endTime)
        if (slotStart < breakEnd && slotEnd > breakStart) {
          return {
            available: false,
            code: 'break_overlap',
            message: `${dentist.name || 'This dentist'} is unavailable between ${formatTime12Hour(breakPeriod.startTime)} and ${formatTime12Hour(breakPeriod.endTime)}.`,
          }
        }
      }
    }

    return {
      available: true,
      code: 'available',
      message: '',
      workingHours,
    }
  }

  /**
   * Check if a time slot is within working hours and not during a break
   * @param {String} dateString - YYYY-MM-DD format
   * @param {String} startTime - "HH:MM" format
   * @param {Number} durationMinutes - appointment duration in minutes
   * @returns {Boolean}
   */
  const isTimeSlotAvailable = (dateString, startTime, durationMinutes = 15) => {
    const slotStart = timeToMinutes(startTime)
    const slotEnd = slotStart + durationMinutes
    return getTimeRangeAvailability(
      dateString,
      startTime,
      minutesToTime(slotEnd),
    ).available
  }

  /**
   * Get available time slots for a specific date
   * Returns array of time strings in HH:MM format
   * @param {String} dateString - YYYY-MM-DD format
   * @param {Number} appointmentDuration - in minutes (default 15)
   * @param {Number} slotInterval - slot interval in minutes (default 15)
   * @returns {String[]} - array of available time slots
   */
  const getAvailableTimeSlots = (dateString, appointmentDuration = 15, slotInterval = 15) => {
    const workingHours = getWorkingHoursForDate(dateString)
    if (!workingHours) return []

    const slots = []
    const workStart = timeToMinutes(workingHours.startTime)
    const workEnd = timeToMinutes(workingHours.endTime)

    for (let minutes = workStart; minutes + appointmentDuration <= workEnd; minutes += slotInterval) {
      const startTime = minutesToTime(minutes)
      if (isTimeSlotAvailable(dateString, startTime, appointmentDuration)) {
        slots.push(startTime)
      }
    }

    return slots
  }

  /**
   * Convert minutes from midnight to HH:MM format
   * @param {Number} minutes
   * @returns {String} - "HH:MM"
   */
  /**
   * Get a human-readable availability message
   * @param {String} dateString - YYYY-MM-DD format
   * @param {Object} dentist - dentist object with name property
   * @returns {String}
   */
  const getAvailabilityMessage = (dateString, dentist = {}) => {
    if (!isAvailableOnDate(dateString)) {
      return `${dentist.name || 'This dentist'} is not available on this day.`
    }

    const workingHours = getWorkingHoursForDate(dateString)
    if (!workingHours) return 'No availability information'

    const dayOfWeek = getDayOfWeek(dateString)
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const dayName = dayNames[dayOfWeek]

    return `${dayName}: ${formatTime12Hour(workingHours.startTime)} - ${formatTime12Hour(workingHours.endTime)}`
  }

  return {
    loadDentistSchedules,
    isAvailableOnDate,
    getWorkingHoursForDate,
    getActiveScheduleForDate,
    getTimeRangeAvailability,
    isTimeSlotAvailable,
    getAvailableTimeSlots,
    getAvailabilityMessage,
    dentistSchedules: computed(() => dentistSchedules.value),
  }
}
