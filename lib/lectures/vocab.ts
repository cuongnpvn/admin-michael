import type { SupabaseClient } from "@supabase/supabase-js";
import type { LoadedVocabularyItem } from "@/lib/vocabulary/load-deck-vocabulary";

export interface LectureVocabItem {
  id: string;
  sortOrder: number;
  term: string;
  ipa: string;
  wordType: string;
  meaningVi: string;
  exampleEn: string;
  exampleVi: string;
}

export interface LectureVocabDraft {
  clientKey: string;
  term: string;
  ipa: string;
  wordType: string;
  meaningVi: string;
  exampleEn: string;
  exampleVi: string;
}

interface VocabRow {
  id: string;
  sort_order: number;
  term: string;
  ipa: string | null;
  word_type: string | null;
  meaning_vi: string;
  example_en: string | null;
  example_vi: string | null;
}

export function emptyLectureVocabDraft(): LectureVocabDraft {
  return {
    clientKey: crypto.randomUUID(),
    term: "",
    ipa: "",
    wordType: "",
    meaningVi: "",
    exampleEn: "",
    exampleVi: "",
  };
}

export function lectureVocabDrafts(items: LectureVocabItem[]): LectureVocabDraft[] {
  return items.map((item) => ({
    clientKey: item.id,
    term: item.term,
    ipa: item.ipa,
    wordType: item.wordType,
    meaningVi: item.meaningVi,
    exampleEn: item.exampleEn,
    exampleVi: item.exampleVi,
  }));
}

function mapVocabRow(row: VocabRow): LectureVocabItem {
  return {
    id: row.id,
    sortOrder: row.sort_order,
    term: row.term,
    ipa: row.ipa ?? "",
    wordType: row.word_type ?? "",
    meaningVi: row.meaning_vi,
    exampleEn: row.example_en ?? "",
    exampleVi: row.example_vi ?? "",
  };
}

export async function countLectureVocabItems(
  supabase: SupabaseClient,
  lectureIds: string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (lectureIds.length === 0) return counts;

  const { data, error } = await supabase
    .from("lecture_vocab_items")
    .select("lecture_id")
    .in("lecture_id", lectureIds);
  if (error) throw error;

  for (const row of data ?? []) {
    const lectureId = row.lecture_id as string;
    counts.set(lectureId, (counts.get(lectureId) ?? 0) + 1);
  }
  return counts;
}

export async function loadLectureVocabItems(
  supabase: SupabaseClient,
  lectureId: string,
): Promise<LectureVocabItem[]> {
  const { data, error } = await supabase
    .from("lecture_vocab_items")
    .select(
      "id, sort_order, term, ipa, word_type, meaning_vi, example_en, example_vi",
    )
    .eq("lecture_id", lectureId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => mapVocabRow(row as VocabRow));
}

export function lectureVocabToPracticeItem(
  item: LectureVocabItem,
): LoadedVocabularyItem {
  return {
    id: item.id,
    term: item.term,
    lemma: null,
    meaningVi: item.meaningVi,
    definitionEn: null,
    ipaUs: item.ipa || null,
    ipaUk: null,
    wordTypes: item.wordType ? [item.wordType] : [],
    synonyms: [],
    collocations: [],
    example: item.exampleEn || null,
    level: null,
    imageUrl: null,
  };
}
