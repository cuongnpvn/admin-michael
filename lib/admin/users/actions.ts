"use server";

import { revalidatePath } from "next/cache";
import {
  AdminAccessError,
  requireAdminSession,
} from "@/lib/admin/auth/require-admin";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { copy } from "@/lib/copy/vi";
import type { SubscriptionPlan } from "@/lib/entitlements/types";

export type AdminUserActionResult =
  | { ok: true }
  | { ok: false; error: string };

function accessError(code: string): string {
  if (code === "not_signed_in") return copy.admin.users.errors.notSignedIn;
  if (code === "not_admin") return copy.admin.users.errors.notAdmin;
  return copy.admin.users.errors.generic;
}

function revalidateUserPlanPaths() {
  revalidatePath("/admin/users");
}

async function applySubscriptionPlan(
  userId: string,
  plan: SubscriptionPlan,
  currentPeriodEnd?: string | null,
): Promise<void> {
  const service = createServiceRoleClient();
  const now = new Date().toISOString();

  const { error: cancelError } = await service
    .from("subscriptions")
    .update({ status: "canceled", updated_at: now })
    .eq("user_id", userId)
    .eq("status", "active");

  if (cancelError) throw cancelError;

  if (plan === "pro") {
    const { error: insertError } = await service.from("subscriptions").insert({
      user_id: userId,
      plan: "pro",
      status: "active",
      provider: "manual",
      current_period_end: currentPeriodEnd?.trim() || null,
      metadata: {},
    });
    if (insertError) throw insertError;
  }
}

export async function setUserSubscriptionPlan(
  userId: string,
  plan: SubscriptionPlan,
  currentPeriodEnd?: string | null,
): Promise<AdminUserActionResult> {
  try {
    await requireAdminSession();

    const trimmedUserId = userId.trim();
    if (!trimmedUserId) {
      return { ok: false, error: copy.admin.users.errors.userRequired };
    }

    if (plan !== "free" && plan !== "pro") {
      return { ok: false, error: copy.admin.users.errors.invalidPlan };
    }

    await applySubscriptionPlan(trimmedUserId, plan, currentPeriodEnd);
    revalidateUserPlanPaths();
    return { ok: true };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }
    console.error("setUserSubscriptionPlan failed", error);
    return { ok: false, error: copy.admin.users.errors.generic };
  }
}

/** Upgrade selected free-tier users to Pro. Skips users already on Pro. */
export async function upgradeUsersToPro(
  userIds: string[],
): Promise<AdminUserActionResult> {
  try {
    await requireAdminSession();

    const uniqueIds = [
      ...new Set(userIds.map((id) => id.trim()).filter((id) => id.length > 0)),
    ];
    if (uniqueIds.length === 0) {
      return { ok: false, error: copy.admin.users.errors.userRequired };
    }

    const service = createServiceRoleClient();
    const nowMs = Date.now();
    const now = new Date().toISOString();

    const { data: subscriptions, error: subscriptionsError } = await service
      .from("subscriptions")
      .select("user_id, plan, status, current_period_end")
      .eq("status", "active")
      .in("user_id", uniqueIds);

    if (subscriptionsError) throw subscriptionsError;

    const proUserIds = new Set(
      ((subscriptions ?? []) as Array<{
        user_id: string;
        plan: SubscriptionPlan;
        status: string;
        current_period_end: string | null;
      }>)
        .filter((sub) => {
          if (sub.plan !== "pro" || sub.status !== "active") return false;
          if (!sub.current_period_end) return true;
          return new Date(sub.current_period_end).getTime() > nowMs;
        })
        .map((sub) => sub.user_id),
    );

    const { data: profiles, error: profilesError } = await service
      .from("profiles")
      .select("id, is_admin")
      .in("id", uniqueIds);

    if (profilesError) throw profilesError;

    const adminIds = new Set(
      ((profiles ?? []) as Array<{ id: string; is_admin: boolean }>)
        .filter((profile) => profile.is_admin)
        .map((profile) => profile.id),
    );

    const freeUserIds = uniqueIds.filter(
      (id) => !proUserIds.has(id) && !adminIds.has(id),
    );

    if (freeUserIds.length === 0) {
      return { ok: false, error: copy.admin.users.errors.noFreeSelected };
    }

    const { error: cancelError } = await service
      .from("subscriptions")
      .update({ status: "canceled", updated_at: now })
      .in("user_id", freeUserIds)
      .eq("status", "active");

    if (cancelError) throw cancelError;

    const { error: insertError } = await service.from("subscriptions").insert(
      freeUserIds.map((userId) => ({
        user_id: userId,
        plan: "pro" as const,
        status: "active" as const,
        provider: "manual",
        current_period_end: null,
        metadata: {},
      })),
    );

    if (insertError) throw insertError;

    revalidateUserPlanPaths();
    return { ok: true };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }
    console.error("upgradeUsersToPro failed", error);
    return { ok: false, error: copy.admin.users.errors.generic };
  }
}
