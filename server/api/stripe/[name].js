import {
  confirmPayment,
  createPortal,
  createSubscription,
  getSubscription,
  prices,
  webhook,
  startCrmTrial,
} from "~/server/controllers/stripe";

export default defineEventHandler(async (event) => {
  const action = getRouterParam(event, "name");
  switch (action) {
    /* =====================================================
       Create subscription: POST /api/stripe/create-subscription
       Body: { userId, priceId }
       Returns: { code:1, data: { subscriptionId, clientSecret } }
       ===================================================== */
    case "create-subscription":
      return await createSubscription(event);

    /* =====================================================
       Create Billing Portal: POST /api/stripe/create-portal
       Body: { userId, returnUrl? }
       Returns: { code:1, data:{ url } }
       ===================================================== */
    case "create-portal":
      return await createPortal(event);

    /* =====================================================
       List Prices (for frontend) : GET /api/stripe/prices
       Returns active prices + product info
       ===================================================== */
    case "prices":
      return await prices(event);

    /* =====================================================
       Webhook: POST /api/stripe/webhook
       IMPORTANT: Signature verification using raw body
       ===================================================== */
    case "webhook":
      return await webhook(event);

    case "confirmPayment":
      return await confirmPayment(event);

    case "subscription":
      return await getSubscription(event)
    case "startTrial":
      return await startCrmTrial(event)
    default:
      return { code: 0, error: "Not found" };
  }
});
