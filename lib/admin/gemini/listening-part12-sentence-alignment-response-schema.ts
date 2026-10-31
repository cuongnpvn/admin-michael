import type { GeminiJsonSchema } from "@/lib/admin/gemini/gemini-response-schema-shared";

export function buildPart12SentenceAlignmentResponseSchema(
  part: 1 | 2,
): GeminiJsonSchema {
  const unit =
    part === 1
      ? "one Part 1 photograph (four spoken statements)"
      : "one Part 2 question and its responses";

  return {
    type: "object",
    description: `Spoken-line start/end times for ${unit}.`,
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
                "Seconds at the first spoken word of this stored line. Do not start on the item number, the picture direction, or a spoken letter label.",
            },
            endSec: {
              type: "number",
              description:
                "Seconds after the last spoken word of this entire stored line.",
            },
          },
          required: ["index", "english", "startSec", "endSec"],
        },
      },
    },
    required: ["questionId", "segments"],
  };
}
