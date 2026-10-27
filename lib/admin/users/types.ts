import type { SubscriptionPlan } from "@/lib/entitlements/types";

export type AdminUserRow = {
  id: string;
  displayName: string;
  email: string | null;
  isAdmin: boolean;
  plan: SubscriptionPlan;
  subscriptionStatus: "active" | "canceled" | "expired" | "past_due" | null;
  currentPeriodEnd: string | null;
};
