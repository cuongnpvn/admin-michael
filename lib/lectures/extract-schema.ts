import { z } from "zod";
import { normalizeLectureTags } from "@/lib/lectures/tags";

const OPTION_LABELS = ["A", "B", "C", "D"] as const;
const optionLabelSchema = z.enum(OPTION_LABELS);

export function coerceLectureOptionLabel(
  value: unknown,
): (typeof OPTION_LABELS)[number] | undefined {
  if (typeof value === "number" && Number.isInteger(value)) {
    if (value >= 1 && value <= 4) return OPTION_LABELS[value - 1];
    if (value >= 0 && value <= 3) return OPTION_LABELS[value];
    return undefined;
  }
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim().toUpperCase();
  if ((OPTION_LABELS as readonly string[]).includes(trimmed)) {
    return trimmed as (typeof OPTION_LABELS)[number];
  }
  const leading = trimmed.match(/^([A-D])(?:[.)\s]|$)/);
  if (leading?.[1]) {
    return leading[1] as (typeof OPTION_LABELS)[number];
  }
  if (/^[1-4]$/.test(trimmed)) {
    return OPTION_LABELS[Number(trimmed) - 1];
  }
  return undefined;
}

function preprocessLectureQuestion(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;

  const question = { ...(value as Record<string, unknown>) };
  const correctLabel = coerceLectureOptionLabel(
    question.correctLabel ??
      question.correctAnswer ??
      question.answer ??
      question.correct,
  );
  if (correctLabel) question.correctLabel = correctLabel;
  if (question.explanation == null) question.explanation = "";

  if (Array.isArray(question.options)) {
    question.options = question.options.map((option, index) => {
      if (typeof option === "string") {
        return { label: OPTION_LABELS[index], text: option };
      }
      if (!option || typeof option !== "object" || Array.isArray(option)) {
        return option;
      }
      const next = { ...(option as Record<string, unknown>) };
      const label =
        coerceLectureOptionLabel(next.label) ?? OPTION_LABELS[index];
      if (label) next.label = label;
      return next;
    });
  }

  return question;
}

const extractOptionSchema = z.object({
  label: optionLabelSchema,
  text: z.string().trim().min(1),
});

const extractQuestionSchema = z.preprocess(
  preprocessLectureQuestion,
  z.object({
    stem: z.string().trim().min(1),
    options: z.array(extractOptionSchema).min(3).max(4),
    correctLabel: optionLabelSchema,
    explanation: z.preprocess(
      (value) => (value == null ? "" : value),
      z.string().trim().default(""),
    ),
  }),
);

function preprocessLectureExtract(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;

  const next = { ...(value as Record<string, unknown>) };
  if (next.content != null) next.bodyHtml = next.content;
  if (next.quiz != null) next.questions = next.quiz;
  return next;
}

export const lectureExtractSchema = z.preprocess(
  preprocessLectureExtract,
  z.object({
    title: z.string().trim().min(1),
    excerpt: z.preprocess(
      (value) => (value == null ? "" : value),
      z.string().trim().default(""),
    ),
    bodyHtml: z.preprocess(
      (value) => (value == null ? "" : value),
      z.string().trim().default(""),
    ),
    tags: z.preprocess(
      (value) => (value == null ? [] : value),
      z.array(z.string()).default([]),
    ),
    track: z.string().optional(),
    part: z.union([z.number(), z.string()]).nullable().optional(),
    skillTag: z.string().nullable().optional(),
    estimatedMinutes: z.number().int().positive().nullable().optional(),
    questions: z.array(extractQuestionSchema).default([]),
  }),
);

type LectureExtractParsed = z.infer<typeof lectureExtractSchema>;

export type LectureExtract = Omit<
  LectureExtractParsed,
  "track" | "part" | "skillTag" | "estimatedMinutes"
> & {
  estimatedMinutes: number | null;
};

export function parseLectureExtract(value: unknown): LectureExtract {
  const parsed = lectureExtractSchema.parse(value);
  const optionsByQuestion = parsed.questions.map((question) => {
    const labels = new Set(question.options.map((option) => option.label));
    if (!labels.has(question.correctLabel)) {
      throw new Error("correctLabel must match an option");
    }
    return question;
  });

  const { track, part, skillTag, ...rest } = parsed;
  return {
    ...rest,
    tags: normalizeLectureTags([
      ...parsed.tags,
      track,
      part != null && String(part).trim() !== "" ? `part ${part}` : null,
      skillTag,
    ]),
    estimatedMinutes: parsed.estimatedMinutes ?? null,
    questions: optionsByQuestion,
  };
}
