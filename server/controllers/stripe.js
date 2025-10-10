import stripe from "@/server/utils/stripe";
import { UserPreference, UserSubscription } from "../models";
import { User } from "../models";

export const createSubscription = async (event) => {
  const body = await readBody(event);
  const loggedUser = event.context.user;
  const { priceId } = body;
  if (!priceId) throw createError({ message: "priceId required" });
  const user = await UserSubscription.findOne({
    where: { userId: loggedUser.userId, organisationId: loggedUser.orgId },
  });
  try {
    // create or reuse customer
    let customerId;
    if (user) {
      customerId = user.stripeCustomerId;
    } else {
      const userData = await User.findByPk(loggedUser.userId);
      if (!userData) throw createError({ message: "User not found" });
      const customer = await stripe.customers.create({
        email: userData.email,
        name: userData.fullName,
        metadata: { userId: loggedUser.userId },
      });
      customerId = customer.id;
      await UserSubscription.create({
        stripeCustomerId: customerId,
        userId: loggedUser.userId,
        organisationId: loggedUser.orgId,
      });
    }

    // create subscription in incomplete state to get payment intent
    const subscription = await stripe.subscriptions.create({
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
  const { returnUrl } = JSON.parse(body);

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
    const user = await UserPreference.findOne({
      where: { userId: loggedUser.userId },
    });
    const today = new Date().getDate();
    const renewalDate = new Date(new Date().setDate(today + 30));
    user.licenseType = "Monthly";
    user.licenseRenewalDate = renewalDate;
    await user.save();
    await paymentSuccessNotification(user)
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
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = obj;
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
