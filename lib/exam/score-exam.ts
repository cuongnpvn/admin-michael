import type { PartQuestionKey } from "@/lib/practice/score-part";
import { getUnansweredQuestions, scorePartPractice } from "@/lib/practice/score-part";
import { scaleToToeicScore } from "@/lib/exam/toeic-score-conversion";

export { scaleToToeicScore } from "@/lib/exam/toeic-score-conversion";
export type { ToeicExamSection } from "@/lib/exam/toeic-score-conversion";

export interface ExamSectionScore {
  correct: number;
  wrong: number;
  unanswered: number;
  total: number;
  scaled: number;
}

export interface ExamScoreResult {
  listening: ExamSectionScore;
  reading: ExamSectionScore;
  totalScaled: number;
}

export interface ExamPartScoreBreakdown {
  part: number;
  correct: number;
  wrong: number;
  unanswered: number;
  total: number;
}

export function scoreExamParts(
  items: Array<{ part: number; question: { id: string } }>,
  keys: PartQuestionKey[],
  answers: Record<string, string>,
): ExamPartScoreBreakdown[] {
  const keyById = new Map(keys.map((key) => [key.id, key]));
  const keysByPart = new Map<number, PartQuestionKey[]>();

  for (const item of items) {
    const key = keyById.get(item.question.id);
    if (!key) continue;

    const partKeys = keysByPart.get(item.part) ?? [];
    partKeys.push(key);
    keysByPart.set(item.part, partKeys);
  }

  return [...keysByPart.entries()]
    .sort(([leftPart], [rightPart]) => leftPart - rightPart)
    .map(([part, partKeys]) => ({
      part,
      ...scorePartPractice(partKeys, answers),
    }));
}

export function scoreFullExam(
  listeningKeys: PartQuestionKey[],
  readingKeys: PartQuestionKey[],
  answers: Record<string, string>,
): ExamScoreResult {
  const listeningRaw = scorePartPractice(listeningKeys, answers);
  const readingRaw = scorePartPractice(readingKeys, answers);

  const listening: ExamSectionScore = {
    ...listeningRaw,
    scaled: scaleToToeicScore(
      listeningRaw.correct,
      listeningRaw.total,
      "listening",
    ),
  };
  const reading: ExamSectionScore = {
    ...readingRaw,
    scaled: scaleToToeicScore(readingRaw.correct, readingRaw.total, "reading"),
  };

  const totalScaled =
    (listening.total > 0 ? listening.scaled : 0) +
    (reading.total > 0 ? reading.scaled : 0);

  return {
    listening,
    reading,
    totalScaled,
  };
}

export function getExamUnanswered(
  keys: PartQuestionKey[],
  answers: Record<string, string>,
  globalOffset: number,
) {
  return getUnansweredQuestions(keys, answers).map((q) => ({
    ...q,
    globalNumber: globalOffset + q.globalItemNumber,
  }));
}
