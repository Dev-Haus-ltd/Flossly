import stripe from "@/server/utils/stripe";
import { UserPreference, UserSubscription, Organisation } from "../models";
import { resolveTier } from '../config/entitlements.js';
import { User } from "../models";
import { parseJsonBody } from "../utils/body";
import { sendSystemSubscriptionConfirmedNotification } from "../utils/fcmNotification.js";
import { TRIAL_DAYS } from "@shared/defaults/commercialPolicy.js";

const config = useRuntimeConfig();

const LICENSE_TYPES = {
  LITE:  "Lite",
  CRM:   "CRM",
  PRO:   "Pro",
  // Legacy values — kept for webhook backwards compat with old Stripe products
  TRIAL: "Trial",
  DRIFT: "Drift",
  GLIDE: "Glide",
  SOAR:  "Soar",
};

const BILLING_CYCLES = {
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

const normalizeLicenseType = (raw) => {
  const value = String(raw || "").trim().toLowerCase();
  if (!value) return null;
  if (value === "pro")   return LICENSE_TYPES.PRO;
  if (value === "crm")   return LICENSE_TYPES.CRM;
  if (value === "lite")  return LICENSE_TYPES.LITE;
  if (value === "soar")  return LICENSE_TYPES.SOAR;
  if (value === "glide") return LICENSE_TYPES.GLIDE;
  if (value === "drift") return LICENSE_TYPES.DRIFT;
  if (value === "trial") return LICENSE_TYPES.TRIAL;
  return null;
};

const resolveLicenseTypeFromPrice = (price) => {
  const direct =
    normalizeLicenseType(price?.metadata?.license_type) ||
    normalizeLicenseType(price?.metadata?.licenseType) ||
    normalizeLicenseType(price?.product?.metadata?.license_type) ||
    normalizeLicenseType(price?.product?.metadata?.licenseType);
  if (direct) return direct;

  const name = String(price?.product?.name || "").toLowerCase();
  if (name.includes("pro"))   return LICENSE_TYPES.PRO;
  if (name.includes("crm"))   return LICENSE_TYPES.CRM;
  if (name.includes("lite"))  return LICENSE_TYPES.LITE;
  if (name.includes("soar"))  return LICENSE_TYPES.SOAR;
  if (name.includes("glide")) return LICENSE_TYPES.GLIDE;
  if (name.includes("drift")) return LICENSE_TYPES.DRIFT;
  if (name.includes("trial")) return LICENSE_TYPES.TRIAL;
  return LICENSE_TYPES.LITE;
};

const resolveBillingCycleFromPrice = (price) => {
  const interval = price?.recurring?.interval;
  const count = Number(price?.recurring?.interval_count || 1);
  if (interval === "year") return BILLING_CYCLES.YEARLY;
  if (interval === "month" && count >= 12) return BILLING_CYCLES.YEARLY;
  return BILLING_CYCLES.MONTHLY;
};

const resolveLicenseFromPrice = (price) => ({
  licenseType: resolveLicenseTypeFromPrice(price),
  licenseBillingCycle: resolveBillingCycleFromPrice(price),
});

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const resolvePriceForSubscription = async (subscriptionId, priceId) => {
  if (priceId) {
    return stripe.prices.retrieve(priceId, { expand: ["product"] });
  }

  const stripeSub = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price.product"],
  });
  return stripeSub?.items?.data?.[0]?.price || null;
};

const resolveRenewalDateFromSubscription = (subscription) => {
  const periodEnd = Number(subscription?.current_period_end);
  if (Number.isFinite(periodEnd) && periodEnd > 0) {
    return new Date(periodEnd * 1000);
  }
  return null;
};

const updateOrgLicenseFromSubscription = async (stripeSubscription) => {
  if (!stripeSubscription) return;

  const subscriptionId = stripeSubscription.id;
  const subscription = stripeSubscription.items?.data?.[0]?.price?.product
    ? stripeSubscription
    : await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ["items.data.price.product"],
      });

  const subRecord = await UserSubscription.findOne({
    where: { stripeSubscriptionId: subscription.id },
  });
  if (!subRecord?.organisationId) return;

  const org = await Organisation.findByPk(subRecord.organisationId);
  if (!org) return;

  const price = subscription?.items?.data?.[0]?.price || null;
  const { licenseType, licenseBillingCycle } = resolveLicenseFromPrice(price);
  const renewalDate = resolveRenewalDateFromSubscription(subscription);
  const updates = { licenseType, licenseBillingCycle };
  if (renewalDate) updates.licenseRenewalDate = renewalDate;

  await org.update(updates);
};

