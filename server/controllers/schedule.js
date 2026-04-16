import { Op } from 'sequelize'
import { DentistSchedule, DentistScheduleDay, DentistScheduleBreak } from '~/server/models/schedule'
import { Rota, RotaShift } from '~/server/models'
import { success, error } from '~/server/utils/response'

// Time validation helper
const isValidTime = (time) => {
  // Format: HH:MM or HH:MM:SS
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/
  return timeRegex.test(time)
}

const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number)
  return (hours * 60) + (minutes || 0)
}

const toTimeString = (value) => {
  const date = value instanceof Date ? value : new Date(value)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const weekdayFromDate = (value) => {
  const date = value instanceof Date ? value : new Date(value)
  const jsDay = date.getDay()
  return jsDay === 0 ? 6 : jsDay - 1
}

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const buildWeekDaysFromRota = (shifts = []) => {
  const grouped = new Map()
  shifts.forEach((shift) => {
    const shiftStart = new Date(shift.startDate)
    const shiftEnd = new Date(shift.endDate)
    if (Number.isNaN(shiftStart.getTime()) || Number.isNaN(shiftEnd.getTime()) || shiftEnd <= shiftStart) return
    const dayOfWeek = weekdayFromDate(shiftStart)
    if (!grouped.has(dayOfWeek)) {
      grouped.set(dayOfWeek, {
        startMinutes: timeToMinutes(toTimeString(shiftStart)),
        endMinutes: timeToMinutes(toTimeString(shiftEnd)),
        breakMinutes: Number(shift.breakTime || 0),
      })
      return
    }
    const bucket = grouped.get(dayOfWeek)
    bucket.startMinutes = Math.min(bucket.startMinutes, timeToMinutes(toTimeString(shiftStart)))
    bucket.endMinutes = Math.max(bucket.endMinutes, timeToMinutes(toTimeString(shiftEnd)))
    bucket.breakMinutes = Math.max(bucket.breakMinutes, Number(shift.breakTime || 0))
  })

  return DAY_NAMES.map((dayName, dayOfWeek) => {
    const bucket = grouped.get(dayOfWeek)
    if (!bucket) {
      return {
        dayOfWeek,
        dayName,
        isWorkingDay: false,
        startTime: null,
        endTime: null,
        breaks: [],
      }
    }
    const startHours = String(Math.floor(bucket.startMinutes / 60)).padStart(2, '0')
    const startMinutes = String(bucket.startMinutes % 60).padStart(2, '0')
    const endHours = String(Math.floor(bucket.endMinutes / 60)).padStart(2, '0')
    const endMinutes = String(bucket.endMinutes % 60).padStart(2, '0')
    const breaks = []

    if (bucket.breakMinutes > 0 && bucket.endMinutes - bucket.startMinutes > bucket.breakMinutes) {
      const centeredStart = bucket.startMinutes + Math.floor((bucket.endMinutes - bucket.startMinutes - bucket.breakMinutes) / 2)
      const centeredEnd = centeredStart + bucket.breakMinutes
      breaks.push({
        breakName: 'Break',
        startTime: `${String(Math.floor(centeredStart / 60)).padStart(2, '0')}:${String(centeredStart % 60).padStart(2, '0')}`,
        endTime: `${String(Math.floor(centeredEnd / 60)).padStart(2, '0')}:${String(centeredEnd % 60).padStart(2, '0')}`,
      })
    }

    return {
      dayOfWeek,
      dayName,
      isWorkingDay: true,
      startTime: `${startHours}:${startMinutes}`,
      endTime: `${endHours}:${endMinutes}`,
      breaks,
    }
  })
}

const fetchCompleteSchedule = async (scheduleId) => {
  return DentistSchedule.findByPk(scheduleId, {
    include: [
      {
        association: 'days',
        include: [{ association: 'breaks', order: [['order', 'ASC']] }],
        order: [['order', 'ASC']],
      },
    ],
  })
}

// List all schedules for a dentist
export const listSchedules = async (event) => {
  try {
    const query = getQuery(event)
    const organisationId = query.organisationId
    const dentistId = query.dentistId

    if (!organisationId || !dentistId) {
      return error(400, 'Organisation ID and Dentist ID are required')
    }

    const schedules = await DentistSchedule.findAll({
      where: { organisationId, dentistId },
      include: [
        {
          association: 'days',
          include: [
            { association: 'breaks', order: [['order', 'ASC']] }
          ],
          order: [['order', 'ASC']]
        }
      ],
      order: [['createdAt', 'DESC']]
    })

    return success(schedules)
  } catch (err) {
    console.error('List schedules error:', err)
    return error(500, 'Failed to list schedules')
  }
}

// Get single schedule
export const getSchedule = async (event) => {
  try {
    const query = getQuery(event)
    const scheduleId = query.scheduleId

    if (!scheduleId) {
      return error(400, 'Schedule ID is required')
    }

    const schedule = await DentistSchedule.findByPk(scheduleId, {
      include: [
        {
          association: 'days',
          include: [
            { association: 'breaks', order: [['order', 'ASC']] }
          ],
          order: [['order', 'ASC']]
        }
      ]
    })

    if (!schedule) {
      return error(404, 'Schedule not found')
    }

    return success(schedule)
  } catch (err) {
    console.error('Get schedule error:', err)
    return error(500, 'Failed to retrieve schedule')
  }
}

// Create new schedule
export const createSchedule = async (event) => {
  try {
    const body = await readBody(event)
    const { organisationId, dentistId, scheduleName, startDate, endDate, repeatPattern, isActive, weekDays } = body

    // Validation
    if (!organisationId || !dentistId || !scheduleName || !startDate) {
      return error(400, 'Missing required fields: organisationId, dentistId, scheduleName, startDate')
    }

    if (!['weekly', 'bi-weekly', 'monthly'].includes(repeatPattern)) {
      return error(400, 'Invalid repeat pattern. Must be weekly, bi-weekly, or monthly')
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(startDate)) {
      return error(400, 'Invalid start date format. Must be YYYY-MM-DD')
    }

    if (endDate && !dateRegex.test(endDate)) {
      return error(400, 'Invalid end date format. Must be YYYY-MM-DD')
    }

    if (endDate && new Date(startDate) > new Date(endDate)) {
      return error(400, 'End date must be after start date')
    }

    // Create schedule
    const schedule = await DentistSchedule.create({
      organisationId,
      dentistId,
      scheduleName,
      startDate,
      endDate: endDate || null,
      repeatPattern: repeatPattern || 'weekly',
      isActive: isActive !== false
    })

    // Create week days
    if (weekDays && Array.isArray(weekDays)) {
      for (const day of weekDays) {
        const { dayOfWeek, dayName, isWorkingDay, startTime, endTime, breaks = [] } = day

        // Validate day data
        if (dayOfWeek === undefined || dayOfWeek === null) {
          throw new Error('Each day must have dayOfWeek')
        }

        // Validate working hours if working day
        if (isWorkingDay) {
          if (!startTime || !endTime) {
            throw new Error('Working days must have start and end times')
          }

          if (!isValidTime(startTime) || !isValidTime(endTime)) {
            throw new Error('Invalid time format. Must be HH:MM or HH:MM:SS')
          }

          if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
            throw new Error(`Invalid times for ${dayName}: Start time must be before end time`)
          }
        }

        // Create schedule day
        const scheduleDay = await DentistScheduleDay.create({
          scheduleId: schedule.id,
          dayOfWeek,
          dayName,
          isWorkingDay,
          startTime: isWorkingDay ? startTime : null,
          endTime: isWorkingDay ? endTime : null,
          order: dayOfWeek
        })

        // Create breaks
        if (isWorkingDay && breaks.length > 0) {
          for (let i = 0; i < breaks.length; i++) {
            const breakData = breaks[i]
            const { breakName, startTime: breakStart, endTime: breakEnd } = breakData

            // Validate break times
            if (!breakStart || !breakEnd) {
              throw new Error(`Break ${i + 1} on ${dayName} must have start and end times`)
            }

            if (!isValidTime(breakStart) || !isValidTime(breakEnd)) {
              throw new Error(`Break ${i + 1} time format invalid`)
            }

            const breakStartMin = timeToMinutes(breakStart)
            const breakEndMin = timeToMinutes(breakEnd)
            const workStart = timeToMinutes(startTime)
            const workEnd = timeToMinutes(endTime)

            if (breakStartMin >= breakEndMin) {
              throw new Error(`Break ${i + 1}: Start time must be before end time`)
            }

            if (breakStartMin < workStart || breakEndMin > workEnd) {
              throw new Error(`Break ${i + 1}: Break times must fall within working hours (${startTime} - ${endTime})`)
            }

            await DentistScheduleBreak.create({
              scheduleDayId: scheduleDay.id,
              breakName: breakName || 'Break',
              startTime: breakStart,
              endTime: breakEnd,
              order: i
            })
          }
        }
      }
    }

    // Fetch complete schedule with relations
    const completeSchedule = await fetchCompleteSchedule(schedule.id)

    return success(completeSchedule)
  } catch (err) {
    console.error('Create schedule error:', err)
    return error(400, err.message || 'Failed to create schedule')
  }
}

