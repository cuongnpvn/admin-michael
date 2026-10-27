"use server";

import { revalidatePath } from "next/cache";
import {
  AdminAccessError,
  requireAdminSession,
} from "@/lib/admin/auth/require-admin";
import { adminNotificationsPath } from "@/lib/admin/admin-paths";
import { resolveNotificationAudience } from "@/lib/notifications/audience";
import { fanOutNotifications } from "@/lib/notifications/fan-out";
import { invokeLearningReminders } from "@/lib/notifications/invoke-reminders";
import type {
  CampaignCategory,
  CampaignFormValues,
  NotificationAudience,
  NotificationKind,
} from "@/lib/notifications/types";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { copy } from "@/lib/copy/vi";

export type AdminNotificationActionResult =
  | { ok: true; campaignId?: string; message?: string }
  | { ok: false; error: string };

function accessError(code: string): string {
  if (code === "not_signed_in") {
    return copy.admin.notifications.errors.notSignedIn;
  }
  if (code === "not_admin") return copy.admin.notifications.errors.notAdmin;
  return copy.admin.notifications.errors.generic;
}

function validateForm(values: CampaignFormValues): string | null {
  if (!values.title.trim()) {
    return copy.admin.notifications.errors.titleRequired;
  }
  return null;
}

function campaignKind(category: CampaignCategory): NotificationKind {
  return category === "marketing" ? "promo" : "content_release";
}

export async function createNotificationCampaign(
  values: CampaignFormValues,
): Promise<AdminNotificationActionResult> {
  try {
    const validationError = validateForm(values);
    if (validationError) return { ok: false, error: validationError };

    const { supabase, user } = await requireAdminSession();
    const { data, error } = await supabase
      .from("notification_campaigns")
      .insert({
        title: values.title.trim(),
        body: values.body.trim(),
        deep_link: values.deepLink.trim(),
        category: values.category,
        audience: values.audience,
        payload: values.payload ?? {},
        status: "draft",
        created_by: user.id,
      })
      .select("id")
      .single();

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath(adminNotificationsPath());
    return { ok: true, campaignId: data.id as string };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : copy.admin.notifications.errors.saveFailed,
    };
  }
}

export async function updateNotificationCampaign(
  campaignId: string,
  values: CampaignFormValues,
): Promise<AdminNotificationActionResult> {
  try {
    const validationError = validateForm(values);
    if (validationError) return { ok: false, error: validationError };

    const { supabase } = await requireAdminSession();
    const { data: existing, error: loadError } = await supabase
      .from("notification_campaigns")
      .select("status")
      .eq("id", campaignId)
      .single();

    if (loadError) return { ok: false, error: loadError.message };
    if ((existing.status as string) !== "draft") {
      return { ok: false, error: copy.admin.notifications.errors.notDraft };
    }

    const { error } = await supabase
      .from("notification_campaigns")
      .update({
        title: values.title.trim(),
        body: values.body.trim(),
        deep_link: values.deepLink.trim(),
        category: values.category,
        audience: values.audience,
        payload: values.payload ?? {},
      })
      .eq("id", campaignId);

    if (error) return { ok: false, error: error.message };

    revalidatePath(adminNotificationsPath());
    return { ok: true, campaignId };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : copy.admin.notifications.errors.saveFailed,
    };
  }
}

export async function cancelNotificationCampaign(
  campaignId: string,
): Promise<AdminNotificationActionResult> {
  try {
    const { supabase } = await requireAdminSession();
    const { error } = await supabase
      .from("notification_campaigns")
      .update({ status: "cancelled" })
      .eq("id", campaignId)
      .eq("status", "draft");

    if (error) return { ok: false, error: error.message };

    revalidatePath(adminNotificationsPath());
    return { ok: true };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }
    return { ok: false, error: copy.admin.notifications.errors.generic };
  }
}

export async function sendNotificationCampaign(
  campaignId: string,
): Promise<AdminNotificationActionResult> {
  try {
    await requireAdminSession();
    const service = createServiceRoleClient();

    const { data: campaign, error: loadError } = await service
      .from("notification_campaigns")
      .select(
        "id, title, body, deep_link, category, audience, status, payload",
      )
      .eq("id", campaignId)
      .single();

    if (loadError) return { ok: false, error: loadError.message };
    if ((campaign.status as string) !== "draft") {
      return { ok: false, error: copy.admin.notifications.errors.notDraft };
    }

    const { error: lockingError } = await service
      .from("notification_campaigns")
      .update({ status: "sending" })
      .eq("id", campaignId)
      .eq("status", "draft");

    if (lockingError) return { ok: false, error: lockingError.message };

    try {
      const userIds = await resolveNotificationAudience(
        service,
        campaign.audience as NotificationAudience,
      );
      const category = campaign.category as CampaignCategory;
      const kind = campaignKind(category);

      await fanOutNotifications(
        service,
        userIds.map((userId) => ({
          user_id: userId,
          category,
          kind,
          title: campaign.title as string,
          body: (campaign.body as string) ?? "",
          deep_link: (campaign.deep_link as string) ?? "",
          payload: (campaign.payload as Record<string, unknown>) ?? {},
          campaign_id: campaignId,
          dedupe_key: `campaign:${campaignId}`,
        })),
      );

      const { error: sentError } = await service
        .from("notification_campaigns")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .eq("id", campaignId);

      if (sentError) return { ok: false, error: sentError.message };
    } catch (sendError) {
      await service
        .from("notification_campaigns")
        .update({ status: "draft" })
        .eq("id", campaignId);
      throw sendError;
    }

    revalidatePath(adminNotificationsPath());
    return { ok: true, campaignId };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : copy.admin.notifications.errors.sendFailed,
    };
  }
}

export async function runLearningRemindersNow(): Promise<AdminNotificationActionResult> {
  try {
    await requireAdminSession();
    const result = await invokeLearningReminders();
    if (!result.ok) {
      return {
        ok: false,
        error: `${copy.admin.notifications.errors.remindersFailed} (${result.status}) ${result.body}`,
      };
    }
    return {
      ok: true,
      message: copy.admin.notifications.runRemindersOk(result.body),
    };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : copy.admin.notifications.errors.remindersFailed,
    };
  }
}
