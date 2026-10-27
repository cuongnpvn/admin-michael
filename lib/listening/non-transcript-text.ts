/**
 * Transcript markup that is not spoken audio content.
 * Dictation (and cloze eligibility) should ignore these tokens/lines.
 *
 * Keep this list exhaustive for listening transcript conventions:
 * - Speaker turn labels: W: / M: / N: / A: / B: / Woman: / Man: / Speaker 1:
 * - Message / chat timestamps: (10:45 A.M.), [10:15], [10:15 A.M.]
 * - Editorial group markers: [Group 1 — Part 3]
 */

/** Whole-token patterns (after whitespace split). */
const NON_TRANSCRIPT_TOKEN_PATTERNS: readonly RegExp[] = [
  // Speaker labels (Part 3 conversations)
  /^[WMNAB]:$/iu,
  /^(?:woman|man|narrator):$/iu,
  /^speaker\s*\d+:$/iu,

  // Chat / message timestamps kept as a single token
  /^\(\d{1,2}:\d{2}\s*[ap]\.?m\.?\)$/iu,
  /^\[\d{1,2}:\d{2}(?:\s*[ap]\.?m\.?)?\]$/iu,

  // Split parenthetical / bracket time fragments: "(10:45" + "A.M.)"
  /^\(\d{1,2}:\d{2}$/u,
  /^\d{1,2}:\d{2}\)$/u,
  /^[ap]\.?m\.?\)$/iu,
  /^\[\d{1,2}:\d{2}$/u,
  /^\d{1,2}:\d{2}\]$/u,
  /^[ap]\.?m\.?\]$/iu,
];

/** Entire lines that are markup-only (no spoken words to dictate). */
const NON_TRANSCRIPT_LINE_PATTERNS: readonly RegExp[] = [
  /^\[Group\s+\d+/iu,
  /^\[[^\]]*Part\s*[34][^\]]*\]$/iu,
  /^\(\d{1,2}:\d{2}\s*[ap]\.?m\.?\)$/iu,
  /^\[\d{1,2}:\d{2}(?:\s*[ap]\.?m\.?)?\]$/iu,
  // Speaker header with optional time, e.g. "Carol Barger (10:45 A.M.)"
  /^.+\s+\(\d{1,2}:\d{2}\s*[ap]\.?m\.?\)$/iu,
  // Label-only lines
  /^[WMNAB]:$/iu,
  /^(?:woman|man|narrator):$/iu,
  /^speaker\s*\d+:$/iu,
];

export function isNonTranscriptToken(token: string): boolean {
  const trimmed = token.trim();
  if (!trimmed) return false;
  return NON_TRANSCRIPT_TOKEN_PATTERNS.some((pattern) => pattern.test(trimmed));
}

/** True when the line is markup-only and should not become a dictation prompt. */
export function isNonTranscriptLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return true;
  return NON_TRANSCRIPT_LINE_PATTERNS.some((pattern) => pattern.test(trimmed));
}