export const copyScheduleFromRota = async (event) => {
  try {
    const body = await readBody(event)
    const payload = typeof body === 'string' ? JSON.parse(body) : body
    const organisationId = Number(payload?.organisationId || event.context.user?.orgId || 0)
    const dentistId = Number(payload?.dentistId || 0)

    if (!organisationId || !dentistId) {
      return error(400, 'Organisation ID and dentist ID are required')
    }

    const seedShift = await RotaShift.findOne({
      where: {
        isDeleted: false,
        [Op.or]: [{ dentistId }, { userId: dentistId }],
      },
      include: [{
        model: Rota,
        as: 'rota',
        where: { organisationId },
        attributes: ['id', 'name', 'startDate', 'endDate'],
      }],
      order: [['startDate', 'DESC'], ['createdAt', 'DESC']],
    })

    if (!seedShift?.rotaId) {
      return error(404, 'No rota shifts were found for this practitioner')
    }

    const rotaShifts = await RotaShift.findAll({
      where: {
        rotaId: Number(seedShift.rotaId),
        isDeleted: false,
        [Op.or]: [{ dentistId }, { userId: dentistId }],
      },
      order: [['startDate', 'ASC'], ['endDate', 'ASC']],
    })

    if (!rotaShifts.length) {
      return error(404, 'No rota shifts were found for this practitioner')
    }

    const weekDays = buildWeekDaysFromRota(rotaShifts)
    const hasWorkingDay = weekDays.some((day) => day.isWorkingDay)
    if (!hasWorkingDay) {
      return error(400, 'The selected rota does not contain usable working hours')
    }

    await DentistSchedule.update(
      { isActive: false },
      {
        where: {
          organisationId,
          dentistId,
          isActive: true,
        },
      },
    )

    const rotaName = seedShift.rota?.name || 'Rota'
    const schedule = await DentistSchedule.create({
      organisationId,
      dentistId,
      scheduleName: `Imported from ${rotaName}`,
      description: `Imported from rota ${rotaName}`,
      startDate: seedShift.rota?.startDate || new Date(),
      endDate: seedShift.rota?.endDate || null,
      repeatPattern: 'weekly',
      isActive: true,
    })

    for (const day of weekDays) {
      const scheduleDay = await DentistScheduleDay.create({
        scheduleId: schedule.id,
        dayOfWeek: day.dayOfWeek,
        dayName: day.dayName,
        isWorkingDay: day.isWorkingDay,
        startTime: day.isWorkingDay ? day.startTime : null,
        endTime: day.isWorkingDay ? day.endTime : null,
        order: day.dayOfWeek,
      })

      for (let index = 0; index < day.breaks.length; index += 1) {
        const breakItem = day.breaks[index]
        await DentistScheduleBreak.create({
          scheduleDayId: scheduleDay.id,
          breakName: breakItem.breakName || 'Break',
          startTime: breakItem.startTime,
          endTime: breakItem.endTime,
          order: index,
        })
      }
    }

    return success(await fetchCompleteSchedule(schedule.id))
  } catch (err) {
    console.error('Copy schedule from rota error:', err)
    return error(500, err.message || 'Failed to import rota schedule')
  }
}

