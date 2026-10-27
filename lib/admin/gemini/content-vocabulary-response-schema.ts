import {
  GEMINI_VOCABULARY_SCHEMA,
  type GeminiJsonSchema,
} from "@/lib/admin/gemini/gemini-response-schema-shared";

/** Keep schema small — exact unit counts are checked after the call. */
export function buildContentVocabularyResponseSchema(): GeminiJsonSchema {
  return {
    type: "object",
    properties: {
      units: {
        type: "array",
        items: {
          type: "object",
          properties: {
            questionId: { type: "string" },
            groupId: { type: "string" },
            vocabulary: GEMINI_VOCABULARY_SCHEMA,
          },
          required: ["questionId", "vocabulary"],
        },
      },
    },
    required: ["units"],
  };
}

export function normalizeContentVocabularyResponse(
  parsed: unknown,
): unknown[] {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object") {
    const units = (parsed as { units?: unknown }).units;
    if (Array.isArray(units)) return units;
  }
  throw new Error("Content vocabulary response must be an array or { units }.");
}
