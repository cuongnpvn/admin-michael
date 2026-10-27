import type { QuestionTranslationEntry } from "@/lib/content/draft-types";

export function normalizeQuestionTranslations(
  value: unknown,
): QuestionTranslationEntry[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is QuestionTranslationEntry => {
    if (!entry || typeof entry !== "object") return false;
    const row = entry as Record<string, unknown>;
    return typeof row.english === "string" && typeof row.vietnamese === "string";
  });
}

export function parseTagsInput(raw: string): string[] {
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function formatTagsForInput(tags: string[]): string {
  return tags.join(", ");
}
