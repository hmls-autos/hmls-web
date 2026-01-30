import Stripe from "stripe";

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    const secretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is required");
    }
    _stripe = new Stripe(secretKey);
  }
  return _stripe;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const client = getStripe();
    const value = client[prop as keyof typeof client];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

// Credit costs per input type
export const CREDIT_COSTS = {
  text: 1,
  obd: 1,
  photo: 2,
  audio: 5, // per 30s
  video: 10, // per 30s
} as const;

export type InputType = keyof typeof CREDIT_COSTS;

export async function getCustomerCredits(
  stripeCustomerId: string
): Promise<number> {
  const customer = await stripe.customers.retrieve(stripeCustomerId);
  if (customer.deleted) {
    throw new Error("Customer not found");
  }
  // Credits stored as balance in cents (1 credit = 1 cent for simplicity)
  return Math.floor((customer.balance ?? 0) / -1); // Negative balance = available credits
}

export async function deductCredits(
  stripeCustomerId: string,
  amount: number,
  description: string
): Promise<void> {
  await stripe.customers.createBalanceTransaction(stripeCustomerId, {
    amount: amount, // Positive = deduct (increase balance owed)
    currency: "usd",
    description,
  });
}

export async function addCredits(
  stripeCustomerId: string,
  amount: number,
  description: string
): Promise<void> {
  await stripe.customers.createBalanceTransaction(stripeCustomerId, {
    amount: -amount, // Negative = add credits (decrease balance owed)
    currency: "usd",
    description,
  });
}

export function calculateAudioCredits(durationSeconds: number): number {
  return Math.ceil(durationSeconds / 30) * CREDIT_COSTS.audio;
}

export function calculateVideoCredits(durationSeconds: number): number {
  return Math.ceil(durationSeconds / 30) * CREDIT_COSTS.video;
}
