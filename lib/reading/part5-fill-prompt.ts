export const PART5_BLANK_MARKER = "-------";

export function fillPart5PromptWithAnswer(
  prompt: string,
  options: Array<{ id: string; text: string }>,
  correctOptionId: string | undefined,
): string {
  if (!prompt.includes(PART5_BLANK_MARKER) || !correctOptionId) {
    return prompt;
  }

  const answer = options
    .find((option) => option.id === correctOptionId)
    ?.text.trim();
  if (!answer) {
    return prompt;
  }

  return prompt.replace(PART5_BLANK_MARKER, answer);
}

/** Filled sentence with the correct answer wrapped in markdown bold (`**answer**`). */
export function fillPart5PromptWithBoldAnswer(
  prompt: string,
  options: Array<{ id: string; text: string }>,
  correctOptionId: string | undefined,
): string {
  if (!prompt.includes(PART5_BLANK_MARKER) || !correctOptionId) {
    return prompt;
  }

  const answer = options
    .find((option) => option.id === correctOptionId)
    ?.text.trim();
  if (!answer) {
    return prompt;
  }

  return prompt.replace(PART5_BLANK_MARKER, `**${answer}**`);
}
