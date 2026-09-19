import { STORAGE } from "../core/config";

export type PlanId = "monthly" | "yearly";

export interface Plan {
  id: PlanId;
  label: string;
  price: string;
}

export const PLANS: Record<PlanId, Plan> = {
  monthly: { id: "monthly", label: "Monthly", price: "$4.99 / month" },
  yearly: { id: "yearly", label: "Yearly", price: "$29.99 / year" },
};

export function isSubscribed(): boolean {
  return localStorage.getItem(STORAGE.subscribed) === "true";
}

export function currentPlan(): PlanId | null {
  const raw = localStorage.getItem(STORAGE.plan);
  return raw === "monthly" || raw === "yearly" ? raw : null;
}

/**
 * Simulated checkout for the v1 demo.
 *
 * TODO(payments): Replace this with Stripe Checkout Session creation.
 *   1. POST /api/checkout { plan } with an authenticated or anonymous customer id
 *   2. Redirect to session.url
 *   3. On success_url, verify the session and set the subscriber entitlement
 *
 * TODO(payments): On Capacitor / TWA / App Store builds, swap this for
 * RevenueCat `Purchases.purchasePackage()` and map product ids:
 *   - monthly → aether_pro_monthly
 *   - yearly  → aether_pro_yearly
 */
export async function subscribe(plan: PlanId): Promise<boolean> {
  // TODO(payments): live Stripe / RevenueCat purchase flow goes here.
  // Never put secret API keys in the client. Use a tiny backend or
  // Stripe Checkout with a restricted publishable key only.
  await delay(280);
  localStorage.setItem(STORAGE.subscribed, "true");
  localStorage.setItem(STORAGE.plan, plan);
  return true;
}

/**
 * Restore an existing entitlement.
 *
 * TODO(payments): Web — send the player to Stripe Customer Portal, or
 * look up the customer by email / magic link and refresh entitlements.
 * TODO(payments): Native — call RevenueCat `Purchases.restorePurchases()`
 * and then `Purchases.getCustomerInfo()`.
 */
export async function restore(): Promise<boolean> {
  await delay(220);
  if (isSubscribed()) return true;
  // Demo path: treat an explicit restore as a successful receipt replay.
  localStorage.setItem(STORAGE.subscribed, "true");
  if (!localStorage.getItem(STORAGE.plan)) {
    localStorage.setItem(STORAGE.plan, "yearly");
  }
  return true;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
