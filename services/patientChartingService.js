import { Post, Get, PostFormData } from './apiWrapper'

// Fix #16 — removed redundant new Promise(resolve/reject) wrappers; Get/Post already return Promises
export default {
  listTreatments() {
    return Get('/diary/treatments')
  },

  getChart(patientId) {
    return Get(`/diary/chart?patientId=${encodeURIComponent(patientId)}`)
  },

  saveChart(payload) {
    return Post('/diary/chartSave', payload)
  },

  saveTooth(payload) {
    return Post('/diary/chartToothSave', payload)
  },

  listTreatmentPlans(patientId) {
    return Get(`/diary/treatmentPlans?patientId=${encodeURIComponent(patientId)}`)
  },

  createTreatmentPlan(payload) {
    return Post('/diary/treatmentPlanCreate', payload)
  },

  updateTreatmentPlan(payload) {
    return Post('/diary/treatmentPlanUpdate', payload)
  },

  deleteTreatmentPlan(payload) {
    return Post('/diary/treatmentPlanDelete', payload)
  },

  listTreatmentPlanItems(patientId) {
    return Get(`/diary/treatmentPlanItems?patientId=${encodeURIComponent(patientId)}`)
  },

  createTreatmentPlanItem(payload) {
    return Post('/diary/treatmentPlanItemCreate', payload)
  },

  updateTreatmentPlanItem(payload) {
    return Post('/diary/treatmentPlanItemUpdate', payload)
  },

  deleteTreatmentPlanItem(id) {
    return Post('/diary/treatmentPlanItemDelete', { id })
  },

  getChartMeta(patientId) {
    return Get(`/diary/chartMeta?patientId=${encodeURIComponent(patientId)}`)
  },

  saveChartMeta(payload) {
    return Post('/diary/chartMetaSave', payload)
  },

  reorderTreatmentPlan(payload) {
    return Post('/diary/treatmentPlanReorder', payload)
  },

  checkConflict(payload) {
    return Post('/diary/appointmentConflictCheck', payload)
  },

  bookAppointmentInDiary(payload) {
    return Post('/diary/bookFromTreatmentPlan', payload)
  },

  uploadChartImage(formData) {
    return PostFormData('/diary/chartImageUpload', formData)
  },
}