// Update schedule
export const updateSchedule = async (event) => {
  try {
    const body = await readBody(event)
    const { scheduleId, scheduleName, startDate, endDate, repeatPattern, isActive, description } = body

    if (!scheduleId) {
      return error(400, 'Schedule ID is required')
    }

    const schedule = await DentistSchedule.findByPk(scheduleId)
    if (!schedule) {
      return error(404, 'Schedule not found')
    }

    // Validate dates if provided
    if (startDate || endDate) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (startDate && !dateRegex.test(startDate)) {
        return error(400, 'Invalid start date format. Must be YYYY-MM-DD')
      }
      if (endDate && !dateRegex.test(endDate)) {
        return error(400, 'Invalid end date format. Must be YYYY-MM-DD')
      }
      if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        return error(400, 'End date must be after start date')
      }
    }

    // Update schedule
    await schedule.update({
      scheduleName: scheduleName !== undefined ? scheduleName : schedule.scheduleName,
      description: description !== undefined ? description : schedule.description,
      startDate: startDate || schedule.startDate,
      endDate: endDate !== undefined ? endDate : schedule.endDate,
      repeatPattern: repeatPattern || schedule.repeatPattern,
      isActive: isActive !== undefined ? isActive : schedule.isActive
    })

    // Fetch complete schedule with relations
    const updated = await DentistSchedule.findByPk(scheduleId, {
      include: [
        {
          association: 'days',
          include: [
            { association: 'breaks', order: [['order', 'ASC']] }
          ],
          order: [['order', 'ASC']]
        }
      ]
    })

    return success(updated)
  } catch (err) {
    console.error('Update schedule error:', err)
    return error(500, 'Failed to update schedule')
  }
}

