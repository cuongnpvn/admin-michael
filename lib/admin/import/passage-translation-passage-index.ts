import type { SupabaseClient } from "@supabase/supabase-js";
import type { ToeicPartDb } from "@/types/content-db";
import {
  questionIdLookupAliases,
  resolveQuestionIdFromIndex,
  type PassageTranslationQuestionIndex,
} from "@/lib/admin/import/passage-translation-question-index";

export interface PassageTranslationPassageRow {
  id: string;
  slug: string;
  passageSetId: string;
  sortOrder: number;
}

export interface PassageTranslationPassageIndex {
  rows: PassageTranslationPassageRow[];
  bySlug: Map<string, string>;
  byPassageSetId: Map<string, PassageTranslationPassageRow[]>;
}

export async function loadPassageTranslationPassageIndex(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
): Promise<PassageTranslationPassageIndex> {
  const { data: setRows, error: setError } = await supabase
    .from("reading_passage_sets")
    .select("id")
    .eq("book_id", bookId)
    .eq("test_id", testId)
    .eq("part", "7" as ToeicPartDb);

  if (setError) throw setError;

  const setIds = (setRows ?? []).map((row) => row.id);
  if (setIds.length === 0) {
    return { rows: [], bySlug: new Map(), byPassageSetId: new Map() };
  }

  const { data: passageRows, error: passageError } = await supabase
    .from("reading_passages")
    .select("id, slug, passage_set_id, sort_order")
    .in("passage_set_id", setIds)
    .order("sort_order", { ascending: true });

  if (passageError) throw passageError;

  const rows: PassageTranslationPassageRow[] = (passageRows ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    passageSetId: row.passage_set_id,
    sortOrder: row.sort_order,
  }));

  const bySlug = new Map<string, string>();
  const byPassageSetId = new Map<string, PassageTranslationPassageRow[]>();

  for (const row of rows) {
    bySlug.set(row.slug, row.id);
    for (const alias of questionIdLookupAliases(row.slug)) {
      bySlug.set(alias, row.id);
    }

    const list = byPassageSetId.get(row.passageSetId) ?? [];
    list.push(row);
    byPassageSetId.set(row.passageSetId, list);
  }

  return { rows, bySlug, byPassageSetId };
}

export function resolvePassageSlugFromIndex(
  index: PassageTranslationPassageIndex,
  passageSlug: string,
): { dbId: string; matchedBy: "slug" | "slugAlias" } | null {
  for (const alias of questionIdLookupAliases(passageSlug)) {
    const dbId = index.bySlug.get(alias);
    if (dbId) {
      return {
        dbId,
        matchedBy: alias === passageSlug ? "slug" : "slugAlias",
      };
    }
  }

  return null;
}

export function resolvePassageSetIdFromQuestionIndex(
  questionIndex: PassageTranslationQuestionIndex,
  questionId: string,
): string | null {
  const resolved = resolveQuestionIdFromIndex(questionIndex, questionId);
  if (!resolved) return null;

  const row = questionIndex.rows.find((entry) => entry.id === resolved.dbId);
  return row?.readingPassageSetId ?? null;
}
