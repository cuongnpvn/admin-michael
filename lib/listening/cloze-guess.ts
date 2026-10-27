import { normalizeAnswerToken } from "@/lib/listening/common-words";

export type ClozeGuessStatus = "empty" | "typing" | "correct" | "incorrect";

/** Letters/digits to match for a hidden token (punctuation excluded). */
export function getExpectedAnswer(tokenText: string): string {
  return (
    normalizeAnswerToken(tokenText) ??
    tokenText.replace(/[^a-zA-Z0-9']/gu, "").toLowerCase()
  );
}

function matchesExpectedPrefix(guess: string, expected: string): boolean {
  return expected.toLowerCase().startsWith(guess.toLowerCase());
}

export function getClozeGuessStatus(
  input: string,
  expected: string,
): ClozeGuessStatus {
  const guess = input.trim();
  if (guess.length === 0) return "empty";
  if (guess.length > expected.length) return "incorrect";
  if (!matchesExpectedPrefix(guess, expected)) return "incorrect";
  if (guess.length === expected.length) return "correct";
  return "typing";
}

export function splitTokenAffixes(tokenText: string): {
  leading: string;
  trailing: string;
} {
  const leading = tokenText.match(/^[^a-zA-Z0-9']+/u)?.[0] ?? "";
  const trailing = tokenText.match(/[^a-zA-Z0-9']+$/u)?.[0] ?? "";
  return { leading, trailing };
}
