import { Get, Post } from './apiWrapper'

export default {
  getAccountStats(patientId) {
    return Get(`/diary/accountsStats?patientId=${encodeURIComponent(patientId)}`)
  },

  listInvoices(patientId) {
    return Get(`/diary/invoicesList?patientId=${encodeURIComponent(patientId)}`)
  },

  createInvoice(payload) {
    return Post('/diary/invoiceCreate', payload)
  },

  updateInvoice(payload) {
    return Post('/diary/invoiceUpdate', payload)
  },

  deleteInvoice(id) {
    return Post('/diary/invoiceDelete', { id })
  },

  generateInvoiceFromTreatments(patientId) {
    return Post('/diary/generateInvoiceFromTreatments', { patientId })
  },

  listPayments(patientId) {
    return Get(`/diary/paymentsList?patientId=${encodeURIComponent(patientId)}`)
  },

  createPayment(payload) {
    return Post('/diary/paymentCreate', payload)
  },

  allocatePayment(payload) {
    return Post('/diary/paymentAllocate', payload)
  },

  deletePayment(id) {
    return Post('/diary/paymentDelete', { id })
  },
}