export const createSubscription = async (event) => {
  const body = await readBody(event);
  const loggedUser = event.context.user;
  const { priceId } = body;
  if (!priceId) throw createError({ message: "priceId required" });
  let user = await UserSubscription.findOne({
    where: { userId: loggedUser.userId, organisationId: loggedUser.orgId },
  });
  try {
    // create or reuse customer
    let customerId = user?.stripeCustomerId || null;
    const ensureCustomer = async () => {
      if (customerId) return customerId;
      const userData = await User.findByPk(loggedUser.userId);
      if (!userData) throw createError({ message: "User not found" });
      const customer = await stripe.customers.create({
        email: userData.email,
        name: userData.fullName,
        metadata: { userId: loggedUser.userId },
      });
      customerId = customer.id;
      if (user) {
        await user.update({ stripeCustomerId: customerId });
      } else {
        user = await UserSubscription.create({
          stripeCustomerId: customerId,
          userId: loggedUser.userId,
          organisationId: loggedUser.orgId,
        });
      }
      return customerId;
    };
    await ensureCustomer();

    // create subscription in incomplete state to get payment intent
    let subscription;
    try {
      subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId, quantity: 1 }],
        payment_behavior: "default_incomplete",
        payment_settings: {
          save_default_payment_method: "on_subscription",
          payment_method_types: ["card"],
        },
        expand: ["latest_invoice.payment_intent"],
        metadata: {
          userId: String(loggedUser.userId),
          organisationId: loggedUser.orgId,
        },
      });
    } catch (err) {
      const isMissingCustomer =
        err?.code === "resource_missing" ||
        err?.param === "customer" ||
        /No such customer/i.test(err?.message || "");
      if (isMissingCustomer) {
        if (user) {
          await user.update({
            stripeCustomerId: null,
            stripeSubscriptionId: null,
            stripeSubscriptionStatus: null,
          });
        }
        customerId = null;
        await ensureCustomer();
        subscription = await stripe.subscriptions.create({
          customer: customerId,
          items: [{ price: priceId, quantity: 1 }],
          payment_behavior: "default_incomplete",
          payment_settings: {
            save_default_payment_method: "on_subscription",
            payment_method_types: ["card"],
          },
          expand: ["latest_invoice.payment_intent"],
          metadata: {
            userId: String(loggedUser.userId),
            organisationId: loggedUser.orgId,
          },
        });
      } else {
        throw err;
      }
    }

    // Save subscription id & package price id locally (status might be 'incomplete')
    await UserSubscription.update(
      {
        stripeSubscriptionId: subscription.id,
        stripeSubscriptionStatus: subscription.status,
        packagePriceId: priceId,
      },
      {
        where: {
          userId: loggedUser.userId,
          organisationId: loggedUser.orgId,
        },
      }
    );

    const paymentIntent =
      subscription.latest_invoice?.payment_intent || undefined;
    const clientSecret = paymentIntent?.client_secret || null;

    return success({ subscription, clientSecret });
  } catch (err) {
    return error(500, err.message);
  }
};

export const getConfigs = async (event) => {};

export const createPortal = async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody(event);
  const loggedUser = event.context.user;
  const { returnUrl } = parseJsonBody(body);

  const user = await UserSubscription.findOne({
    where: { userId: loggedUser.userId, organisationId: loggedUser.orgId },
  });
  if (!user || !user.stripeCustomerId)
    throw createError({ message: "Stripe customer not found" });
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: returnUrl || config.public.BASE_URL,
    });
    return success({ url: session.url });
  } catch (err) {
    return error(500, err.message);
  }
};

export const confirmPayment = async (event) => {
  const loggedUser = event.context.user;
  const body = await readBody(event);
  const { subscriptionId } = body;
  try {
    const subscription = await UserSubscription.findOne({
      where: {
        stripeSubscriptionId: subscriptionId,
        userId: loggedUser.userId,
        organisationId: loggedUser.orgId,
      },
    });
    if (!subscription)
      throw createError({ message: "Subscription not found in system" });
    subscription.stripeSubscriptionStatus = "active";
    await subscription.save();
    const org = await Organisation.findByPk(loggedUser.orgId);
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscriptionId,
      { expand: ["items.data.price.product"] }
    );
    const price =
      stripeSubscription?.items?.data?.[0]?.price ||
      (await resolvePriceForSubscription(
        subscriptionId,
        subscription.packagePriceId
      ));
    const { licenseType, licenseBillingCycle } = resolveLicenseFromPrice(price);
    const renewalDate =
      resolveRenewalDateFromSubscription(stripeSubscription) ||
      addDays(
        new Date(),
        licenseBillingCycle === BILLING_CYCLES.YEARLY ? 365 : 30
      );

    await org.update({ licenseType, licenseBillingCycle, licenseRenewalDate: renewalDate });
    const loggedUserObj = await User.findByPk(loggedUser.userId)
    await paymentSuccessNotification(loggedUserObj)

    // Push notification (in addition to email)
    try {
      await sendSystemSubscriptionConfirmedNotification({
        userId: loggedUser.userId,
        stripeSubscriptionId: subscriptionId,
      });
    } catch (pushErr) {
      console.warn("Subscription push notification failed", {
        userId: loggedUser.userId,
        error: pushErr?.message || pushErr,
      });
    }

    return success("Subscription updated");
  } catch (err) {
    return error(500, err.message);
  }
};

