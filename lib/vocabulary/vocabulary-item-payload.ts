import type { VocabularyCefrLevel } from "@/lib/vocabulary/cefr-level";

export interface VocabularyItemPayload {
  term: string;
  lemma: string | null;
  meaningVi: string | null;
  definitionEn: string | null;
  ipaUs: string | null;
  ipaUk: string | null;
  wordTypes: string[];
  synonyms: string[];
  collocations: string[];
  example: string | null;
  level: VocabularyCefrLevel | null;
}

export function vocabularySummaryToPayload(item: {
  term: string;
  lemma: string | null;
  meaningVi: string | null;
  definitionEn: string | null;
  ipaUs: string | null;
  ipaUk: string | null;
  wordTypes: string[];
  synonyms: string[];
  collocations: string[];
  example?: string | null;
  level?: VocabularyCefrLevel | null;
}): VocabularyItemPayload {
  return {
    term: item.term,
    lemma: item.lemma,
    meaningVi: item.meaningVi,
    definitionEn: item.definitionEn,
    ipaUs: item.ipaUs,
    ipaUk: item.ipaUk,
    wordTypes: item.wordTypes,
    synonyms: item.synonyms,
    collocations: item.collocations,
    example: item.example?.trim() || null,
    level: item.level ?? null,
  };
}
