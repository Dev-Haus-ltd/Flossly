/**
 * Centralized time formatting utilities
 * Ensures consistent time formatting across the entire application
 */

/**
 * Format time to HH:MM format (standardized)
 * @param {string} time - Time in any format (HH:MM, HH:MM:SS, etc.)
 * @returns {string} - Time in HH:MM format or empty string if invalid
 */
export const formatTimeToHHMM = (time) => {
  if (!time) return ''
  const timeStr = String(time).trim()
  const match = timeStr.match(/^(\d{1,2}):(\d{2})/)
  if (!match) return ''
  const [, hours, minutes] = match
  return `${String(hours).padStart(2, '0')}:${minutes}`
}

/**
 * Format time to 12-hour format (e.g., "9:00 AM")
 * @param {string} time - Time in HH:MM or HH:MM:SS format
 * @returns {string} - Time in 12-hour format or empty string
 */
export const formatTimeTo12Hour = (time) => {
  if (!time) return ''
  const formatted = formatTimeToHHMM(time)
  if (!formatted) return ''
  
  const [hours, minutes] = formatted.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 || 12
  
  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`
}

/**
 * Convert time string to minutes from midnight
 * @param {string} time - Time in HH:MM or HH:MM:SS format
 * @returns {number} - Minutes from midnight
 */
export const timeToMinutes = (time) => {
  if (!time) return 0
  const formatted = formatTimeToHHMM(time)
  if (!formatted) return 0
  
  const [hours, minutes] = formatted.split(':').map(Number)
  return (hours * 60) + (minutes || 0)
}

/**
 * Convert minutes from midnight to HH:MM format
 * @param {number} minutes - Minutes from midnight
 * @returns {string} - Time in HH:MM format
 */
export const minutesToTimeHHMM = (minutes) => {
  if (!Number.isFinite(minutes)) return '00:00'
  const mins = Math.max(0, Math.round(minutes))
  const hours = Math.floor(mins / 60)
  const mins_only = mins % 60
  return `${String(hours).padStart(2, '0')}:${String(mins_only).padStart(2, '0')}`
}

/**
 * Validate time format (HH:MM or HH:MM:SS)
 * @param {string} time - Time string to validate
 * @returns {boolean} - True if valid time format
 */
export const isValidTimeFormat = (time) => {
  if (!time) return false
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/
  return timeRegex.test(String(time).trim())
}

/**
 * Ensure time is in HH:MM format (pad with zeros if needed)
 * @param {string} time - Time in various formats
 * @returns {string} - Normalized HH:MM format
 */
export const normalizeTime = (time) => {
  const formatted = formatTimeToHHMM(time)
  return formatted || '00:00'
}

/**
 * Compare two times (useful for validation)
 * @param {string} time1 - First time in HH:MM format
 * @param {string} time2 - Second time in HH:MM format
 * @returns {number} - -1 if time1 < time2, 0 if equal, 1 if time1 > time2
 */
export const compareTime = (time1, time2) => {
  const mins1 = timeToMinutes(time1)
  const mins2 = timeToMinutes(time2)
  if (mins1 < mins2) return -1
  if (mins1 > mins2) return 1
  return 0
}
