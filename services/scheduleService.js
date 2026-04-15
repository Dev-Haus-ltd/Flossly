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
  updateScheduleDay(payload) {
    return new Promise((resolve, reject) => {
      Post('/schedule/updateDay', payload)
        .then(resolve)
        .catch(reject)
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
