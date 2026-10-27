import type { VocabularyNoteBodyInput } from "@/lib/notebook/format-vocabulary-note-body";
import { parseVocabularyCefrLevel } from "@/lib/vocabulary/cefr-level";
import type { VocabularyItemPayload } from "@/lib/vocabulary/vocabulary-item-payload";

export type DictionaryLookupRaw = {
  term?: unknown;
  lemma?: unknown;
  meaningVi?: unknown;
  definitionEn?: unknown;
  ipaUs?: unknown;
  ipaUk?: unknown;
  wordTypes?: unknown;
  synonyms?: unknown;
  collocations?: unknown;
  example?: unknown;
  level?: unknown;
};

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of value) {
    const trimmed = asTrimmedString(item);
    if (!trimmed) {
      continue;
    }

    const key = trimmed.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(trimmed);
  }

  return result;
}

export type NormalizedDictionaryLookup = VocabularyNoteBodyInput & {
  term: string;
  lemma: string | null;
};

/**
 * Normalize AI structured JSON into note/vocab fields.
 * Returns null when meaningVi is missing (unusable for Tra cứu).
 */
export function normalizeDictionaryLookup(
  raw: unknown,
  fallbackTerm: string,
): NormalizedDictionaryLookup | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const data = raw as DictionaryLookupRaw;
  const meaningVi = asTrimmedString(data.meaningVi);
  if (!meaningVi) {
    return null;
  }

  const term = asTrimmedString(data.term) || fallbackTerm.trim();
  if (!term) {
    return null;
  }

  const lemmaRaw = asTrimmedString(data.lemma);
  const lemma =
    lemmaRaw && lemmaRaw.toLowerCase() !== term.toLowerCase() ? lemmaRaw : null;

  return {
    term,
    lemma,
    meaningVi,
    definitionEn: asTrimmedString(data.definitionEn) || null,
    ipaUs: asTrimmedString(data.ipaUs) || null,
    ipaUk: asTrimmedString(data.ipaUk) || null,
    wordTypes: asStringArray(data.wordTypes),
    synonyms: asStringArray(data.synonyms),
    collocations: asStringArray(data.collocations),
    example: asTrimmedString(data.example) || null,
    level: parseVocabularyCefrLevel(data.level),
  };
}

export function dictionaryLookupToVocabularyPayload(
  lookup: NormalizedDictionaryLookup,
): VocabularyItemPayload {
  return {
    term: lookup.term,
    lemma: lookup.lemma,
    meaningVi: lookup.meaningVi ?? null,
    definitionEn: lookup.definitionEn ?? null,
    ipaUs: lookup.ipaUs ?? null,
    ipaUk: lookup.ipaUk ?? null,
    wordTypes: lookup.wordTypes ?? [],
    synonyms: lookup.synonyms ?? [],
    collocations: lookup.collocations ?? [],
    example: lookup.example ?? null,
    level: lookup.level ?? null,
  };
}

/** @deprecated Use normalizeDictionaryLookup */
export const normalizeGeminiDictionaryLookup = normalizeDictionaryLookup;
/** @deprecated Use dictionaryLookupToVocabularyPayload */
export const geminiLookupToVocabularyPayload = dictionaryLookupToVocabularyPayload;
