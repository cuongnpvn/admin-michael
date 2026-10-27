import type { SupabaseClient } from "@supabase/supabase-js";
import {
  assertQuestionTagUpdatesComplete,
  mapQuestionTagUpdates,
  type GroupedTagPart,
  type QuestionTagUpdate,
} from "@/lib/admin/content/map-question-tag-updates";

const LOG_PREFIX = "[grouped-question-tags]";

function tagsLog(event: string, details: Record<string, unknown>): void {
  console.log(LOG_PREFIX, event, details);
}

function tagsError(event: string, details: Record<string, unknown>): void {
  console.error(LOG_PREFIX, event, details);
}

export async function loadGroupedQuestionIds(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  part: GroupedTagPart,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("questions")
    .select("id")
    .eq("book_id", bookId)
    .eq("test_id", testId)
    .eq("part", String(part))
    .order("global_item_number", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => row.id);
}

async function updateQuestionTags(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  part: GroupedTagPart,
  update: QuestionTagUpdate,
): Promise<void> {
  const { error } = await supabase
    .from("questions")
    .update({ tags: update.tags })
    .eq("id", update.id)
    .eq("book_id", bookId)
    .eq("test_id", testId)
    .eq("part", String(part));

  if (error) throw error;
}

export async function importGroupedQuestionTagsFromRaw(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  part: GroupedTagPart,
  rawJson: string,
): Promise<{ updated: number; droppedIds: string[] }> {
  const allowedIds = new Set(
    await loadGroupedQuestionIds(supabase, bookId, testId, part),
  );
  if (allowedIds.size === 0) {
    throw new Error(`This test has no Part ${part} questions to tag.`);
  }

  const parsed = JSON.parse(rawJson) as unknown;
  const mapped = mapQuestionTagUpdates(part, parsed, allowedIds);

  if (mapped.droppedIds.length > 0) {
    tagsLog("dropped_unknown_ids", {
      bookId,
      testId,
      part,
      droppedIds: mapped.droppedIds,
    });
  }

  const updates = assertQuestionTagUpdatesComplete(
    part,
    mapped,
    allowedIds.size,
  );

  for (const update of updates) {
    await updateQuestionTags(supabase, bookId, testId, part, update);
  }

  tagsLog("import_done", {
    bookId,
    testId,
    part,
    updated: updates.length,
    dropped: mapped.droppedIds.length,
  });

  return { updated: updates.length, droppedIds: mapped.droppedIds };
}

export function logGroupedQuestionTagsFailure(
  event: string,
  details: Record<string, unknown>,
): void {
  tagsError(event, details);
}
