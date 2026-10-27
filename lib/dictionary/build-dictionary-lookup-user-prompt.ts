/**
 * Short user prompt for Tra cứu AI (Gemini / DeepSeek).
 * Keeps token cost low while passing optional sentence context.
 */
export function buildDictionaryLookupUserPrompt(
  word: string,
  sentenceContext?: string | null,
): string {
  const trimmedWord = word.trim();
  const context = sentenceContext?.trim() || "(none)";

  return [
    `Selected word: ${trimmedWord}`,
    `Sentence context: ${context}`,
    "Return JSON for the dictionary headword the learner likely wants.",
  ].join("\n");
}
