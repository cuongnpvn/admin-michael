export function lecturePracticeIsComplete(correct: number, total: number): boolean {
  if (total <= 0 || correct < 0) return false;
  return correct * 10 >= total * 9;
}

/** 9/10 and 10/10 are 100%. Lower scores stay the rounded percent. */
export function lecturePracticeCompleteness(correct: number, total: number): number {
  if (total <= 0 || correct < 0) return 0;
  if (lecturePracticeIsComplete(correct, total)) return 100;
  return Math.round((correct / total) * 100);
}

export function parsePracticeAnswers(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const answers: Record<string, string> = {};
  for (const [id, item] of Object.entries(value)) {
    if (typeof item === "string" && item) answers[id] = item;
  }
  return answers;
}
