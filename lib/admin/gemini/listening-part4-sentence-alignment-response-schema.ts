import type { GeminiJsonSchema } from "@/lib/admin/gemini/gemini-response-schema-shared";

export function buildPart4SentenceAlignmentResponseSchema(): GeminiJsonSchema {
  return {
    type: "object",
    description:
      "Sentence start/end times for one Part 4 talk audio (one speaker).",
    properties: {
      questionId: { type: "string" },
      segments: {
        type: "array",
        items: {
          type: "object",
          properties: {
            index: { type: "integer" },
            english: { type: "string" },
            startSec: {
              type: "number",
              description:
                "Seconds at the first spoken word of this sentence, including openings such as 'Good morning.' or 'Attention passengers.' Do not start after the greeting.",
            },
            endSec: {
              type: "number",
              description:
                "Seconds after the last spoken word of this entire sentence.",
            },
          },
          required: ["index", "english", "startSec", "endSec"],
        },
      },
    },
    required: ["questionId", "segments"],
  };
}
