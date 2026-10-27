import type { DraftBundle, DraftQuestionRow } from "@/lib/content/draft-types";
import { layoutFromPassageCount } from "@/lib/content/infer-metadata";
import type {
  ReadingImportFile,
  ReadingImportPart5Question,
  ReadingImportPassageQuestion,
} from "@/lib/content/reading-import-schema";
import { resolveImportCorrectOptionLabel } from "@/lib/content/resolve-correct-option-label";
import { validateQuestionTags } from "@/lib/content/toeic-tags";
import { validateImportQuestionNumber } from "@/lib/content/validate-import-question-numbers";

function padGlobalNumber(value: number): string {
  return String(value).padStart(3, "0");
}

function questionSlug(testId: string, part: number, globalItemNumber: number): string {
  return `${testId}-p${part}-q${padGlobalNumber(globalItemNumber)}`;
}

function optionSlug(questionSlugValue: string, label: string): string {
  return `${questionSlugValue}-${label.toLowerCase()}`;
}

function draftQuestionFromImport(
  bookId: string,
  testId: string,
  part: number,
  question: ReadingImportPart5Question | ReadingImportPassageQuestion,
  links?: {
    readingPassageSetSlug?: string;
  },
): DraftQuestionRow {
  const globalItemNumber = validateImportQuestionNumber({
    part,
    globalItemNumber: question.globalItemNumber,
    label: `${testId}-p${part}`,
    bookId,
  });
  const slug = questionSlug(testId, part, globalItemNumber);

  const options = question.options.map((option, index) => ({
    slug: optionSlug(slug, option.label),
    label: option.label,
    text: option.text,
    sortOrder: index + 1,
  }));

  const correctOptionLabel = resolveImportCorrectOptionLabel({
    correctOptionLabel: question.correctOptionLabel,
    explanation: question.explanation,
    options: question.options,
  });
  const correctOptionSlug = correctOptionLabel
    ? optionSlug(slug, correctOptionLabel)
    : "";

  const translations =
    part === 6 || part === 7
      ? ((question as ReadingImportPassageQuestion).translations ?? [])
      : [];

  return {
    slug,
    part,
    globalItemNumber,
    prompt: question.prompt,
    correctOptionSlug,
    hint: question.hint ?? null,
    explanation: question.explanation ?? null,
    tags: validateQuestionTags(question.tags),
    translations,
    vocabulary: question.vocabulary ?? [],
    options,
    readingPassageSetSlug: links?.readingPassageSetSlug,
  };
}

export function draftBundleFromReadingImport(file: ReadingImportFile): DraftBundle {
  const questions: DraftQuestionRow[] = [];
  const partTitles: DraftBundle["partTitles"] = [];
  const readingPassageSets: DraftBundle["readingPassageSets"] = [];

  for (const partData of file.parts) {
    partTitles.push({ part: partData.part, title: partData.title });

    if (partData.part === 5) {
      for (const question of partData.questions) {
        questions.push(
          draftQuestionFromImport(file.bookId, file.testId, 5, question),
        );
      }
      continue;
    }

    partData.passageSets.forEach((set, setIndex) => {
      const setSlug =
        set.id ?? `${file.testId}-p${partData.part}-set${String(setIndex + 1).padStart(2, "0")}`;
      const questionSlugs: string[] = [];

      for (const question of set.questions) {
        const row = draftQuestionFromImport(
          file.bookId,
          file.testId,
          partData.part,
          question,
          {
            readingPassageSetSlug: setSlug,
          },
        );
        questions.push(row);
        questionSlugs.push(row.slug);
      }

      readingPassageSets.push({
        slug: setSlug,
        part: partData.part,
        topic: set.topic ?? null,
        vocabulary: set.vocabulary ?? [],
        layout: layoutFromPassageCount(set.passages.length),
        contentModel:
          partData.part === 6 ? "text_completion_cloze" : "comprehension",
        passages: set.passages.map((passage, passageIndex) => ({
          slug: `${setSlug}-p${passageIndex + 1}`,
          title: passage.title,
          content: passage.content,
        })),
        questionSlugs,
      });
    });
  }

  return {
    bookId: file.bookId,
    testId: file.testId,
    testTitle: file.title,
    partTitles,
    part1Items: [],
    part2Items: [],
    listeningGroups: [],
    readingPassageSets,
    questions,
  };
}

export function readingImportMetaParts(file: ReadingImportFile) {
  return file.parts.map((part) => ({
    bookId: file.bookId,
    testId: file.testId,
    part: part.part,
    title: part.title,
    questionCount:
      part.part === 5
        ? part.questions.length
        : part.passageSets.reduce((sum, set) => sum + set.questions.length, 0),
  }));
}
