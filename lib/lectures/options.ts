import type { QuestionExplanation } from "@/lib/content/question-explanation";
import {
  emptyExplanation,
  emptyKeyAnswer,
  emptyPayload,
  type LectureExerciseKind,
  type LectureKeyAnswer,
  type LectureQuestionPayload,
} from "@/lib/lectures/exercise";
import type { LectureExtract } from "@/lib/lectures/extract-schema";
import type { LectureOption, LectureOptionLabel } from "@/lib/lectures/types";

export interface LectureQuestionInsert {
  sortOrder: number;
  kind: LectureExerciseKind;
  stem: string;
  options: LectureOption[];
  payload: LectureQuestionPayload;
  correctOptionId: string | null;
  explanation: QuestionExplanation;
  answer: LectureKeyAnswer;
}

export function assignLectureQuestionIds(
  questions: LectureExtract["questions"],
): LectureQuestionInsert[] {
  return questions.map((question, index) => {
    const options: LectureOption[] = question.options.map((option) => ({
      id: crypto.randomUUID(),
      label: option.label,
      text: option.text,
    }));
    const correct = options.find((option) => option.label === question.correctLabel);
    if (!correct) {
      throw new Error("correctLabel must match an option");
    }

    return {
      sortOrder: index + 1,
      kind: "multiple_choice",
      stem: question.stem,
      options,
      payload: emptyPayload(),
      correctOptionId: correct.id,
      explanation: { reasoning: question.explanation, reference: [] },
      answer: emptyKeyAnswer(),
    };
  });
}

export function optionLabelsForCount(count: 3 | 4): LectureOptionLabel[] {
  return count === 3 ? ["A", "B", "C"] : ["A", "B", "C", "D"];
}

export function emptyLectureQuestion(sortOrder: number): LectureQuestionInsert {
  const labels = optionLabelsForCount(4);
  const options: LectureOption[] = labels.map((label) => ({
    id: crypto.randomUUID(),
    label,
    text: "",
  }));

  return {
    sortOrder,
    kind: "multiple_choice",
    stem: "",
    options,
    payload: emptyPayload(),
    correctOptionId: options[0]!.id,
    explanation: emptyExplanation,
    answer: emptyKeyAnswer(),
  };
}
