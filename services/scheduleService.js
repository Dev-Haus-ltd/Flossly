import { Get, Post, Delete } from './apiWrapper'

export default {
  // List schedules for a dentist
   listSchedules(organisationId, dentistId) {
    console.log('📡 API Call: listSchedules', { organisationId, dentistId })
    return new Promise((resolve, reject) => {
      Get(`/schedule/list?organisationId=${organisationId}&dentistId=${dentistId}`)
        .then(response => {
          console.log('✅ listSchedules response:', response)
          resolve(response)
        })
        .catch(error => {
          console.error('❌ listSchedules error:', error)
          reject(error)
        })
    })
  },

  // Get single schedule
  getSchedule(scheduleId) {
    return new Promise((resolve, reject) => {
      Get(`/schedule/get?scheduleId=${scheduleId}`)
        .then(resolve)
        .catch(reject)
    })
  },

  // Create new schedule
  createSchedule(payload) {
    console.log('📡 API Call: createSchedule', payload)
    return new Promise((resolve, reject) => {
      Post('/schedule/create', payload)
        .then(response => {
          console.log('✅ createSchedule response:', response)
          resolve(response)
        })
        .catch(error => {
          console.error('❌ createSchedule error:', error)
          reject(error)
        })
    })
  },

  // Update schedule basic info (name, dates, repeat pattern, active status)
  updateSchedule(payload) {
    return new Promise((resolve, reject) => {
      Post('/schedule/update', payload)
        .then(resolve)
        .catch(reject)
    })
  },

  // Update a specific day's working hours
  // IMPORTANT: payload must include scheduleDayId, isWorkingDay, startTime (HH:MM), endTime (HH:MM)
  updateScheduleDay(payload) {
    // Validate payload before sending
    if (!payload.scheduleDayId) {
      console.error('❌ updateScheduleDay: Missing scheduleDayId', payload)
      return Promise.reject(new Error('scheduleDayId is required'))
    }
    
    // Ensure times are in HH:MM format if provided
    const validatedPayload = {
      scheduleDayId: payload.scheduleDayId,
      isWorkingDay: payload.isWorkingDay !== undefined ? payload.isWorkingDay : true,
    }
    
    // Format startTime to HH:MM if provided
    if (payload.startTime) {
      const startTimeStr = String(payload.startTime).trim()
      if (!/^\d{2}:\d{2}/.test(startTimeStr)) {
        console.error('❌ updateScheduleDay: Invalid startTime format. Must be HH:MM', payload.startTime)
        return Promise.reject(new Error(`Invalid startTime format: ${payload.startTime}. Expected HH:MM`))
      }
      validatedPayload.startTime = startTimeStr.substring(0, 5) // Ensure HH:MM
    }
    
    // Format endTime to HH:MM if provided
    if (payload.endTime) {
      const endTimeStr = String(payload.endTime).trim()
      if (!/^\d{2}:\d{2}/.test(endTimeStr)) {
        console.error('❌ updateScheduleDay: Invalid endTime format. Must be HH:MM', payload.endTime)
        return Promise.reject(new Error(`Invalid endTime format: ${payload.endTime}. Expected HH:MM`))
      }
      validatedPayload.endTime = endTimeStr.substring(0, 5) // Ensure HH:MM
    }
    
    console.log('📡 API Call: updateScheduleDay', validatedPayload)
    
    return new Promise((resolve, reject) => {
      Post('/schedule/updateDay', validatedPayload)
        .then(response => {
          if (response?.code === 0 && response?.data) {
            console.log('✅ updateScheduleDay response:', response.data)
            resolve(response)
          } else {
            console.warn('⚠️ updateScheduleDay: Unexpected response format', response)
            resolve(response)
          }
        })
        .catch(error => {
          console.error('❌ updateScheduleDay error:', error)
          reject(error)
        })
    })
  },

  // Add a break to a specific day
  addBreak(payload) {
    return new Promise((resolve, reject) => {
      Post('/schedule/addBreak', payload)
        .then(resolve)
        .catch(reject)
    })
  },

  // Update break details
  updateBreak(payload) {
    return new Promise((resolve, reject) => {
      Post('/schedule/updateBreak', payload)
        .then(resolve)
        .catch(reject)
    })
  },

  // Delete a break - FIXED: Use query parameter for DELETE
  deleteBreak(breakId) {
    return new Promise((resolve, reject) => {
      Delete(`/schedule/deleteBreak?breakId=${breakId}`, null)
        .then(resolve)
        .catch(reject)
    })
  },

  // Delete entire schedule - FIXED: Use query parameter for DELETE
  deleteSchedule(scheduleId) {
    return new Promise((resolve, reject) => {
      Delete(`/schedule/delete?scheduleId=${scheduleId}`, null)
        .then(resolve)
        .catch(reject)
    })
  },

  // Toggle schedule active/inactive
  toggleSchedule(scheduleId) {
    return new Promise((resolve, reject) => {
      Post('/schedule/toggle', { scheduleId })
        .then(resolve)
        .catch(reject)
    })
  },

  copyScheduleFromRota(payload) {
    return new Promise((resolve, reject) => {
      Post('/schedule/copyFromRota', payload)
        .then(resolve)
        .catch(reject)
    })
  }
}
