import { computed, ref } from 'vue'
import { useScheduleStore } from '@/stores/schedule'

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

    const targetDate = new Date(dateString)
    
    return dentistSchedules.value.find(schedule => {
      // Schedule must be active
      if (!schedule.isActive) return false

      // Check if date falls within schedule period
      const startDate = new Date(schedule.startDate)
      if (targetDate < startDate) return false

      // Check end date if it exists
      if (schedule.endDate) {
        const endDate = new Date(schedule.endDate)
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
    const date = new Date(dateString)
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

  /**
   * Check if a time slot is within working hours and not during a break
   * @param {String} dateString - YYYY-MM-DD format
   * @param {String} startTime - "HH:MM" format
   * @param {Number} durationMinutes - appointment duration in minutes
   * @returns {Boolean}
   */
  const isTimeSlotAvailable = (dateString, startTime, durationMinutes = 15) => {
    const workingHours = getWorkingHoursForDate(dateString)
    if (!workingHours) return false

    const slotStart = timeToMinutes(startTime)
    const slotEnd = slotStart + durationMinutes
    const workStart = timeToMinutes(workingHours.startTime)
    const workEnd = timeToMinutes(workingHours.endTime)

    // Check if slot is within working hours
    if (slotStart < workStart || slotEnd > workEnd) return false

    // Check if slot conflicts with breaks
    if (workingHours.breaks && workingHours.breaks.length > 0) {
      for (const breakPeriod of workingHours.breaks) {
        const breakStart = timeToMinutes(breakPeriod.startTime)
        const breakEnd = timeToMinutes(breakPeriod.endTime)

        // Check for overlap
        if (slotStart < breakEnd && slotEnd > breakStart) return false
      }
    }

    return true
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
  const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
  }

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

    return `${dayName}: ${workingHours.startTime} - ${workingHours.endTime}`
  }

  return {
    loadDentistSchedules,
    isAvailableOnDate,
    getWorkingHoursForDate,
    getActiveScheduleForDate,
    isTimeSlotAvailable,
    getAvailableTimeSlots,
    getAvailabilityMessage,
    dentistSchedules: computed(() => dentistSchedules.value),
  }
}
