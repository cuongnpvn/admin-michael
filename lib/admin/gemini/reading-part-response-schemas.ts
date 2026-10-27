import type { AdminInstructionId } from "@/lib/admin/instructions/catalog";
import {
  GEMINI_VOCABULARY_SCHEMA,
  type GeminiJsonSchema,
  geminiPart7ExtractQuestionSchema,
  geminiQuestionSchema,
} from "@/lib/admin/gemini/gemini-response-schema-shared";
import {
  LISTENING_PARTS_1_2_RESPONSE_SCHEMA,
  LISTENING_PART3_RESPONSE_SCHEMA,
  LISTENING_PART4_RESPONSE_SCHEMA,
} from "@/lib/admin/gemini/listening-part-response-schemas";

function passageSchema(): GeminiJsonSchema {
  return {
    type: "object",
    properties: {
      title: { type: "string" },
      content: {
        type: "string",
        description:
          "HTML fragment reproducing PDF layout (tables, headers, forms, etc.).",
      },
    },
    required: ["title", "content"],
  };
}

function passageSetSchema(part: 5 | 6 | 7): GeminiJsonSchema {
  const includeSetVocabulary = part === 6;
  return {
    type: "object",
    properties: {
      id: { type: "string" },
      topic: {
        type: "string",
        description:
          "Short English passage title (about 2–6 words), e.g. 'Building maintenance notice' or 'Hotel reservation confirmation'. Names what the document is about — not the PDF header line and not a single-word category slug like 'travel' or 'office'.",
      },
      passages: {
        type: "array",
        minItems: 1,
        items: passageSchema(),
      },
      ...(includeSetVocabulary
        ? { vocabulary: GEMINI_VOCABULARY_SCHEMA }
        : {}),
      questions: {
        type: "array",
        minItems: 1,
        items: geminiQuestionSchema(
          part,
          "Question linked to this passage set.",
          { includeVocabulary: false },
        ),
      },
    },
    required: [
      "topic",
      "passages",
      "questions",
      ...(includeSetVocabulary ? (["vocabulary"] as const) : []),
    ],
  };
}

/** Part 7 extract — digitization only; topic and study fields added in process step. */
function part7ExtractPassageSetSchema(): GeminiJsonSchema {
  return {
    type: "object",
    properties: {
      id: { type: "string" },
      passages: {
        type: "array",
        minItems: 1,
        items: passageSchema(),
      },
      questions: {
        type: "array",
        minItems: 1,
        items: geminiPart7ExtractQuestionSchema(
          "Question linked to this passage set — English prompt and options only.",
        ),
      },
    },
    required: ["passages", "questions"],
  };
}

export const READING_PART5_RESPONSE_SCHEMA: GeminiJsonSchema = {
  type: "object",
  description: "Reading Part 5 — incomplete sentences.",
  properties: {
    part: { type: "integer" },
    title: { type: "string" },
    questions: {
      type: "array",
      minItems: 1,
      items: geminiQuestionSchema(
        5,
        "Standalone incomplete sentence with one blank.",
      ),
    },
  },
  required: ["part", "title", "questions"],
};

export const READING_PART6_RESPONSE_SCHEMA: GeminiJsonSchema = {
  type: "object",
  description: "Reading Part 6 — text completion passage sets.",
  properties: {
    part: { type: "integer" },
    title: { type: "string" },
    passageSets: {
      type: "array",
      minItems: 1,
      items: passageSetSchema(6),
    },
  },
  required: ["part", "title", "passageSets"],
};

export const READING_PART7_RESPONSE_SCHEMA: GeminiJsonSchema = {
  type: "object",
  description: "Reading Part 7 — reading comprehension passage sets (extract).",
  properties: {
    part: { type: "integer" },
    title: { type: "string" },
    passageSets: {
      type: "array",
      minItems: 1,
      items: part7ExtractPassageSetSchema(),
    },
  },
  required: ["part", "title", "passageSets"],
};

export const READING_PART7_SINGLE_RESPONSE_SCHEMA: GeminiJsonSchema = {
  ...READING_PART7_RESPONSE_SCHEMA,
  description:
    "Reading Part 7 single-passage segment — global 147–175, 29 questions, exactly 1 passage per set.",
};

export const READING_PART7_MULTI_RESPONSE_SCHEMA: GeminiJsonSchema = {
  ...READING_PART7_RESPONSE_SCHEMA,
  description:
    "Reading Part 7 multi-passage segment — global 176–200, 25 questions, 2–3 passages per set.",
};

const SCHEMA_BY_MODULE: Partial<Record<AdminInstructionId, GeminiJsonSchema>> =
  {
    "listening-parts-1-2": LISTENING_PARTS_1_2_RESPONSE_SCHEMA,
    "listening-part-3": LISTENING_PART3_RESPONSE_SCHEMA,
    "listening-part-4": LISTENING_PART4_RESPONSE_SCHEMA,
    "reading-part-5": READING_PART5_RESPONSE_SCHEMA,
    "reading-part-6": READING_PART6_RESPONSE_SCHEMA,
    "reading-part-7-single": READING_PART7_SINGLE_RESPONSE_SCHEMA,
    "reading-part-7-multi": READING_PART7_MULTI_RESPONSE_SCHEMA,
  };

export function readingPartGeminiResponseSchema(
  moduleId: AdminInstructionId,
): GeminiJsonSchema | undefined {
  return SCHEMA_BY_MODULE[moduleId];
}

export function readingPartGeminiResponseFormat(moduleId: AdminInstructionId):
  | {
      type: "text";
      mime_type: "application/json";
      schema: GeminiJsonSchema;
    }
  | undefined {
  const schema = readingPartGeminiResponseSchema(moduleId);
  if (!schema) return undefined;
  return {
    type: "text",
    mime_type: "application/json",
    schema,
  };
}

export function geminiResponseSchemaByteSize(
  schema: GeminiJsonSchema | undefined,
): number {
  if (!schema) return 0;
  return JSON.stringify(schema).length;
}
