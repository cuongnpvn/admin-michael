import type { GeminiJsonSchema } from "@/lib/admin/gemini/gemini-response-schema-shared";
import {
  LISTENING_PART12_TOPIC_TAGS,
  listeningPart12TagsForPart,
} from "@/lib/content/listening-part-12-tags";
import {
  focusesForPart,
  skillsForPart,
  TOEIC_TOPIC_TAGS,
} from "@/lib/content/toeic-tags";

function tagEnumValues(tags: { value: string }[]): string[] {
  return tags.map((entry) => entry.value);
}

const TOPIC_ENUM = tagEnumValues(TOEIC_TOPIC_TAGS);

const PART12_TOPIC_ENUM = tagEnumValues(LISTENING_PART12_TOPIC_TAGS);

function listeningPart12TagProperties(part: 1 | 2): GeminiJsonSchema {
  const enumValues = tagEnumValues(listeningPart12TagsForPart(part));
  return {
    tags: {
      type: "array",
      minItems: 1,
      maxItems: 1,
      items: {
        type: "string",
        enum: enumValues,
        description: `Part ${part} classification slug — exactly one from the part table.`,
      },
    },
    topic: {
      type: "string",
      enum: PART12_TOPIC_ENUM,
      description:
        "Optional place — omit when the photograph or spoken line does not make it obvious. Not the Parts 3–7 topic list.",
    },
  };
}

/**
 * Per-question tag fields for Gemini structured output.
 * Parts 1–2: `tags[]` with one classification slug, plus optional `topic`.
 * Parts 3–7: split `skills` + `focus` (+ optional `topic`); import flattens to `tags[]`.
 */
export function geminiQuestionTagProperties(part: number): GeminiJsonSchema {
  if (part === 1 || part === 2) {
    return listeningPart12TagProperties(part);
  }

  const skills = tagEnumValues(skillsForPart(part));
  const focuses = tagEnumValues(focusesForPart(part));

  return {
    skills: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: {
        type: "string",
        enum: skills,
        description: "Dạng câu — 1–3 slugs from the part skill table.",
      },
    },
    focus: {
      type: "string",
      enum: focuses,
      description: "Trọng tâm — exactly one slug from the part focus table.",
    },
    topic: {
      type: "string",
      enum: TOPIC_ENUM,
      description:
        "Optional chủ đề — omit this property when context is unclear.",
    },
  };
}

export function geminiQuestionTagRequired(part: number): readonly string[] {
  if (part === 1 || part === 2) return ["tags"];
  return ["skills", "focus"];
}

/** @deprecated Use geminiQuestionTagRequired(part) */
export const GEMINI_QUESTION_TAG_REQUIRED = ["skills", "focus"] as const;
