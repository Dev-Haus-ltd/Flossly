import { DentistSchedule } from '~/server/models/schedule'

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export const normalizeTimeString = (time) => {
  if (!time) return null
  const [hours = '00', minutes = '00'] = String(time).split(':')
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export const timeToMinutes = (time) => {
  const normalized = normalizeTimeString(time)
  if (!normalized) return 0
  const [hours, minutes] = normalized.split(':').map(Number)
  return (hours * 60) + minutes
}

const formatTimeRange = (startTime, endTime) => {
  const start = normalizeTimeString(startTime)
  const end = normalizeTimeString(endTime)
  return start && end ? `${start} - ${end}` : ''
}

const getLocalYmd = (value) => {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const getScheduleDayOfWeek = (value) => {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const jsDay = date.getDay()
  return jsDay === 0 ? 6 : jsDay - 1
}

export const fetchDentistSchedules = async (organisationId, dentistId) => {
  if (!organisationId || !dentistId) return []
  return DentistSchedule.findAll({
    where: {
      organisationId: Number(organisationId),
      dentistId: Number(dentistId),
      isActive: true,
    },
    include: [
      {
        association: 'days',
        include: [{ association: 'breaks' }],
      },
    ],
    order: [
      ['startDate', 'DESC'],
      ['createdAt', 'DESC'],
    ],
  })
}

export const getActiveScheduleForDate = (schedules, value) => {
  const targetYmd = getLocalYmd(value)
  if (!targetYmd) return null
  return (schedules || []).find((schedule) => {
    if (!schedule?.isActive) return false
    if (schedule.startDate && targetYmd < schedule.startDate) return false
    if (schedule.endDate && targetYmd > schedule.endDate) return false
    return true
  }) || null
}

export const validateDentistScheduleWindow = async ({
  organisationId,
  dentistId,
  start,
  end,
}) => {
  if (!organisationId || !dentistId || !(start instanceof Date) || !(end instanceof Date)) {
    return { ok: false, message: 'Missing dentist schedule context.' }
  }
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return { ok: false, message: 'Invalid booking time range.' }
  }

  const schedules = await fetchDentistSchedules(organisationId, dentistId)
  if (!schedules.length) {
    return { ok: false, message: 'No active dentist schedule is set for this practitioner.' }
  }

  const schedule = getActiveScheduleForDate(schedules, start)
  if (!schedule) {
    return { ok: false, message: 'No active dentist schedule covers the selected date.' }
  }

  const dayOfWeek = getScheduleDayOfWeek(start)
  const dayConfig = schedule.days?.find((day) => Number(day.dayOfWeek) === Number(dayOfWeek))
  const dayName = DAY_NAMES[dayOfWeek] || 'Selected day'

  if (!dayConfig?.isWorkingDay || !dayConfig?.startTime || !dayConfig?.endTime) {
    return { ok: false, message: `${dayName} is marked as unavailable for this practitioner.` }
  }

  const slotStart = (start.getHours() * 60) + start.getMinutes()
  const slotEnd = (end.getHours() * 60) + end.getMinutes()
  const workStart = timeToMinutes(dayConfig.startTime)
  const workEnd = timeToMinutes(dayConfig.endTime)

  if (slotStart < workStart || slotEnd > workEnd) {
    return {
      ok: false,
      message: `${dayName} working hours are ${formatTimeRange(dayConfig.startTime, dayConfig.endTime)}.`,
    }
  }

  const conflictingBreak = (dayConfig.breaks || []).find((entry) => {
    const breakStart = timeToMinutes(entry.startTime)
    const breakEnd = timeToMinutes(entry.endTime)
    return slotStart < breakEnd && slotEnd > breakStart
  })

  if (conflictingBreak) {
    return {
      ok: false,
      message: `The selected time falls during ${conflictingBreak.breakName || 'a break'} (${formatTimeRange(conflictingBreak.startTime, conflictingBreak.endTime)}).`,
    }
  }

  return {
    ok: true,
    schedule,
    dayConfig,
    message: '',
  }
}
