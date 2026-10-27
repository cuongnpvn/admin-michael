/** Comparable form for dictation — letters, digits, apostrophe, single spaces. */
export function normalizeDictationAnswer(text: string): string {
  return text
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[^a-z0-9'\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Tokenize after normalization (word-level diff). */
export function tokenizeDictationAnswer(normalized: string): string[] {
  return normalized.length === 0 ? [] : normalized.split(" ");
}

/** Split raw text into display tokens (whitespace-separated, punctuation preserved). */
export function tokenizeDictationDisplay(text: string): string[] {
  const trimmed = text.trim();
  return trimmed.length === 0 ? [] : trimmed.split(/\s+/);
}

/** Normalize each display token for alignment. */
export function normalizeDictationDisplayToken(token: string): string {
  return normalizeDictationAnswer(token);
}

/** Reserve vertical space for the answer feedback line(s). */
export function resolveDictationAnswerSlotMinH(
  expectedText: string,
  lineReserve = 1,
): string {
  const estimatedLines = Math.max(
    lineReserve,
    Math.ceil(expectedText.length / 50),
    1,
  );
  if (estimatedLines >= 2) return "min-h-[2.75rem]";
  return "min-h-[1.375rem]";
}
