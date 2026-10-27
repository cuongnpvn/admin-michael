import type { SupabaseClient } from "@supabase/supabase-js";
import {
  assertListeningPart12TagUpdatesComplete,
  mapListeningPart12TagUpdates,
  type ListeningPart12TagUpdate,
} from "@/lib/admin/content/map-listening-part12-tag-updates";

const LOG_PREFIX = "[listening-part12-tags]";

function tagsLog(event: string, details: Record<string, unknown>): void {
  console.log(LOG_PREFIX, event, details);
}

export async function loadListeningPartQuestionIds(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  part: 1 | 2,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("questions")
    .select("id")
    .eq("book_id", bookId)
    .eq("test_id", testId)
    .eq("part", String(part))
    .order("global_item_number", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => row.id as string);
}

async function updateQuestionTags(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  part: 1 | 2,
  update: ListeningPart12TagUpdate,
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

export async function importListeningPart12TagsFromRaw(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  part: 1 | 2,
  rawJson: string,
): Promise<{ updated: number; droppedIds: string[] }> {
  const allowedIds = new Set(
    await loadListeningPartQuestionIds(supabase, bookId, testId, part),
  );
  if (allowedIds.size === 0) {
    throw new Error(`This test has no Part ${part} questions to tag.`);
  }

  const parsed = JSON.parse(rawJson) as unknown;
  const mapped = mapListeningPart12TagUpdates(part, parsed, allowedIds);
  if (mapped.droppedIds.length > 0) {
    tagsLog("dropped_unknown_ids", {
      bookId,
      testId,
      part,
      droppedIds: mapped.droppedIds,
    });
  }

  const updates = assertListeningPart12TagUpdatesComplete(
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
  });

  return { updated: updates.length, droppedIds: mapped.droppedIds };
}
