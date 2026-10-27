import {
  GEMINI_EXPLANATION_SCHEMA,
  GEMINI_OPTION_LABEL,
  GEMINI_OPTION_SCHEMA,
  GEMINI_VOCABULARY_SCHEMA,
  type GeminiJsonSchema,
  geminiExtractQuestionSchema,
  geminiQuestionSchema,
} from "@/lib/admin/gemini/gemini-response-schema-shared";

/**
 * Shallow question shape for Parts 1–2 Gemini structured output.
 * Tag slugs and option counts are validated at import.
 */
const LISTENING_PART12_GEMINI_QUESTION_SCHEMA: GeminiJsonSchema = {
  type: "object",
  properties: {
    globalItemNumber: { type: "integer" },
    options: {
      type: "array",
      items: GEMINI_OPTION_SCHEMA,
    },
    correctOptionLabel: GEMINI_OPTION_LABEL,
    hint: { type: "string" },
    explanation: GEMINI_EXPLANATION_SCHEMA,
    tags: {
      type: "array",
      minItems: 1,
      maxItems: 1,
      items: { type: "string" },
    },
    vocabulary: GEMINI_VOCABULARY_SCHEMA,
  },
  required: [
    "globalItemNumber",
    "options",
    "correctOptionLabel",
    "hint",
    "explanation",
    "tags",
    "vocabulary",
  ],
};

/** Part 1 may include visualCaption; Part 2 may include questionTranscript. */
const LISTENING_PART12_GEMINI_ITEM_SCHEMA: GeminiJsonSchema = {
  type: "object",
  properties: {
    questionTranscript: { type: "string" },
    visualCaption: { type: "string" },
    question: LISTENING_PART12_GEMINI_QUESTION_SCHEMA,
  },
  required: ["question"],
};

const LISTENING_PART12_GEMINI_PART_SCHEMA: GeminiJsonSchema = {
  type: "object",
  properties: {
    part: { type: "integer" },
    title: { type: "string" },
    items: {
      type: "array",
      items: LISTENING_PART12_GEMINI_ITEM_SCHEMA,
    },
  },
  required: ["part", "title", "items"],
};

/** Top-level array: [Part 1 object, Part 2 object]. Counts enforced at Zod import. */
export const LISTENING_PARTS_1_2_RESPONSE_SCHEMA: GeminiJsonSchema = {
  type: "array",
  description: "Listening Parts 1 and 2 — photographs and question-response.",
  minItems: 2,
  maxItems: 2,
  items: LISTENING_PART12_GEMINI_PART_SCHEMA,
};

/** Part 3 extract — OCR only: transcript + prompts/options, no enrichment. */
function listeningPart3ExtractGroupSchema(): GeminiJsonSchema {
  return {
    type: "object",
    properties: {
      id: { type: "string" },
      transcript: { type: "string" },
      stimulusKind: { type: "string", enum: ["conversation"] },
      questions: {
        type: "array",
        minItems: 1,
        items: geminiExtractQuestionSchema(
          "Question in this listening Part 3 group (OCR only).",
        ),
      },
    },
    required: ["transcript", "questions"],
  };
}

function listeningPart4GroupSchema(): GeminiJsonSchema {
  return {
    type: "object",
    properties: {
      id: { type: "string" },
      topic: { type: "string" },
      transcript: { type: "string" },
      stimulusKind: {
        type: "string",
        enum: [
          "announcement",
          "voicemail",
          "radio_ad",
          "report",
          "instructions",
          "tour_talk",
          "other",
        ],
      },
      vocabulary: GEMINI_VOCABULARY_SCHEMA,
      questions: {
        type: "array",
        minItems: 1,
        items: geminiQuestionSchema(
          4,
          "Question in this listening group.",
          { includeVocabulary: false },
        ),
      },
    },
    required: ["transcript", "vocabulary", "questions"],
  };
}

export const LISTENING_PART3_RESPONSE_SCHEMA: GeminiJsonSchema = {
  type: "object",
  description:
    "Listening Part 3 extract — conversations with OCR-only groups of questions.",
  properties: {
    part: { type: "integer" },
    title: { type: "string" },
    groups: {
      type: "array",
      minItems: 1,
      items: listeningPart3ExtractGroupSchema(),
    },
  },
  required: ["part", "title", "groups"],
};

export const LISTENING_PART4_RESPONSE_SCHEMA: GeminiJsonSchema = {
  type: "object",
  description: "Listening Part 4 — talks with groups of questions.",
  properties: {
    part: { type: "integer" },
    title: { type: "string" },
    groups: {
      type: "array",
      minItems: 1,
      items: listeningPart4GroupSchema(),
    },
  },
  required: ["part", "title", "groups"],
};
