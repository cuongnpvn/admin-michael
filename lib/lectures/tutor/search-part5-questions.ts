import type { SupabaseClient } from "@supabase/supabase-js";
import {
  TUTOR_PRACTICE_LIMIT,
  TUTOR_PRACTICE_SEARCH_POOL,
} from "@/lib/lectures/tutor/types";

export type Part5SearchRow = {
  id: string;
  testId: string;
  tags: string[];
};

export function mapPart5SearchRows(data: unknown): Part5SearchRow[] {
  if (!Array.isArray(data)) return [];
  const rows: Part5SearchRow[] = [];
  for (const item of data) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    if (String(row.part ?? "") !== "5") continue;
    const tests = row.tests;
    if (
      tests &&
      typeof tests === "object" &&
      "reading_published" in tests &&
      (tests as { reading_published?: unknown }).reading_published !== true
    ) {
      continue;
    }
    const id = String(row.id ?? "").trim();
    const testId = String(row.test_id ?? "").trim();
    if (!id || !testId) continue;
    const tags = Array.isArray(row.tags)
      ? row.tags.filter((tag): tag is string => typeof tag === "string")
      : [];
    rows.push({ id, testId, tags });
  }
  return rows;
}

export function pickSpreadQuestionIds(
  rows: Part5SearchRow[],
  limit = TUTOR_PRACTICE_LIMIT,
): string[] {
  const queues = new Map<string, string[]>();
  for (const row of rows) {
    const queue = queues.get(row.testId) ?? [];
    queue.push(row.id);
    queues.set(row.testId, queue);
  }

  const ids: string[] = [];
  const buckets = [...queues.values()];
  let round = 0;
  while (ids.length < limit) {
    let added = false;
    for (const bucket of buckets) {
      const id = bucket[round];
      if (!id) continue;
      ids.push(id);
      added = true;
      if (ids.length >= limit) break;
    }
    if (!added) break;
    round += 1;
  }
  return ids;
}

export async function searchPart5Questions(
  supabase: SupabaseClient,
  skillTags: string[],
  limit = TUTOR_PRACTICE_LIMIT,
): Promise<string[]> {
  if (skillTags.length === 0) return [];

  const { data, error } = await supabase
    .from("questions")
    .select("id, test_id, part, tags")
    .eq("part", "5")
    .overlaps("tags", skillTags)
    .limit(TUTOR_PRACTICE_SEARCH_POOL);
  if (error) throw error;

  return pickSpreadQuestionIds(mapPart5SearchRows(data), limit);
}
