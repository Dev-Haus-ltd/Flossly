import { computed } from 'vue'
import { useMainStore } from '@/stores/index'

/**
 * Composable for managing organisation-level working hours
 * Provides methods to get default working hours for any day of the week
 * Falls back to standard 9 AM - 5 PM if org timings are not set
 */
export const useOrganisationWorkingHours = () => {
  const mainStore = useMainStore()

  // Get all organisation working timings
  const orgWorkingTimings = computed(() => {
    return mainStore?.organisation?.workingTimings || {}
  })

  // Map of day names to day keys used in workingTimings
  const dayKeyMap = {
    'monday': 'monday',
    'tuesday': 'tuesday',
    'wednesday': 'wednesday',
    'thursday': 'thursday',
    'friday': 'friday',
    'saturday': 'saturday',
    'sunday': 'sunday',
    'mon': 'monday',
    'tue': 'tuesday',
    'wed': 'wednesday',
    'thu': 'thursday',
    'fri': 'friday',
    'sat': 'saturday',
    'sun': 'sunday'
  }

  // Default fallback timings if org doesn't have them set
  const defaultTimings = {
    startTime: '09:00',
    endTime: '17:00'
  }

  /**
   * Get working hours for a specific day
   * @param {string} dayName - Day name (e.g., 'monday', 'Monday', 'mon', 'Monday')
   * @returns {object} - { startTime, endTime }
   */
  const getOrganisationWorkingHours = (dayName) => {
    if (!dayName) return defaultTimings
if (!mainStore?.organisation?.workingTimings) {
  return defaultTimings
}
    const normalizedDay = dayName.toLowerCase().trim()
    const dayKey = dayKeyMap[normalizedDay]

    if (!dayKey || !orgWorkingTimings.value[dayKey]) {
      return defaultTimings
    }

    const timings = orgWorkingTimings.value[dayKey]
    return {
      startTime: timings.startTime || defaultTimings.startTime,
      endTime: timings.endTime || defaultTimings.endTime
    }
  }

  /**
   * Get all working timings for the week
   * @returns {object} - Object with day keys and their timings
   */
  const getAllOrgWorkingHours = () => {
    const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    const allTimings = {}

    weekDays.forEach((day) => {
      allTimings[day] = getOrganisationWorkingHours(day)
    })

    return allTimings
  }

  /**
   * Check if a specific day is a working day based on org settings
   * @param {string} dayName - Day name
   * @returns {boolean}
   */
  const isWorkingDay = (dayName) => {
    // If org timings exist for this day, it's a working day
    const normalizedDay = dayName.toLowerCase().trim()
    const dayKey = dayKeyMap[normalizedDay]
    return !!(dayKey && orgWorkingTimings.value[dayKey])
  }

  /**
   * Check if organisation working timings are loaded
   * @returns {boolean}
   */
  const hasOrgTimingsLoaded = () => {
    return Object.keys(orgWorkingTimings.value).length > 0
  }

  return {
    getOrganisationWorkingHours,
    getAllOrgWorkingHours,
    isWorkingDay,
    hasOrgTimingsLoaded,
    orgWorkingTimings
  }
}
