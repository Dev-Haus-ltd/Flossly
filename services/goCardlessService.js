import { Get, Post } from './apiWrapper'

/**
 * GoCardless Payment Gateway Service
 * Handles customer creation, payment requests, and payment tracking
 */
export default {
  /**
   * Create a customer in GoCardless
   * @param {Object} payload - Customer data
   * @returns {Promise}
   */
  createCustomer(payload) {
    return Post('/gocardless/create-customer', payload)
  },

  /**
   * Create a billing request to get redirect URL for payment
   * @param {Object} payload - Billing request data
   * @returns {Promise}
   */
  createBillingRequest(payload) {
    return Post('/gocardless/create-billing-request', payload)
  },

  sendPaymentRequestEmail(payload) {
    return Post('/gocardless/send-payment-request', payload)
  },

  /**
   * Check the status of a billing request
   * @param {string} billingRequestId - ID of the billing request
   * @returns {Promise}
   */
  checkBillingRequest(billingRequestId) {
    return Get(`/gocardless/check-billing-request?id=${encodeURIComponent(billingRequestId)}`)
  },

  /**
   * Get full billing request details including mandate and payment IDs
   * @param {string} billingRequestId - ID of the billing request
   * @returns {Promise}
   */
  getBillingRequestDetails(billingRequestId) {
    return Get(`/gocardless/billing-request-details?id=${encodeURIComponent(billingRequestId)}`)
  },

  /**
   * Create a payment with an existing mandate
   * @param {Object} payload - Payment data
   * @returns {Promise}
   */
  createPayment(payload) {
    return Post('/gocardless/create-payment', payload)
  },

  /**
   * Get active mandates for a patient
   * @param {number} patientId - Patient ID
   * @returns {Promise}
   */
  getPatientMandates(patientId) {
    return Get(`/gocardless/patient-mandates?patientId=${encodeURIComponent(patientId)}`)
  },

  /**
   * Get GoCardless payments for a patient
   * @param {number} patientId - Patient ID
   * @returns {Promise}
   */
  getPatientPayments(patientId) {
    return Get(`/gocardless/patient-payments?patientId=${encodeURIComponent(patientId)}`)
  },

  /**
   * Get GoCardless customers for a patient
   * @param {number} patientId - Patient ID
   * @returns {Promise}
   */
  getPatientCustomers(patientId) {
    return Get(`/gocardless/patient-customers?patientId=${encodeURIComponent(patientId)}`)
  },

  /**
   * Get GoCardless webhook logs for a patient
   * @param {number} patientId - Patient ID
   * @returns {Promise}
   */
  getWebhookLogs(patientId) {
    return Get(`/gocardless/webhook-logs?patientId=${encodeURIComponent(patientId)}`)
  },

  /**
   * Refresh GoCardless payment status
   * @param {string} paymentId - GoCardless payment ID
   * @returns {Promise}
   */
  refreshPaymentStatus(paymentId) {
    return Post('/gocardless/refresh-payment-status', { paymentId })
  },

  /**
   * Refresh GoCardless mandate status
   * @param {string} mandateId - GoCardless mandate ID
   * @returns {Promise}
   */
  refreshMandateStatus(mandateId) {
    return Post('/gocardless/refresh-mandate-status', { mandateId })
  },

  /**
   * Cancel a GoCardless mandate
   * @param {string} mandateId - GoCardless mandate ID
   * @returns {Promise}
   */
  cancelMandate(mandateId) {
    return Post('/gocardless/cancel-mandate', { mandateId })
  },
}
