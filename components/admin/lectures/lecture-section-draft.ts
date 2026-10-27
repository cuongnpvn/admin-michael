import { lectureQuestionSection } from "@/lib/lectures/exercise-groups";
import type { LectureQuestionInsert } from "@/lib/lectures/options";

export type SectionDraft = {
  title: string;
  questions: LectureQuestionInsert[];
  /** Set by the mini/final test editor. Lesson sections leave this unset. */
  part?: "1" | "5";
};

function sectionPart(questions: LectureQuestionInsert[]): "1" | "5" | undefined {
  if (questions.some((question) => question.payload.part === "1")) return "1";
  if (questions.some((question) => question.payload.part === "5")) return "5";
  return undefined;
}

export function readLectureSections(
  questions: LectureQuestionInsert[],
): SectionDraft[] {
  if (questions.length === 0) return [];
  const grouped = new Map<number, LectureQuestionInsert[]>();
  for (const question of questions) {
    const section = lectureQuestionSection(question);
    const list = grouped.get(section) ?? [];
    list.push(question);
    grouped.set(section, list);
  }
  return [...grouped.keys()]
    .sort((left, right) => left - right)
    .map((section) => {
      const list = grouped.get(section) ?? [];
      return {
        title:
          list.find((question) => question.payload.groupTitle?.trim())?.payload
            .groupTitle?.trim() ?? "",
        part: sectionPart(list),
        questions: list,
      };
    });
}

export function writeLectureSections(
  sections: SectionDraft[],
): LectureQuestionInsert[] {
  let sortOrder = 1;
  return sections.flatMap((section, index) => {
    const sectionNumber = index + 1;
    const title = section.title.trim();
    return section.questions.map((question) => ({
      ...question,
      sortOrder: sortOrder++,
      payload: {
        ...question.payload,
        section: sectionNumber,
        groupTitle: title,
        ...(section.part === "1" || section.part === "5"
          ? { part: section.part }
          : {}),
      },
    }));
  });
}
