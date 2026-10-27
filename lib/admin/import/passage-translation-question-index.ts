import type { SupabaseClient } from "@supabase/supabase-js";
import type { ToeicPartDb } from "@/types/content-db";

export interface PassageTranslationQuestionRow {
  id: string;
  slug: string;
  globalItemNumber: number;
  readingPassageSetId: string | null;
  listeningGroupId: string | null;
}

export interface PassageTranslationQuestionIndex {
  rows: PassageTranslationQuestionRow[];
  bySlug: Map<string, string>;
  byNumberInPart: Map<number, string>;
  /** First question (anchor) per reading_passage_set_id — export typos may use set UUID as questionId. */
  byPassageSetId: Map<string, string>;
  /** First question (anchor) per listening_group_id. */
  byListeningGroupId: Map<string, string>;
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

/** Parse TOEIC-style ids: test-1-p6-q01, test-1-p07-q13, t1-p7-q1-s1q1 (uses leading q segment). */
export function parseNumberInPartFromQuestionId(questionId: string): number | null {
  const tailMatch = questionId.match(/-q0*(\d+)$/i);
  if (tailMatch) {
    const value = Number.parseInt(tailMatch[1], 10);
    return Number.isFinite(value) ? value : null;
  }

  const embeddedMatch = questionId.match(/-q0*(\d+)-/i);
  if (embeddedMatch) {
    const value = Number.parseInt(embeddedMatch[1], 10);
    return Number.isFinite(value) ? value : null;
  }

  return null;
}

/** Normalize import ids: p06/p07 → p6/p7 so export typos still resolve. */
export function questionIdLookupAliases(questionId: string): string[] {
  const aliases = new Set<string>([questionId]);
  const normalizedPart = questionId.replace(/-p0+(\d+)-/gi, "-p$1-");
  if (normalizedPart !== questionId) {
    aliases.add(normalizedPart);
  }
  return [...aliases];
}

export async function loadPassageTranslationQuestionIndex(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  part: 3 | 4 | 5 | 6 | 7,
): Promise<PassageTranslationQuestionIndex> {
  const partDb = String(part) as ToeicPartDb;
  const { data, error } = await supabase
    .from("questions")
    .select("id, slug, global_item_number, reading_passage_set_id, listening_group_id")
    .eq("book_id", bookId)
    .eq("test_id", testId)
    .eq("part", partDb)
    .order("global_item_number", { ascending: true });

  if (error) throw error;

  const rows: PassageTranslationQuestionRow[] = (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    globalItemNumber: row.global_item_number,
    readingPassageSetId: row.reading_passage_set_id,
    listeningGroupId: row.listening_group_id,
  }));

  const bySlug = new Map<string, string>();
  const byNumberInPart = new Map<number, string>();
  const byPassageSetId = new Map<string, string>();
  const byListeningGroupId = new Map<string, string>();

  for (const row of rows) {
    bySlug.set(row.slug, row.id);
    byNumberInPart.set(row.globalItemNumber, row.id);
    if (row.readingPassageSetId && !byPassageSetId.has(row.readingPassageSetId)) {
      byPassageSetId.set(row.readingPassageSetId, row.id);
    }
    if (row.listeningGroupId && !byListeningGroupId.has(row.listeningGroupId)) {
      byListeningGroupId.set(row.listeningGroupId, row.id);
    }
  }

  return { rows, bySlug, byNumberInPart, byPassageSetId, byListeningGroupId };
}

export async function loadListeningPart12TranslationQuestionIndex(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
): Promise<PassageTranslationQuestionIndex> {
  const { data, error } = await supabase
    .from("questions")
    .select("id, slug, global_item_number, reading_passage_set_id, listening_group_id")
    .eq("book_id", bookId)
    .eq("test_id", testId)
    .in("part", ["1", "2"])
    .order("global_item_number", { ascending: true });

  if (error) throw error;

  const rows: PassageTranslationQuestionRow[] = (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    globalItemNumber: row.global_item_number,
    readingPassageSetId: row.reading_passage_set_id,
    listeningGroupId: row.listening_group_id,
  }));

  const bySlug = new Map<string, string>();
  const byNumberInPart = new Map<number, string>();
  const byPassageSetId = new Map<string, string>();
  const byListeningGroupId = new Map<string, string>();

  for (const row of rows) {
    bySlug.set(row.slug, row.id);
    byNumberInPart.set(row.globalItemNumber, row.id);
  }

  return { rows, bySlug, byNumberInPart, byPassageSetId, byListeningGroupId };
}

export function resolveQuestionIdFromIndex(
  index: PassageTranslationQuestionIndex,
  questionId: string,
): { dbId: string; matchedBy: "uuid" | "passageSetId" | "listeningGroupId" | "slug" | "slugAlias" | "globalItemNumber" } | null {
  if (isUuid(questionId)) {
    const row = index.rows.find((entry) => entry.id === questionId);
    if (row) {
      return { dbId: row.id, matchedBy: "uuid" };
    }

    const byPassageSet = index.byPassageSetId.get(questionId);
    if (byPassageSet) {
      return { dbId: byPassageSet, matchedBy: "passageSetId" };
    }

    const byListeningGroup = index.byListeningGroupId.get(questionId);
    if (byListeningGroup) {
      return { dbId: byListeningGroup, matchedBy: "listeningGroupId" };
    }
  }

  for (const alias of questionIdLookupAliases(questionId)) {
    const bySlug = index.bySlug.get(alias);
    if (bySlug) {
      return {
        dbId: bySlug,
        matchedBy: alias === questionId ? "slug" : "slugAlias",
      };
    }
  }

  const globalItemNumber = parseNumberInPartFromQuestionId(questionId);
  if (globalItemNumber !== null) {
    const byNumber = index.byNumberInPart.get(globalItemNumber);
    if (byNumber) {
      return { dbId: byNumber, matchedBy: "globalItemNumber" };
    }
  }

  return null;
}
