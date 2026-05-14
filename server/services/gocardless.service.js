import gocardless from "gocardless-nodejs";
import { Environments } from "gocardless-nodejs/constants";

export const gcClient = gocardless(
  process.env.GOCARDLESS_ACCESS_TOKEN,
  process.env.GOCARDLESS_ENV === "live"
    ? Environments.Live
    : Environments.Sandbox,
  { raiseOnIdempotencyConflict: true },
);
