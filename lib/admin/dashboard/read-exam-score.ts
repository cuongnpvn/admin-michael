export type ExamSectionScore = {
  scaled: number;
};

export type ExamScoreResult = {
  listening: ExamSectionScore;
  reading: ExamSectionScore;
  totalScaled: number;
};

export function readExamScore(
  scoreData: Record<string, unknown>,
): ExamScoreResult | null {
  const totalScaled = scoreData.totalScaled;
  const listening = scoreData.listening;
  const reading = scoreData.reading;

  if (
    typeof totalScaled !== "number" ||
    typeof listening !== "object" ||
    listening == null ||
    typeof reading !== "object" ||
    reading == null
  ) {
    return null;
  }

  const listeningScaled = (listening as { scaled?: unknown }).scaled;
  const readingScaled = (reading as { scaled?: unknown }).scaled;
  if (typeof listeningScaled !== "number" || typeof readingScaled !== "number") {
    return null;
  }

  return {
    totalScaled,
    listening: { scaled: listeningScaled },
    reading: { scaled: readingScaled },
  };
}
