import { z } from "zod";
import { splitPassageReferenceQueries } from "@/lib/reading/split-passage-reference-queries";

export interface QuestionExplanation {
  reasoning: string;
  /** Verbatim English text from passage/transcript for UI highlight (reading: sentences; listening P3–P4: keyword/phrase snippets). */
  reference: string[];
}

export const questionExplanationSchema = z.object({
  reasoning: z.string(),
  reference: z.array(z.string()),
});

function isReferenceValue(value: unknown): value is string | string[] {
  if (typeof value === "string") {
    return true;
  }

  return (
    Array.isArray(value) && value.every((entry) => typeof entry === "string")
  );
}

export function isQuestionExplanation(
  value: unknown,
): value is QuestionExplanation {
  if (!value || typeof value !== "object") {
    return false;
  }

  const row = value as Record<string, unknown>;
  return typeof row.reasoning === "string" && isReferenceValue(row.reference);
}

/** Normalize legacy string or string[] into a deduplicated reference list. */
export function normalizeExplanationReferences(
  value: string | string[] | unknown,
): string[] {
  if (Array.isArray(value)) {
    const seen = new Set<string>();
    const normalized: string[] = [];

    for (const entry of value) {
      if (typeof entry !== "string") {
        continue;
      }

      const trimmed = entry.trim();
      if (!trimmed) {
        continue;
      }

      const key = trimmed.toLowerCase();
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      normalized.push(trimmed);
    }

    return normalized;
  }

  if (typeof value === "string") {
    return splitPassageReferenceQueries(value);
  }

  return [];
}

/** CMS textarea: one reference sentence per line. */
export function parseReferenceDraftText(text: string): string[] {
  const byLine = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (byLine.length <= 1) {
    return normalizeExplanationReferences(text);
  }

  return normalizeExplanationReferences(byLine);
}

export function referencesToDraftText(references: string[]): string {
  return normalizeExplanationReferences(references).join("\n");
}

/** Normalize import/DB/CMS values (object or legacy plain string). */
export function parseQuestionExplanation(
  value: unknown,
): QuestionExplanation | null {
  if (value == null) {
    return null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    if (trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        if (isQuestionExplanation(parsed)) {
          return normalizeQuestionExplanation(parsed);
        }
      } catch {
        // fall through to legacy string reasoning
      }
    }

    return { reasoning: trimmed, reference: [] };
  }

  if (isQuestionExplanation(value)) {
    return normalizeQuestionExplanation(value);
  }

  return null;
}

export function normalizeQuestionExplanation(
  value: QuestionExplanation,
): QuestionExplanation | null {
  const reasoning = value.reasoning.trim();
  const reference = normalizeExplanationReferences(value.reference);
  if (!reasoning && reference.length === 0) {
    return null;
  }

  return { reasoning, reference };
}

/** Value stored in Postgres `question_explanations.explanation` jsonb column. */
export function explanationToDbJson(
  value: QuestionExplanation | null | undefined,
): QuestionExplanation | null {
  if (!value) {
    return null;
  }

  return normalizeQuestionExplanation(value);
}

export const importQuestionExplanationSchema = z.preprocess(
  (value) => parseQuestionExplanation(value),
  questionExplanationSchema.nullable().optional(),
);

export function hasQuestionExplanation(
  value: QuestionExplanation | null | undefined,
): boolean {
  return !!(
    value?.reasoning?.trim() ||
    normalizeExplanationReferences(value?.reference ?? []).length > 0
  );
}

export function formatQuestionExplanation(
  value: QuestionExplanation,
  reasoningFallback = "",
): QuestionExplanation {
  return {
    reasoning: value.reasoning.trim() || reasoningFallback,
    reference: normalizeExplanationReferences(value.reference),
  };
}

export function explanationToDraftFields(value: unknown): {
  reasoning: string;
  references: string[];
} {
  const parsed = parseQuestionExplanation(value);
  return {
    reasoning: parsed?.reasoning ?? "",
    references: normalizeExplanationReferences(parsed?.reference ?? []),
  };
}

export function draftFieldsToExplanation(
  reasoning: string,
  references: string[] | string,
): QuestionExplanation | null {
  const reference = Array.isArray(references)
    ? normalizeExplanationReferences(references)
    : parseReferenceDraftText(references);

  return normalizeQuestionExplanation({
    reasoning,
    reference,
  });
}
