import {
  createBillingRequest,
  createCustomer,
  createPayment,
  sendGoCardlessPaymentRequest,
  getBillingRequestDetails,
  checkBillingRequest,
  getPatientMandates,
  getPatientPayments,
  getPatientCustomers,
  getWebhookLogs,
  refreshPaymentStatus,
  refreshMandateStatus,
  cancelMandate,
  webhookHandler,
} from "../../controllers/gocardless";

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, "name");

  switch (path) {
    case "create-billing-request":
      return await createBillingRequest(event);

    case "create-customer":
      return await createCustomer(event);

    case "create-payment":
      return await createPayment(event);

    case "billing-request-details":
      return await getBillingRequestDetails(event);

    case "check-billing-request":
      return await checkBillingRequest(event);

    case "patient-mandates":
      return await getPatientMandates(event);

    case "patient-payments":
      return await getPatientPayments(event);

    case "patient-customers":
      return await getPatientCustomers(event);

    case "webhook-logs":
      return await getWebhookLogs(event);

    case "refresh-payment-status":
      return await refreshPaymentStatus(event);

    case "refresh-mandate-status":
      return await refreshMandateStatus(event);

    case "cancel-mandate":
      return await cancelMandate(event);

    case "send-payment-request":
      return await sendGoCardlessPaymentRequest(event);

    case "webhook":
      return await webhookHandler(event);

    default:
      return { code: 1, message: 'Not found' }
  }
});
