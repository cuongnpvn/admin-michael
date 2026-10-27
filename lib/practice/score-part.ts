export interface PartQuestionKey {
  id: string;
  globalItemNumber: number;
  correctOptionId: string;
}

export interface PartPracticeResult {
  total: number;
  correct: number;
  wrong: number;
  unanswered: number;
}

export interface UnansweredQuestion {
  id: string;
  globalItemNumber: number;
}

export type QuestionResultStatus = "correct" | "wrong" | "unanswered";

export function getQuestionResultStatus(
  question: PartQuestionKey,
  answers: Record<string, string>,
): QuestionResultStatus {
  const selected = answers[question.id];

  if (!selected) {
    return "unanswered";
  }

  return selected === question.correctOptionId ? "correct" : "wrong";
}

export function buildQuestionResultMap(
  questions: PartQuestionKey[],
  answers: Record<string, string>,
): Record<string, QuestionResultStatus> {
  return Object.fromEntries(
    questions.map((question) => [
      question.id,
      getQuestionResultStatus(question, answers),
    ]),
  );
}

export function scorePartPractice(
  questions: PartQuestionKey[],
  answers: Record<string, string>,
): PartPracticeResult {
  let correct = 0;
  let wrong = 0;
  let unanswered = 0;

  for (const question of questions) {
    const selected = answers[question.id];

    if (!selected) {
      unanswered += 1;
      continue;
    }

    if (selected === question.correctOptionId) {
      correct += 1;
    } else {
      wrong += 1;
    }
  }

  return {
    total: questions.length,
    correct,
    wrong,
    unanswered,
  };
}

export function getUnansweredQuestions(
  questions: PartQuestionKey[],
  answers: Record<string, string>,
): UnansweredQuestion[] {
  return questions
    .filter((question) => !answers[question.id])
    .map((question) => ({
      id: question.id,
      globalItemNumber: question.globalItemNumber,
    }));
}
