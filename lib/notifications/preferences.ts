import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationPreferences,
} from "@/lib/notifications/types";
import type { Database } from "@/types/database";

interface PrefsDbRow {
  learning_reminder: boolean;
  content_release: boolean;
  marketing: boolean;
  timezone: string;
}

function mapPrefs(row: PrefsDbRow): NotificationPreferences {
  return {
    learningReminder: row.learning_reminder,
    contentRelease: row.content_release,
    marketing: row.marketing,
    timezone: row.timezone || DEFAULT_NOTIFICATION_PREFERENCES.timezone,
  };
}

export async function getOrCreateNotificationPreferences(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<NotificationPreferences> {
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("learning_reminder, content_release, marketing, timezone")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (data) return mapPrefs(data as PrefsDbRow);

  const { data: inserted, error: insertError } = await supabase
    .from("notification_preferences")
    .insert({
      user_id: userId,
      learning_reminder: DEFAULT_NOTIFICATION_PREFERENCES.learningReminder,
      content_release: DEFAULT_NOTIFICATION_PREFERENCES.contentRelease,
      marketing: DEFAULT_NOTIFICATION_PREFERENCES.marketing,
      timezone: DEFAULT_NOTIFICATION_PREFERENCES.timezone,
    })
    .select("learning_reminder, content_release, marketing, timezone")
    .single();

  if (insertError) {
    // Race: another request inserted first
    const { data: retry, error: retryError } = await supabase
      .from("notification_preferences")
      .select("learning_reminder, content_release, marketing, timezone")
      .eq("user_id", userId)
      .single();
    if (retryError) throw insertError;
    return mapPrefs(retry as PrefsDbRow);
  }

  return mapPrefs(inserted as PrefsDbRow);
}

export async function updateNotificationPreferences(
  supabase: SupabaseClient<Database>,
  userId: string,
  prefs: Pick<
    NotificationPreferences,
    "learningReminder" | "contentRelease" | "marketing"
  >,
): Promise<void> {
  const { error } = await supabase.from("notification_preferences").upsert(
    {
      user_id: userId,
      learning_reminder: prefs.learningReminder,
      content_release: prefs.contentRelease,
      marketing: prefs.marketing,
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}

export function categoryAllowedByPrefs(
  category: "learning_reminder" | "content_release" | "marketing" | "system",
  prefs: NotificationPreferences | null | undefined,
): boolean {
  if (category === "system") return true;
  const resolved = prefs ?? DEFAULT_NOTIFICATION_PREFERENCES;
  if (category === "learning_reminder") return resolved.learningReminder;
  if (category === "content_release") return resolved.contentRelease;
  if (category === "marketing") return resolved.marketing;
  return true;
}