// Update schedule day
export const updateScheduleDay = async (event) => {
  try {
    const body = await readBody(event)
    const { scheduleDayId, isWorkingDay, startTime, endTime } = body

    if (!scheduleDayId) {
      return error(400, 'Schedule day ID is required')
    }

    const scheduleDay = await DentistScheduleDay.findByPk(scheduleDayId)
    if (!scheduleDay) {
      return error(404, 'Schedule day not found')
    }

    const nextStartTime = startTime ?? scheduleDay.startTime
    const nextEndTime = endTime ?? scheduleDay.endTime

    // Validate if working day
    if (isWorkingDay) {
      if (!nextStartTime || !nextEndTime) {
        return error(400, 'Working days must have start and end times')
      }

      if (!isValidTime(nextStartTime) || !isValidTime(nextEndTime)) {
        return error(400, 'Invalid time format. Must be HH:MM or HH:MM:SS')
      }

      if (timeToMinutes(nextStartTime) >= timeToMinutes(nextEndTime)) {
        return error(400, 'Start time must be before end time')
      }

      // Validate breaks fall within working hours
      const breaks = await DentistScheduleBreak.findAll({
        where: { scheduleDayId }
      })

      for (const breakItem of breaks) {
        const breakStart = timeToMinutes(breakItem.startTime)
        const breakEnd = timeToMinutes(breakItem.endTime)
        const workStart = timeToMinutes(nextStartTime)
        const workEnd = timeToMinutes(nextEndTime)

        if (breakStart < workStart || breakEnd > workEnd) {
          return error(400, `Break ${breakItem.breakName} (${breakItem.startTime} - ${breakItem.endTime}) falls outside working hours`)
        }
      }
    }

    await scheduleDay.update({
      isWorkingDay,
      startTime: nextStartTime,
      endTime: nextEndTime
    })

    const updated = await DentistScheduleDay.findByPk(scheduleDayId, {
      include: [
        { association: 'breaks', order: [['order', 'ASC']] }
      ]
    })

    return success(updated)
  } catch (err) {
    console.error('Update schedule day error:', err)
    return error(500, 'Failed to update schedule day')
  }
}

// Add break to a schedule day
export const addBreak = async (event) => {
  try {
    const body = await readBody(event)
    const { scheduleDayId, breakName, startTime, endTime } = body

    if (!scheduleDayId || !breakName || !startTime || !endTime) {
      return error(400, 'Missing required fields: scheduleDayId, breakName, startTime, endTime')
    }

    const scheduleDay = await DentistScheduleDay.findByPk(scheduleDayId)
    if (!scheduleDay) {
      return error(404, 'Schedule day not found')
    }

    if (!scheduleDay.isWorkingDay) {
      return error(400, 'Cannot add breaks to non-working days')
    }

    // Validate break times
    if (!isValidTime(startTime) || !isValidTime(endTime)) {
      return error(400, 'Invalid time format. Must be HH:MM or HH:MM:SS')
    }

    const breakStart = timeToMinutes(startTime)
    const breakEnd = timeToMinutes(endTime)
    const workStart = timeToMinutes(scheduleDay.startTime)
    const workEnd = timeToMinutes(scheduleDay.endTime)

    if (breakStart >= breakEnd) {
      return error(400, 'Break start time must be before end time')
    }

    if (breakStart < workStart || breakEnd > workEnd) {
      return error(400, `Break times must fall within working hours (${scheduleDay.startTime} - ${scheduleDay.endTime})`)
    }

    // Check for overlapping breaks
    const existingBreaks = await DentistScheduleBreak.findAll({
      where: { scheduleDayId }
    })

    for (const existingBreak of existingBreaks) {
      const existingStart = timeToMinutes(existingBreak.startTime)
      const existingEnd = timeToMinutes(existingBreak.endTime)

      // Check overlap
      if ((breakStart < existingEnd && breakEnd > existingStart)) {
        return error(400, `Break overlaps with existing break: ${existingBreak.breakName}`)
      }
    }

    // Get max order
    const maxOrder = await DentistScheduleBreak.max('order', { where: { scheduleDayId } })
    const nextOrder = (maxOrder || -1) + 1

    const newBreak = await DentistScheduleBreak.create({
      scheduleDayId,
      breakName,
      startTime,
      endTime,
      order: nextOrder
    })

    return success(newBreak)
  } catch (err) {
    console.error('Add break error:', err)
    return error(500, 'Failed to add break')
  }
}

