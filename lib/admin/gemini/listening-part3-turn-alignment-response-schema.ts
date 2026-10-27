import type { GeminiJsonSchema } from "@/lib/admin/gemini/gemini-response-schema-shared";

export function buildPart3TurnAlignmentResponseSchema(): GeminiJsonSchema {
  return {
    type: "object",
    description:
      "Speaker-turn start/end times for one Part 3 conversation audio.",
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
                "Seconds at the first spoken word of this turn, including greetings/vocatives such as 'Hey, Oliver.' Do not start after the name-call.",
            },
            endSec: {
              type: "number",
              description:
                "Seconds after the last spoken word of this entire speaker line.",
            },
          },
          required: ["index", "english", "startSec", "endSec"],
        },
      },
    },
    required: ["questionId", "segments"],
  };
}
