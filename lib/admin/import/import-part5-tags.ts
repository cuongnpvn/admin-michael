import type { SupabaseClient } from "@supabase/supabase-js";
import {
  assertPart5TagUpdatesComplete,
  mapPart5TagUpdates,
  type Part5TagUpdate,
} from "@/lib/admin/content/map-part5-tag-updates";

const LOG_PREFIX = "[part5-tags]";

function tagsLog(event: string, details: Record<string, unknown>): void {
  console.log(LOG_PREFIX, event, details);
}

function tagsError(event: string, details: Record<string, unknown>): void {
  console.error(LOG_PREFIX, event, details);
}

export async function loadPart5QuestionIds(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("questions")
    .select("id")
    .eq("book_id", bookId)
    .eq("test_id", testId)
    .eq("part", "5")
    .order("global_item_number", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => row.id);
}

async function updatePart5QuestionTags(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  update: Part5TagUpdate,
): Promise<void> {
  const { error } = await supabase
    .from("questions")
    .update({ tags: update.tags })
    .eq("id", update.id)
    .eq("book_id", bookId)
    .eq("test_id", testId)
    .eq("part", "5");

  if (error) throw error;
}

export async function importPart5TagsFromRaw(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  rawJson: string,
): Promise<{ updated: number; droppedIds: string[] }> {
  const allowedIds = new Set(await loadPart5QuestionIds(supabase, bookId, testId));
  if (allowedIds.size === 0) {
    throw new Error("This test has no Part 5 questions to tag.");
  }

  const parsed = JSON.parse(rawJson) as unknown;
  const mapped = mapPart5TagUpdates(parsed, allowedIds);

  if (mapped.droppedIds.length > 0) {
    tagsLog("dropped_unknown_ids", {
      bookId,
      testId,
      droppedIds: mapped.droppedIds,
    });
  }

  const updates = assertPart5TagUpdatesComplete(mapped, allowedIds.size);

  for (const update of updates) {
    await updatePart5QuestionTags(supabase, bookId, testId, update);
  }

  tagsLog("import_done", {
    bookId,
    testId,
    updated: updates.length,
    dropped: mapped.droppedIds.length,
  });

  return { updated: updates.length, droppedIds: mapped.droppedIds };
}

export function logPart5TagsFailure(
  event: string,
  details: Record<string, unknown>,
): void {
  tagsError(event, details);
}