// Update break
export const updateBreak = async (event) => {
  try {
    const body = await readBody(event)
    const { breakId, breakName, startTime, endTime } = body

    if (!breakId) {
      return error(400, 'Break ID is required')
    }

    const scheduleBreak = await DentistScheduleBreak.findByPk(breakId, {
      include: [{ association: 'scheduleDay' }]
    })

    if (!scheduleBreak) {
      return error(404, 'Break not found')
    }

    const scheduleDay = scheduleBreak.scheduleDay
    const workStart = timeToMinutes(scheduleDay.startTime)
    const workEnd = timeToMinutes(scheduleDay.endTime)

    // Validate times if provided
    if (startTime && endTime) {
      if (!isValidTime(startTime) || !isValidTime(endTime)) {
        return error(400, 'Invalid time format. Must be HH:MM or HH:MM:SS')
      }

      const breakStart = timeToMinutes(startTime)
      const breakEnd = timeToMinutes(endTime)

      if (breakStart >= breakEnd) {
        return error(400, 'Break start time must be before end time')
      }

      if (breakStart < workStart || breakEnd > workEnd) {
        return error(400, `Break times must fall within working hours (${scheduleDay.startTime} - ${scheduleDay.endTime})`)
      }

      // Check for overlapping breaks (excluding self)
      const otherBreaks = await DentistScheduleBreak.findAll({
        where: {
          scheduleDayId: scheduleDay.id,
          id: { [Op.ne]: breakId }
        }
      })

      for (const otherBreak of otherBreaks) {
        const otherStart = timeToMinutes(otherBreak.startTime)
        const otherEnd = timeToMinutes(otherBreak.endTime)

        if ((breakStart < otherEnd && breakEnd > otherStart)) {
          return error(400, `Overlaps with existing break: ${otherBreak.breakName}`)
        }
      }
    }

    // Update the break with provided values or keep existing ones
    const updateData = {}
    if (breakName !== undefined) updateData.breakName = breakName
    if (startTime !== undefined) updateData.startTime = startTime
    if (endTime !== undefined) updateData.endTime = endTime

    await scheduleBreak.update(updateData)

    const updated = await DentistScheduleBreak.findByPk(breakId)
    return success(updated)
  } catch (err) {
    console.error('Update break error:', err)
    return error(500, 'Failed to update break')
  }
}

// Delete break
export const deleteBreak = async (event) => {
  try {
    const query = getQuery(event)
    const breakId = query.breakId

    if (!breakId) {
      return error(400, 'Break ID is required')
    }

    const scheduleBreak = await DentistScheduleBreak.findByPk(breakId)
    if (!scheduleBreak) {
      return error(404, 'Break not found')
    }

    await scheduleBreak.destroy()
    return success({ message: 'Break deleted successfully' })
  } catch (err) {
    console.error('Delete break error:', err)
    return error(500, 'Failed to delete break')
  }
}

// Delete schedule
export const deleteSchedule = async (event) => {
  try {
    const query = getQuery(event)
    const scheduleId = query.scheduleId

    if (!scheduleId) {
      return error(400, 'Schedule ID is required')
    }

    const schedule = await DentistSchedule.findByPk(scheduleId)
    if (!schedule) {
      return error(404, 'Schedule not found')
    }

    await schedule.destroy() // Cascade delete will handle days and breaks
    return success({ message: 'Schedule deleted successfully' })
  } catch (err) {
    console.error('Delete schedule error:', err)
    return error(500, 'Failed to delete schedule')
  }
}

// Toggle schedule active status
export const toggleSchedule = async (event) => {
  try {
    const body = await readBody(event)
    const { scheduleId } = body

    if (!scheduleId) {
      return error(400, 'Schedule ID is required')
    }

    const schedule = await DentistSchedule.findByPk(scheduleId)
    if (!schedule) {
      return error(404, 'Schedule not found')
    }

    await schedule.update({
      isActive: !schedule.isActive
    })

    return success(schedule)
  } catch (err) {
    console.error('Toggle schedule error:', err)
    return error(500, 'Failed to toggle schedule')
  }
}
