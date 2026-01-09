
import Stripe from "stripe";

const config = useRuntimeConfig();
const stripeSecret =
  config.Stripe_SK ||
  process.env.NUXT_STRIPE_SK ||
  process.env.STRIPE_SK ||
  "";
const stripe = new Stripe(stripeSecret.trim(), {
  apiVersion: "2022-11-15",
});

export default stripe;
