import type {
  ReadingImportFile,
  ReadingImportPart5Question,
  ReadingImportPassageQuestion,
} from "@/lib/content/reading-import-schema";
import type { TestImportFile } from "@/lib/content/schemas";
import type { QuestionData, ReadingPartData } from "@/types/test-data";

function correctOptionLabel(
  question: QuestionData,
): "A" | "B" | "C" | "D" | undefined {
  const match = question.options.find(
    (option) => option.id === question.correctOptionId,
  );
  return match?.label;
}

function importPart5QuestionFromTestData(
  question: QuestionData,
): ReadingImportPart5Question {
  return {
    globalItemNumber: question.globalItemNumber,
    prompt: question.prompt,
    options: question.options.map((option) => ({
      label: option.label,
      text: option.text,
    })),
    hint: question.hint ?? undefined,
    explanation: question.explanation ?? undefined,
    correctOptionLabel: correctOptionLabel(question),
    tags: question.tags ?? [],
    vocabulary: question.vocabulary ?? [],
  };
}

function importPassageQuestionFromTestData(
  question: QuestionData,
): ReadingImportPassageQuestion {
  return {
    globalItemNumber: question.globalItemNumber,
    prompt: question.prompt,
    options: question.options.map((option) => ({
      label: option.label,
      text: option.text,
    })),
    hint: question.hint ?? undefined,
    explanation: question.explanation ?? undefined,
    correctOptionLabel: correctOptionLabel(question),
    tags: question.tags,
    translations: question.translations ?? [],
    vocabulary: question.vocabulary ?? [],
  };
}

function part5FromFullTest(part: Extract<ReadingPartData, { part: 5 }>) {
  return {
    part: 5 as const,
    title: part.title,
    questions: part.items.map((item) =>
      importPart5QuestionFromTestData(item.question),
    ),
  };
}

function part6FromFullTest(part: Extract<ReadingPartData, { part: 6 }>) {
  return {
    part: 6 as const,
    title: part.title,
    passageSets: part.passageSets.map((set) => ({
      id: set.id,
      topic: set.topic,
      vocabulary: set.vocabulary ?? [],
      passages: set.passages.map((passage) => ({
        title: passage.title,
        content: passage.content,
      })),
      questions: set.questions.map((question) =>
        importPassageQuestionFromTestData(question),
      ),
    })),
  };
}

function part7FromFullTest(part: Extract<ReadingPartData, { part: 7 }>) {
  return {
    part: 7 as const,
    title: part.title,
    passageSets: part.passageSets.map((set) => ({
      id: set.id,
      topic: set.topic,
      vocabulary: set.vocabulary ?? [],
      passages: set.passages.map((passage) => ({
        title: passage.title,
        content: passage.content,
      })),
      questions: set.questions.map((question) =>
        importPassageQuestionFromTestData(question),
      ),
    })),
  };
}

export function readingImportFileFromFullTest(file: TestImportFile): ReadingImportFile {
  return {
    bookId: file.meta.bookId,
    testId: file.meta.testId,
    title: file.meta.title,
    parts: [
      part5FromFullTest(file.reading.part5),
      part6FromFullTest(file.reading.part6),
      part7FromFullTest(file.reading.part7),
    ],
  };
}
