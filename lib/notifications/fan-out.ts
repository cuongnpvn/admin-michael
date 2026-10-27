import type { SupabaseClient } from "@supabase/supabase-js";
import { categoryAllowedByPrefs } from "@/lib/notifications/preferences";
import type {
  NotificationCategory,
  NotificationInsertRow,
  NotificationPreferences,
} from "@/lib/notifications/types";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/lib/notifications/types";
import type { Database } from "@/types/database";

const BATCH_SIZE = 500;

interface PrefsRow {
  user_id: string;
  learning_reminder: boolean;
  content_release: boolean;
  marketing: boolean;
  timezone: string;
}

async function loadPrefsMap(
  supabase: SupabaseClient<Database>,
  userIds: string[],
): Promise<Map<string, NotificationPreferences>> {
  const map = new Map<string, NotificationPreferences>();
  if (userIds.length === 0) return map;

  for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
    const chunk = userIds.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase
      .from("notification_preferences")
      .select("user_id, learning_reminder, content_release, marketing, timezone")
      .in("user_id", chunk);

    if (error) throw error;

    for (const row of (data ?? []) as PrefsRow[]) {
      map.set(row.user_id, {
        learningReminder: row.learning_reminder,
        contentRelease: row.content_release,
        marketing: row.marketing,
        timezone: row.timezone || DEFAULT_NOTIFICATION_PREFERENCES.timezone,
      });
    }
  }

  return map;
}

export async function fanOutNotifications(
  supabase: SupabaseClient<Database>,
  rows: NotificationInsertRow[],
): Promise<{ inserted: number; skipped: number }> {
  if (rows.length === 0) return { inserted: 0, skipped: 0 };

  const userIds = [...new Set(rows.map((row) => row.user_id))];
  const prefsMap = await loadPrefsMap(supabase, userIds);

  const eligible = rows.filter((row) =>
    categoryAllowedByPrefs(
      row.category as NotificationCategory,
      prefsMap.get(row.user_id),
    ),
  );
  const skipped = rows.length - eligible.length;

  let inserted = 0;
  for (let i = 0; i < eligible.length; i += BATCH_SIZE) {
    const chunk = eligible.slice(i, i + BATCH_SIZE).map((row) => ({
      user_id: row.user_id,
      category: row.category,
      kind: row.kind,
      title: row.title,
      body: row.body,
      deep_link: row.deep_link ?? "",
      payload: row.payload ?? {},
      campaign_id: row.campaign_id ?? null,
      dedupe_key: row.dedupe_key ?? null,
    }));

    const { error, count } = await supabase
      .from("user_notifications")
      .insert(chunk, { count: "exact" });

    if (error) throw error;
    inserted += count ?? chunk.length;
  }

  return { inserted, skipped };
}
