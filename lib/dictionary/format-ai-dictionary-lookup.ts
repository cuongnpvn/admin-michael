import { copy } from "@/lib/copy/vi";
import {
  dictionaryLookupToVocabularyPayload,
  type NormalizedDictionaryLookup,
} from "@/lib/dictionary/normalize-dictionary-lookup";
import { formatVocabularyNoteBody } from "@/lib/notebook/format-vocabulary-note-body";
import type { VocabularyItemPayload } from "@/lib/vocabulary/vocabulary-item-payload";

export type AiDictionaryLookupResult = {
  body: string;
  payload: VocabularyItemPayload;
};

export function formatAiDictionaryLookup(
  normalized: NormalizedDictionaryLookup,
): AiDictionaryLookupResult {
  const payload = dictionaryLookupToVocabularyPayload(normalized);
  const body = formatVocabularyNoteBody(
    {
      lemma: payload.lemma,
      ipaUs: payload.ipaUs,
      ipaUk: payload.ipaUk,
      wordTypes: payload.wordTypes,
      meaningVi: payload.meaningVi,
      definitionEn: payload.definitionEn,
      example: payload.example,
      synonyms: payload.synonyms,
      collocations: payload.collocations,
      level: payload.level,
    },
    {
      synonyms: copy.vocab.practice.synonymsLabel,
      collocations: copy.vocab.practice.collocationsLabel,
      englishPrefix: copy.vocab.practice.englishLabel,
      example: copy.vocab.practice.exampleLabel,
      lemma: copy.vocab.manage.fields.lemma,
      level: copy.vocab.manage.fields.level,
    },
  );

  if (!body.trim()) {
    throw new Error("Dictionary lookup produced an empty note body.");
  }

  return { body, payload };
}
