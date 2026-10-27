export type SubscriptionPlan = "free" | "pro";

export type ViewerEntitlements = {
  userId: string | null;
  plan: SubscriptionPlan;
  hasProAccess: boolean;
};
