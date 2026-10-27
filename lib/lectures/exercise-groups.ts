import type { LectureExerciseKind } from "@/lib/lectures/exercise";
import type { LectureQuestion } from "@/lib/lectures/types";

export type LectureExerciseGroup = {
  kind: LectureExerciseKind;
  title: string;
  section: number;
  questions: LectureQuestion[];
};

/** Numbered worksheet headings already say which bài they are. */
const NUMBERED_BAI_LABEL = /^Bài\s+\d+\s*[.:]\s*/u;

/**
 * Drawer headings are "Bài tập N: …". Drop a leading "Bài 1." so that
 * prefix is not repeated. Practice titles such as "Luyện tập" are kept.
 */
export function lectureExerciseGroupLabel(title: string): string {
  const trimmed = title.trim();
  if (trimmed === "Luyện tập") return trimmed;
  const rest = trimmed.replace(NUMBERED_BAI_LABEL, "").trim();
  return rest || trimmed;
}

export function groupLectureExercises(
  questions: LectureQuestion[],
): LectureExerciseGroup[] {
  const groups: LectureExerciseGroup[] = [];
  for (const question of questions) {
    const title = question.payload.groupTitle?.trim() ?? "";
    const section = lectureQuestionSection(question);
    const last = groups.at(-1);
    if (
      last &&
      last.kind === question.kind &&
      last.title === title &&
      last.section === section
    ) {
      last.questions.push(question);
      continue;
    }
    groups.push({ kind: question.kind, title, section, questions: [question] });
  }
  return groups;
}

export function lectureQuestionSection(question: {
  payload: { section?: number };
}): number {
  const section = question.payload.section;
  return section != null && section > 0 ? section : 1;
}

/** `null` means every section. `#exercise` and `#exercise-N`. */
export function parseExerciseHash(hash: string): { section: number | null } | null {
  if (hash === "#exercise") return { section: null };
  const match = /^#exercise-(\d+)$/.exec(hash);
  if (!match) return null;
  const section = Number(match[1]);
  if (!Number.isInteger(section) || section < 1) return null;
  return { section };
}

export function questionsInSection<T extends { payload: { section?: number } }>(
  questions: T[],
  section: number | null,
): T[] {
  if (section == null) return questions;
  return questions.filter(
    (question) => lectureQuestionSection(question) === section,
  );
}

export function highlightLabelsMatch(questions: LectureQuestion[]): boolean {
  const first = questions[0]?.payload.labels ?? [];
  return questions.every((question) => {
    const labels = question.payload.labels;
    return (
      labels.length === first.length &&
      labels.every(
        (label, index) =>
          label.id === first[index]?.id && label.name === first[index]?.name,
      )
    );
  });
}
