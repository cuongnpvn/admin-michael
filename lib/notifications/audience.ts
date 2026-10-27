import type { SupabaseClient } from "@supabase/supabase-js";
import type { NotificationAudience } from "@/lib/notifications/types";
import type { Database } from "@/types/database";

async function listAllProfileIds(
  supabase: SupabaseClient<Database>,
): Promise<string[]> {
  const { data, error } = await supabase.from("profiles").select("id");
  if (error) throw error;
  return (data ?? []).map((row) => row.id as string);
}

async function listActiveProUserIds(
  supabase: SupabaseClient<Database>,
): Promise<Set<string>> {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("user_id, current_period_end")
    .eq("status", "active")
    .eq("plan", "pro");

  if (error) throw error;

  const ids = new Set<string>();
  for (const row of data ?? []) {
    const end = row.current_period_end as string | null;
    if (end == null || end > nowIso) {
      ids.add(row.user_id as string);
    }
  }
  return ids;
}

async function listActive7dUserIds(
  supabase: SupabaseClient<Database>,
): Promise<Set<string>> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("learning_activities")
    .select("user_id")
    .gte("completed_at", since);

  if (error) throw error;

  const ids = new Set<string>();
  for (const row of data ?? []) {
    ids.add(row.user_id as string);
  }
  return ids;
}

export async function resolveNotificationAudience(
  supabase: SupabaseClient<Database>,
  audience: NotificationAudience,
): Promise<string[]> {
  const allIds = await listAllProfileIds(supabase);

  if (audience === "all") return allIds;

  if (audience === "active_7d") {
    const active = await listActive7dUserIds(supabase);
    return allIds.filter((id) => active.has(id));
  }

  const proIds = await listActiveProUserIds(supabase);
  if (audience === "pro") {
    return allIds.filter((id) => proIds.has(id));
  }

  // free = not currently pro
  return allIds.filter((id) => !proIds.has(id));
}
