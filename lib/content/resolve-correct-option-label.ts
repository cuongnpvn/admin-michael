import type { QuestionExplanation } from "@/lib/content/question-explanation";
import { parseQuestionExplanation } from "@/lib/content/question-explanation";
import { z } from "zod";

export type ImportOptionLabel = "A" | "B" | "C" | "D";

export type ImportOption = {
  label: ImportOptionLabel;
  text: string;
};

const OPTION_LABELS = new Set<ImportOptionLabel>(["A", "B", "C", "D"]);

const EXPLANATION_ANSWER_PATTERNS = [
  /Đáp án đúng là\s*(?:\*\*)?([A-D])(?:\*\*)?/i,
  /Đáp án phù hợp nhất là\s*(?:\*\*)?([A-D])(?:\*\*)?/i,
  /→\s*\*\*Đáp án\s+([A-D])\*\*/i,
  /→\s*Đáp án\s+([A-D])\b/i,
] as const;

export function normalizeImportOptionLabel(
  value: unknown,
): ImportOptionLabel | undefined {
  if (typeof value !== "string") return undefined;

  const normalized = value.trim().toUpperCase();
  if (!OPTION_LABELS.has(normalized as ImportOptionLabel)) {
    return undefined;
  }

  return normalized as ImportOptionLabel;
}

export function inferCorrectOptionLabelFromExplanation(
  explanation: unknown,
): ImportOptionLabel | undefined {
  const parsed = parseQuestionExplanation(explanation);
  const reasoning = parsed?.reasoning?.trim();
  if (!reasoning) return undefined;

  for (const pattern of EXPLANATION_ANSWER_PATTERNS) {
    const match = reasoning.match(pattern);
    const label = normalizeImportOptionLabel(match?.[1]);
    if (label) return label;
  }

  return undefined;
}

export interface ImportCorrectOptionSource {
  correctOptionLabel?: unknown;
  correctAnswer?: unknown;
  answer?: unknown;
  explanation?: QuestionExplanation | unknown;
  options?: Array<{ label?: unknown }>;
}

export function resolveImportCorrectOptionLabel(
  source: ImportCorrectOptionSource,
): ImportOptionLabel | undefined {
  const direct =
    normalizeImportOptionLabel(source.correctOptionLabel) ??
    normalizeImportOptionLabel(source.correctAnswer) ??
    normalizeImportOptionLabel(source.answer);

  if (direct) {
    const optionLabels = (source.options ?? [])
      .map((option) => normalizeImportOptionLabel(option.label))
      .filter((label): label is ImportOptionLabel => !!label);

    if (optionLabels.length === 0 || optionLabels.includes(direct)) {
      return direct;
    }
  }

  const inferred = inferCorrectOptionLabelFromExplanation(source.explanation);
  if (!inferred) return undefined;

  const optionLabels = (source.options ?? [])
    .map((option) => normalizeImportOptionLabel(option.label))
    .filter((label): label is ImportOptionLabel => !!label);

  if (optionLabels.length === 0 || optionLabels.includes(inferred)) {
    return inferred;
  }

  return undefined;
}

export function preprocessImportQuestion(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const question = { ...(value as Record<string, unknown>) };
  const resolved = resolveImportCorrectOptionLabel({
    correctOptionLabel: question.correctOptionLabel,
    correctAnswer: question.correctAnswer,
    answer: question.answer,
    explanation: question.explanation,
    options: Array.isArray(question.options)
      ? (question.options as Array<{ label?: unknown }>)
      : [],
  });

  if (resolved) {
    question.correctOptionLabel = resolved;
  }

  delete question.correctAnswer;
  delete question.answer;

  return question;
}

export function preprocessImportOption(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const option = { ...(value as Record<string, unknown>) };
  const label = normalizeImportOptionLabel(option.label);
  if (label) {
    option.label = label;
  }

  return option;
}

export function withImportQuestionNormalization<
  T extends z.ZodObject<z.ZodRawShape>,
>(schema: T) {
  type Output = z.infer<T>;
  return z.preprocess(
    preprocessImportQuestion,
    schema.transform((question: Output): Output => {
      const resolved = resolveImportCorrectOptionLabel(
        question as ImportCorrectOptionSource,
      );
      if (!resolved) return question;
      return { ...question, correctOptionLabel: resolved };
    }),
  );
}
