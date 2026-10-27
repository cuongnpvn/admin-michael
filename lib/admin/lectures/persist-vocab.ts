import type { SupabaseClient } from "@supabase/supabase-js";
import type { LectureVocabDraft } from "@/lib/lectures/vocab";

export async function replaceLectureVocabItems(
  supabase: SupabaseClient,
  lectureId: string,
  items: LectureVocabDraft[],
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("lecture_vocab_items")
    .delete()
    .eq("lecture_id", lectureId);
  if (deleteError) throw deleteError;
  if (items.length === 0) return;

  const { error } = await supabase.from("lecture_vocab_items").insert(
    items.map((item, index) => ({
      lecture_id: lectureId,
      sort_order: index + 1,
      term: item.term.trim(),
      ipa: item.ipa.trim(),
      word_type: item.wordType.trim(),
      meaning_vi: item.meaningVi.trim(),
      example_en: item.exampleEn.trim(),
      example_vi: item.exampleVi.trim(),
    })),
  );
  if (error) throw error;
}
