import type { SupabaseClient } from "@supabase/supabase-js";
import type { ImportVocabularyJsonSummary } from "@/lib/admin/vocabulary/types";
import {
  parseVocabularyImportFile,
  validateVocabularyImportFile,
  type VocabularyImportWord,
} from "@/lib/admin/vocabulary/vocabulary-import-schema";

async function upsertVocabularyItem(
  supabase: SupabaseClient,
  deckId: string,
  word: VocabularyImportWord,
): Promise<string> {
  const row = {
    term: word.term,
    lemma: word.lemma,
    meaning_vi: word.meaningVi,
    definition_en: word.definitionEn,
    ipa_us: word.ipaUs,
    ipa_uk: word.ipaUk,
    word_types: word.wordTypes,
    synonyms: word.synonyms,
    collocations: word.collocations,
    example: word.example,
    level: word.level,
  };

  const { data: existing, error: selectError } = await supabase
    .from("vocabulary_items")
    .select("id")
    .eq("deck_id", deckId)
    .ilike("term", word.term)
    .maybeSingle();

  if (selectError) throw selectError;

  if (existing?.id) {
    const { error: updateError } = await supabase
      .from("vocabulary_items")
      .update(row)
      .eq("id", existing.id);

    if (updateError) throw updateError;
    return existing.id as string;
  }

  const { data, error } = await supabase
    .from("vocabulary_items")
    .insert({
      deck_id: deckId,
      ...row,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}

export async function importVocabularyWordsChunk(
  supabase: SupabaseClient,
  deckId: string,
  words: VocabularyImportWord[],
): Promise<{ wordCount: number }> {
  for (const word of words) {
    await upsertVocabularyItem(supabase, deckId, word);
  }

  return { wordCount: words.length };
}

export async function importVocabularyJsonFromRaw(
  supabase: SupabaseClient,
  deckId: string,
  deckName: string,
  raw: string,
): Promise<ImportVocabularyJsonSummary> {
  const parsed = parseVocabularyImportFile(raw, deckName);
  validateVocabularyImportFile(parsed);

  await importVocabularyWordsChunk(supabase, deckId, parsed.words);

  return {
    deckId,
    deckName,
    wordCount: parsed.words.length,
  };
}
