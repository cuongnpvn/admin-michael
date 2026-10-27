import {
  TOEIC_PART_QUESTION_COUNTS,
  toeicPartGlobalItemRange,
} from "@/lib/content/toeic-global-item-number";
import {
  TOEIC_PART7_MAX_PASSAGES_PER_SET,
  TOEIC_PART7_MAX_QUESTIONS_PER_SET,
  TOEIC_PART7_MIN_QUESTIONS_PER_SET,
} from "@/lib/content/validate-exam-test";

/** Official ETS TOEIC Reading section sizes (full test). */
export const READING_PART_OFFICIAL_SPEC = {
  5: {
    questions: TOEIC_PART_QUESTION_COUNTS[5],
    globalItemFirst: toeicPartGlobalItemRange(5).first,
    globalItemLast: toeicPartGlobalItemRange(5).last,
    shape: "questions" as const,
  },
  6: {
    questions: TOEIC_PART_QUESTION_COUNTS[6],
    passageSets: 4,
    questionsPerSet: 4,
    globalItemFirst: toeicPartGlobalItemRange(6).first,
    globalItemLast: toeicPartGlobalItemRange(6).last,
    shape: "passageSets" as const,
  },
  7: {
    questions: TOEIC_PART_QUESTION_COUNTS[7],
    globalItemFirst: toeicPartGlobalItemRange(7).first,
    globalItemLast: toeicPartGlobalItemRange(7).last,
    minQuestionsPerSet: TOEIC_PART7_MIN_QUESTIONS_PER_SET,
    maxQuestionsPerSet: TOEIC_PART7_MAX_QUESTIONS_PER_SET,
    maxPassagesPerSet: TOEIC_PART7_MAX_PASSAGES_PER_SET,
    shape: "passageSets" as const,
  },
} as const;

export type ReadingPart567 = keyof typeof READING_PART_OFFICIAL_SPEC;

export function countReadingPassageSetQuestions(part: {
  passageSets: { questions: unknown[] }[];
}): { passageSets: number; questions: number } {
  return {
    passageSets: part.passageSets.length,
    questions: part.passageSets.reduce(
      (total, set) => total + set.questions.length,
      0,
    ),
  };
}

export function readingPartImportCountError(
  part: ReadingPart567,
  actualQuestions: number,
  actualPassageSets?: number,
): string {
  const spec = READING_PART_OFFICIAL_SPEC[part];

  if (part === 7) {
    return (
      `Reading Part 7 thiếu dữ liệu so với TOEIC chuẩn: cần ${spec.questions} câu ` +
      `(global ${spec.globalItemFirst}–${spec.globalItemLast}), nhưng JSON chỉ có ${actualQuestions} câu` +
      (actualPassageSets !== undefined ? ` trong ${actualPassageSets} passage set` : "") +
      `. PDF đã đủ nội dung — hãy chạy lại Gemini extract (thường do output bị cắt sớm).`
    );
  }

  if (part === 6) {
    const p6 = READING_PART_OFFICIAL_SPEC[6];
    return (
      `Reading Part 6 thiếu dữ liệu: cần ${p6.questions} câu (${p6.passageSets} set × ${p6.questionsPerSet}), ` +
      `nhưng JSON có ${actualQuestions} câu` +
      (actualPassageSets !== undefined ? ` / ${actualPassageSets} set` : "") +
      `.`
    );
  }

  return (
    `Reading Part 5 thiếu dữ liệu: cần ${spec.questions} câu ` +
    `(global ${spec.globalItemFirst}–${spec.globalItemLast}), nhưng JSON có ${actualQuestions} câu.`
  );
}

export function assertCreateExamReadingPartQuestionCount(
  part: ReadingPart567,
  parsed: { passageSets?: { questions: unknown[] }[]; questions?: unknown[] },
  options?: { skipOfficialQuestionCount?: boolean },
): void {
  if (options?.skipOfficialQuestionCount) return;

  const spec = READING_PART_OFFICIAL_SPEC[part];
  let actualQuestions: number;
  let actualPassageSets: number | undefined;

  if (spec.shape === "passageSets") {
    const counts = countReadingPassageSetQuestions({
      passageSets: parsed.passageSets ?? [],
    });
    actualQuestions = counts.questions;
    actualPassageSets = counts.passageSets;
  } else {
    actualQuestions = parsed.questions?.length ?? 0;
  }

  if (actualQuestions === spec.questions) return;

  throw new Error(
    readingPartImportCountError(part, actualQuestions, actualPassageSets),
  );
}