export const prices = async (event) => {
  try {
    const prices = await stripe.prices.list({
      active: true,
      expand: ["data.product"],
      limit: 100,
    });
    const mapped = prices.data.map((p) => ({
      id: p.id,
      nickname: p.nickname,
      unit_amount: p.unit_amount,
      currency: p.currency,
      recurring: p.recurring,
      created: p.created,
      product: {
        id: p.product.id,
        name: p.product.name,
        description: p.product.description,
      },
    }));
    return success(mapped);
  } catch (err) {
    return error(500, err.message);
  }
};

export const webhook = async (event) => {
  if (event.node.req.method !== "POST") {
    throw createError({ message: "Bad Reuest" });
  }

  const sig = getRequestHeaders(event)["stripe-signature"];
  if (!sig) {
    throw createError({ message: "Missing Stripe Signatures" });
  }

  const raw = await readRawBody(event); // Buffer
  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      raw,
      sig,
      config.stripeWebhookSecret
    );
  } catch (err) {
    return error(500, err.message);
  }
  try {
    const type = stripeEvent.type;
    const obj = stripeEvent.data.object;

    switch (type) {
      case "invoice.payment_succeeded": {
        const subscriptionId = obj.subscription;
        await UserSubscription.update(
          { stripeSubscriptionStatus: "active" },
          { where: { stripeSubscriptionId: subscriptionId } }
        );
        const subscription = await stripe.subscriptions.retrieve(
          subscriptionId,
          { expand: ["items.data.price.product"] }
        );
        await updateOrgLicenseFromSubscription(subscription);
        break;
      }
      case "invoice.payment_failed": {
        const subscriptionId = obj.subscription;
        await UserSubscription.update(
          { stripeSubscriptionStatus: "past_due" },
          { where: { stripeSubscriptionId: subscriptionId } }
        );
        break;
      }
      case "customer.subscription.updated": {
        const subscription = obj;
        await UserSubscription.update(
          {
            stripeSubscriptionStatus: subscription.status,
            stripeSubscriptionId: subscription.id,
          },
          { where: { stripeCustomerId: subscription.customer } }
        );
        await updateOrgLicenseFromSubscription(subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = obj;
        await updateOrgLicenseFromSubscription(subscription);
        await UserSubscription.update(
          {
            stripeSubscriptionStatus: "canceled",
            stripeSubscriptionId: null,
          },
          { where: { stripeCustomerId: subscription.customer } }
        );
        break;
      }
      case "checkout.session.completed": {
        // in case checkout is used elsewhere
        const session = obj;
        const userId = session.client_reference_id;
        if (userId) {
          await UserSubscription.update(
            {
              stripeCustomerId: session.customer,
              stripeSubscriptionId: session.subscription,
              stripeSubscriptionStatus: "active",
            },
            { where: { userId } }
          );
        }
        break;
      }
      default:
        return success("Ignored....");
    }
  } catch (err) {
    return error(500, err.message);
  }
  return success("Webhooks updated...");
};

export const getSubscription = async (event) => {
  try {
    const loggedUser = event.context.user;
    const subRecord = await UserSubscription.findOne({
      where: { userId: loggedUser.userId },
      raw: true,
    });

    if (!subRecord || !subRecord.stripeSubscriptionId) {
      throw createError({ message: "No Active subscription " });
    }

    // Fetch from Stripe to get the latest status/details
    const stripeSub = await stripe.subscriptions.retrieve(
      subRecord.stripeSubscriptionId
    );

    return success(stripeSub);
  } catch (err) {
    return error(500, err.message);
  }
};

export const startCrmTrial = async (event) => {
  try {
    const loggedUser = event.context.user;
    if (!loggedUser?.userId || !loggedUser?.orgId) return error(401, 'Unauthenticated');

    const { tier = 'CRM' } = await readBody(event);
    if (!['CRM', 'Pro'].includes(tier)) return error(400, 'tier must be CRM or Pro');

    const org = await Organisation.findByPk(loggedUser.orgId);
    if (!org) return error(404, 'Organisation not found');
    if (org.hasUsedTrial) return error(409, 'This organisation has already used its free trial');

    if (resolveTier(org.licenseType) !== 'Lite') return error(409, 'Free trial is only available on the free Lite plan');

    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + TRIAL_DAYS);

    await org.update({ licenseType: tier, licenseRenewalDate: trialEndDate, hasUsedTrial: true });

    return success({ trialEndDate: trialEndDate.toISOString(), tier });
  } catch (err) {
    return error(500, err.message);
  }
};
