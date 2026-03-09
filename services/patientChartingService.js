import { Post, Get } from './apiWrapper'

export default {
  getChart(patientId) {
    return new Promise((resolve, reject) => {
      Get(`/diary/chart?patientId=${encodeURIComponent(patientId)}`)
        .then(resolve)
        .catch(reject)
    })
  },

  saveChart(payload) {
    // payload: { patientId, chart }  — full chart snapshot
    return new Promise((resolve, reject) => {
      Post('/diary/chartSave', payload)
        .then(resolve)
        .catch(reject)
    })
  },

  saveTooth(payload) {
    // payload: { patientId, fdi, toothData }  — single tooth update
    return new Promise((resolve, reject) => {
      Post('/diary/chartToothSave', payload)
        .then(resolve)
        .catch(reject)
    })
  },

  // Treatment Plan
  listTreatmentPlans(patientId) {
    return new Promise((resolve, reject) => {
      Get(`/diary/treatmentPlans?patientId=${encodeURIComponent(patientId)}`)
        .then(resolve)
        .catch(reject)
    })
  },

  createTreatmentPlanItem(payload) {
    // payload: { patientId, fdi, surface, condition, conditionLabel, cost, priority, notes, status }
    return new Promise((resolve, reject) => {
      Post('/diary/treatmentPlanCreate', payload)
        .then(resolve)
        .catch(reject)
    })
  },

  updateTreatmentPlanItem(payload) {
    // payload: { id, status, priority, cost, notes }
    return new Promise((resolve, reject) => {
      Post('/diary/treatmentPlanUpdate', payload)
        .then(resolve)
        .catch(reject)
    })
  },

  deleteTreatmentPlanItem(id) {
    return new Promise((resolve, reject) => {
      Post('/diary/treatmentPlanDelete', { id })
        .then(resolve)
        .catch(reject)
    })
  },

  reorderTreatmentPlan(payload) {
    // payload: { patientId, orderedIds: [id, id, ...] }
    return new Promise((resolve, reject) => {
      Post('/diary/treatmentPlanReorder', payload)
        .then(resolve)
        .catch(reject)
    })
  },

  checkConflict(payload) {
    return new Promise((resolve, reject) =>
      Post('/diary/appointmentConflictCheck', payload).then(resolve).catch(reject)
    )
  },

  bookAppointmentInDiary(payload) {
    return new Promise((resolve, reject) =>
      Post('/diary/bookFromTreatmentPlan', payload).then(resolve).catch(reject)
    )
  },
}
