import type { SupabaseClient } from "@supabase/supabase-js";
import { enrichVocabularyDeckFromTerms } from "@/lib/admin/gemini/extract-vocabulary-from-pdf";
import { importVocabularyJsonFromRaw } from "@/lib/admin/vocabulary/import-vocabulary-json";

export interface RegenerateDeckVocabularyResult {
  deckId: string;
  deckName: string;
  wordCount: number;
}

export async function regenerateDeckVocabularyFromExistingTerms(
  supabase: SupabaseClient,
  deckId: string,
  deckName: string,
): Promise<RegenerateDeckVocabularyResult> {
  const { data, error } = await supabase
    .from("vocabulary_items")
    .select("term")
    .eq("deck_id", deckId)
    .order("term", { ascending: true });

  if (error) throw error;

  const terms = (data ?? [])
    .map((row) => (typeof row.term === "string" ? row.term.trim() : ""))
    .filter(Boolean);

  if (terms.length === 0) {
    throw new Error("empty_deck");
  }

  const enrichedJson = await enrichVocabularyDeckFromTerms(deckName, terms);
  const summary = await importVocabularyJsonFromRaw(
    supabase,
    deckId,
    deckName,
    enrichedJson,
  );

  return {
    deckId,
    deckName,
    wordCount: summary.wordCount,
  };
}
