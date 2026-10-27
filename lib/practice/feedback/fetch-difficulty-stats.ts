import type { SupabaseClient } from "@supabase/supabase-js";
import {
  groupDifficultyStatKey,
  partDifficultyStatKey,
  passageSetDifficultyStatKey,
  rowToDifficultyStatKey,
} from "@/lib/practice/feedback/stat-keys";
import type { PracticeDifficultyStatsMap } from "@/lib/practice/feedback/types";

interface DifficultyStatsRow {
  part: string;
  listening_group_id: string | null;
  reading_passage_set_id: string | null;
  median_score: number | string | null;
  feedback_count: number | null;
}

interface FetchPracticeDifficultyStatsOptions {
  useContentIdKeys?: boolean;
}

function rowToContentDifficultyStatKey(
  row: DifficultyStatsRow,
  groupSlugById: Map<string, string>,
  setSlugById: Map<string, string>,
): string {
  if (row.listening_group_id) {
    const slug = groupSlugById.get(row.listening_group_id) ?? row.listening_group_id;
    return groupDifficultyStatKey(slug);
  }

  if (row.reading_passage_set_id) {
    const slug = setSlugById.get(row.reading_passage_set_id) ?? row.reading_passage_set_id;
    return passageSetDifficultyStatKey(slug);
  }

  return partDifficultyStatKey(Number.parseInt(row.part, 10));
}

async function loadContentSlugMaps(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
): Promise<{
  groupSlugById: Map<string, string>;
  setSlugById: Map<string, string>;
}> {
  const [groupsResult, setsResult] = await Promise.all([
    supabase
      .from("listening_groups")
      .select("id, slug")
      .eq("book_id", bookId)
      .eq("test_id", testId),
    supabase
      .from("reading_passage_sets")
      .select("id, slug")
      .eq("book_id", bookId)
      .eq("test_id", testId),
  ]);

  if (groupsResult.error) {
    throw groupsResult.error;
  }

  if (setsResult.error) {
    throw setsResult.error;
  }

  return {
    groupSlugById: new Map(
      (groupsResult.data ?? []).map((row) => [row.id, row.slug]),
    ),
    setSlugById: new Map(
      (setsResult.data ?? []).map((row) => [row.id, row.slug]),
    ),
  };
}

export async function fetchPracticeDifficultyStats(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  options: FetchPracticeDifficultyStatsOptions = {},
): Promise<PracticeDifficultyStatsMap> {
  const { data, error } = await supabase
    .from("practice_difficulty_stats")
    .select(
      "part, listening_group_id, reading_passage_set_id, median_score, feedback_count",
    )
    .eq("book_id", bookId)
    .eq("test_id", testId);

  if (error) {
    throw error;
  }

  const slugMaps = options.useContentIdKeys
    ? await loadContentSlugMaps(supabase, bookId, testId)
    : null;

  const stats: PracticeDifficultyStatsMap = new Map();

  for (const row of (data ?? []) as DifficultyStatsRow[]) {
    const count = row.feedback_count ?? 0;
    if (count <= 0 || row.median_score == null) {
      continue;
    }

    const median =
      typeof row.median_score === "number"
        ? row.median_score
        : Number.parseFloat(String(row.median_score));

    if (!Number.isFinite(median)) {
      continue;
    }

    const key = slugMaps
      ? rowToContentDifficultyStatKey(row, slugMaps.groupSlugById, slugMaps.setSlugById)
      : rowToDifficultyStatKey(row);

    stats.set(key, { median, count });
  }

  return stats;
}

export async function fetchPracticeDifficultyStatsForTests(
  supabase: SupabaseClient,
  testKeys: Array<{ bookId: string; testId: string }>,
  options: FetchPracticeDifficultyStatsOptions = {},
): Promise<Map<string, PracticeDifficultyStatsMap>> {
  const result = new Map<string, PracticeDifficultyStatsMap>();

  if (testKeys.length === 0) {
    return result;
  }

  const uniqueKeys = Array.from(
    new Map(
      testKeys.map((entry) => [`${entry.bookId}:${entry.testId}`, entry]),
    ).values(),
  );

  await Promise.all(
    uniqueKeys.map(async ({ bookId, testId }) => {
      const stats = await fetchPracticeDifficultyStats(
        supabase,
        bookId,
        testId,
        options,
      );
      result.set(`${bookId}:${testId}`, stats);
    }),
  );

  return result;
}
