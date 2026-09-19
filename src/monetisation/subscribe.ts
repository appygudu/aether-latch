import { STORAGE } from "../core/config";

export type PlanId = "monthly" | "yearly";

export interface Plan {
  id: PlanId;
  label: string;
  price: string;
  usd: string;
}

export const PLANS: Record<PlanId, Plan> = {
  monthly: { id: "monthly", label: "Monthly", price: "₹419 / month", usd: "~$4.99" },
  yearly: { id: "yearly", label: "Yearly", price: "₹2499 / year", usd: "~$29.99" },
};

/**
 * Live Razorpay hosted checkout (Test Mode OFF).
 * Plan IDs are documented only — hosted links do not need the SDK:
 *   monthly → plan_TdpXQDppRu26iS
 *   yearly  → plan_Tdpa4NZjvSmkPf
 */
export const RAZORPAY_CHECKOUT: Record<PlanId, string> = {
  monthly: "https://rzp.io/rzp/9v5vQRc4",
  yearly: "https://rzp.io/rzp/ObFehb1q",
};

export function isSubscribed(): boolean {
  return localStorage.getItem(STORAGE.subscribed) === "true";
}

export function currentPlan(): PlanId | null {
  const raw = localStorage.getItem(STORAGE.plan);
  return raw === "monthly" || raw === "yearly" ? raw : null;
}

/**
 * Open Razorpay hosted checkout for the chosen plan in a new tab.
 * Does not set the local entitlement — hosted payment links have no
 * webhook/callback without a backend. The player unlocks via
 * `unlockThisBrowser()` after they return.
 */
export function subscribe(plan: PlanId): boolean {
  const url = RAZORPAY_CHECKOUT[plan];
  window.open(url, "_blank", "noopener,noreferrer");
  return false;
}

/**
 * Mark this browser as Pro after a completed Razorpay payment
 * (or when restoring an existing subscription on this device).
 * Honest client-side entitlement — no receipt verification yet.
 */
export function unlockThisBrowser(plan?: PlanId | null): boolean {
  localStorage.setItem(STORAGE.subscribed, "true");
  if (plan) {
    localStorage.setItem(STORAGE.plan, plan);
  } else if (!localStorage.getItem(STORAGE.plan)) {
    localStorage.setItem(STORAGE.plan, "yearly");
  }
  return true;
}

/** Restore / I already subscribed — same local unlock as post-payment. */
export function restore(plan?: PlanId | null): boolean {
  return unlockThisBrowser(plan);
}
