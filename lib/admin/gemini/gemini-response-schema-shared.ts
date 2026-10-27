/**
 * Shared JSON Schema fragments for Gemini structured output.
 *
 * Keep schemas small: Gemini returns 400 InvalidArgument when schemas are too
 * complex (large minItems/maxItems, long enum lists, deep nesting). Exact
 * question/group counts are enforced by Zod at import time.
 *
 * Tags use separate `skills` + `focus` (+ optional `topic`) enums per part —
 * see normalize-gemini-exam-part-tags.ts for flattening to import `tags[]`.
 */

import {
  geminiQuestionTagProperties,
  geminiQuestionTagRequired,
} from "@/lib/admin/gemini/gemini-question-tags-schema";

export type GeminiJsonSchema = Record<string, unknown>;

export const GEMINI_OPTION_LABEL = {
  type: "string",
  enum: ["A", "B", "C", "D"],
} as const;

export const GEMINI_EXPLANATION_SCHEMA: GeminiJsonSchema = {
  type: "object",
  properties: {
    reasoning: { type: "string" },
    reference: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: ["reasoning", "reference"],
};

export const GEMINI_OPTION_SCHEMA: GeminiJsonSchema = {
  type: "object",
  properties: {
    label: GEMINI_OPTION_LABEL,
    text: { type: "string" },
  },
  required: ["label", "text"],
};

export const GEMINI_VOCABULARY_WORD_SCHEMA: GeminiJsonSchema = {
  type: "object",
  properties: {
    term: { type: "string" },
    definitionEn: { type: "string" },
    meaningVi: { type: "string" },
    level: {
      type: "string",
      enum: ["A1", "A2", "B1", "B2", "C1"],
    },
    wordType: { type: "string" },
    ipa: {
      type: "array",
      minItems: 2,
      maxItems: 2,
      items: { type: "string" },
      description: "US IPA first, then UK.",
    },
    example: {
      type: "string",
      description:
        "Short English sentence rephrasing the source reference, same word form/POS as the term.",
    },
  },
  required: [
    "term",
    "definitionEn",
    "meaningVi",
    "level",
    "wordType",
    "ipa",
    "example",
  ],
};

export const GEMINI_VOCABULARY_SCHEMA: GeminiJsonSchema = {
  type: "array",
  items: GEMINI_VOCABULARY_WORD_SCHEMA,
  description:
    "Curated TOEIC vocabulary for this unit (context-aware definitions).",
};

export function geminiQuestionSchema(
  part: number,
  description: string,
  options?: { includeVocabulary?: boolean },
): GeminiJsonSchema {
  const includeVocabulary = options?.includeVocabulary ?? part === 5;
  return {
    type: "object",
    description,
    properties: {
      globalItemNumber: { type: "integer" },
      prompt: { type: "string" },
      options: {
        type: "array",
        minItems: 4,
        maxItems: 4,
        items: GEMINI_OPTION_SCHEMA,
      },
      correctOptionLabel: GEMINI_OPTION_LABEL,
      hint: { type: "string" },
      explanation: GEMINI_EXPLANATION_SCHEMA,
      ...(includeVocabulary ? { vocabulary: GEMINI_VOCABULARY_SCHEMA } : {}),
      ...geminiQuestionTagProperties(part),
    },
    required: [
      "globalItemNumber",
      "prompt",
      "options",
      "hint",
      "explanation",
      ...(includeVocabulary ? (["vocabulary"] as const) : []),
      "correctOptionLabel",
      ...geminiQuestionTagRequired(part),
    ],
  };
}

/** Extract OCR only: prompt + options, no answers or study metadata. */
export function geminiExtractQuestionSchema(
  description: string,
): GeminiJsonSchema {
  return {
    type: "object",
    description,
    properties: {
      globalItemNumber: { type: "integer" },
      prompt: { type: "string" },
      options: {
        type: "array",
        minItems: 4,
        maxItems: 4,
        items: GEMINI_OPTION_SCHEMA,
      },
    },
    required: ["globalItemNumber", "prompt", "options"],
  };
}

/** Part 7 extract — OCR only: prompt + options, no answers or study metadata. */
export function geminiPart7ExtractQuestionSchema(
  description: string,
): GeminiJsonSchema {
  return geminiExtractQuestionSchema(description);
}

/** Part 1 photographs: no prompt — learners see image + spoken options. */
export function geminiPart1QuestionSchema(description: string): GeminiJsonSchema {
  const base = geminiQuestionSchema(1, description);
  const { prompt: _prompt, ...properties } = base.properties as Record<
    string,
    unknown
  >;
  const required = (base.required as string[]).filter(
    (field) => field !== "prompt",
  );
  return {
    ...base,
    properties,
    required,
  };
}
