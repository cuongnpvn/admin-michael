import type { GeminiJsonSchema } from "@/lib/admin/gemini/gemini-response-schema-shared";
import { VOCABULARY_CEFR_LEVELS } from "@/lib/vocabulary/cefr-level";

/** Structured output for single-word notebook Tra cứu (Gemini). */
export const GEMINI_DICTIONARY_LOOKUP_SCHEMA: GeminiJsonSchema = {
  type: "object",
  properties: {
    term: { type: "string" },
    lemma: { type: "string" },
    meaningVi: { type: "string" },
    definitionEn: { type: "string" },
    ipaUs: { type: "string" },
    ipaUk: { type: "string" },
    wordTypes: {
      type: "array",
      items: { type: "string" },
    },
    synonyms: {
      type: "array",
      items: { type: "string" },
    },
    collocations: {
      type: "array",
      items: { type: "string" },
    },
    example: { type: "string" },
    level: {
      type: "string",
      enum: [...VOCABULARY_CEFR_LEVELS],
    },
  },
  required: [
    "term",
    "lemma",
    "meaningVi",
    "definitionEn",
    "ipaUs",
    "ipaUk",
    "wordTypes",
    "synonyms",
    "collocations",
    "example",
  ],
  // Required by Gemini structured-output validation for object schemas.
  additionalProperties: false,
};
