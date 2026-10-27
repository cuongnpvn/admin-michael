import {
  aggregateExamAttemptStats,
  applyDisplayNames,
  collectStatsUserIds,
  isFullExamActivity,
  type ExamAttemptActivityRow,
  type ExamAttemptStatsByRange,
} from "@/lib/admin/dashboard/aggregate-exam-attempt-stats";
import { loadCatalog } from "@/lib/content/load-catalog";
import { buildCatalogDisplayLookup } from "@/lib/content/resolve-catalog-display";
import { createClient } from "@/lib/supabase/server";

export type {
  ExamAttemptStatsByRange,
  ExamAttemptStatsRow,
  ExamAttemptStudentRow,
  ExamScoreHolder,
} from "@/lib/admin/dashboard/aggregate-exam-attempt-stats";

const DAY_MS = 24 * 60 * 60 * 1000;
const LOOKBACK_DAYS = 30;

export async function fetchAdminExamAttemptStats(): Promise<ExamAttemptStatsByRange> {
  const supabase = await createClient();
  const now = Date.now();
  const start30d = new Date(now - LOOKBACK_DAYS * DAY_MS).toISOString();
  const start7d = new Date(now - 7 * DAY_MS).toISOString();

  const [activitiesResult, catalog] = await Promise.all([
    supabase
      .from("learning_activities")
      .select(
        "user_id, book_id, test_id, parts, completed_at, finished_time, score_data",
      )
      .eq("activity_type", "exam")
      .gte("completed_at", start30d),
    loadCatalog(supabase),
  ]);

  if (activitiesResult.error) throw activitiesResult.error;

  const fullExamRows = (
    (activitiesResult.data ?? []) as ExamAttemptActivityRow[]
  ).filter(isFullExamActivity);

  const displayLookup = buildCatalogDisplayLookup(catalog);
  const emptyNames = new Map<string, string>();
  const rows7d = fullExamRows.filter((row) => row.completed_at >= start7d);

  const days7 = aggregateExamAttemptStats(rows7d, displayLookup, emptyNames);
  const days30 = aggregateExamAttemptStats(
    fullExamRows,
    displayLookup,
    emptyNames,
  );

  const holderUserIds = collectStatsUserIds([...days7, ...days30]);
  const namesByUserId = new Map<string, string>();
  if (holderUserIds.size > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", [...holderUserIds]);

    if (profilesError) throw profilesError;

    for (const profile of profiles ?? []) {
      const id = profile.id as string;
      const displayName = (profile.display_name as string | null) ?? "";
      namesByUserId.set(id, displayName);
    }
  }

  return {
    days7: applyDisplayNames(days7, namesByUserId),
    days30: applyDisplayNames(days30, namesByUserId),
  };
}
