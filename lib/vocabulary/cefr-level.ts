export const VOCABULARY_CEFR_LEVELS = [
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
] as const;

export type VocabularyCefrLevel = (typeof VOCABULARY_CEFR_LEVELS)[number];

const LEVEL_SET = new Set<string>(VOCABULARY_CEFR_LEVELS);

export function parseVocabularyCefrLevel(
  value: unknown,
): VocabularyCefrLevel | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!LEVEL_SET.has(trimmed)) return null;
  return trimmed as VocabularyCefrLevel;
}
