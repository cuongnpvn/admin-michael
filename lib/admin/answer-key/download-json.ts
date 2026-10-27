import type { AnswerKeyFile } from "@/lib/admin/answer-key/schema";

export const answerKeyListeningTemplate = {
  bookId: "BOOK_ID",
  testId: "TEST_ID",
  answers: {
    "1": "A",
    "2": "B",
    "7": "A",
    "32": "C",
    "71": "D",
    "100": "B",
  },
} as const;

export const answerKeyReadingTemplate = {
  bookId: "BOOK_ID",
  testId: "TEST_ID",
  answers: {
    "101": "A",
    "102": "C",
    "131": "B",
    "147": "D",
    "200": "A",
  },
} as const;

export function serializeAnswerKeyForDownload(file: AnswerKeyFile): string {
  const answers: Record<string, string> = {};

  for (const part of file.parts) {
    for (const [number, label] of Object.entries(part.answers)) {
      answers[String(number)] = label;
    }
  }

  const sortedAnswers = Object.fromEntries(
    Object.entries(answers).sort(
      ([left], [right]) => Number.parseInt(left, 10) - Number.parseInt(right, 10),
    ),
  );

  return `${JSON.stringify(
    {
      bookId: file.bookId,
      testId: file.testId,
      answers: sortedAnswers,
    },
    null,
    2,
  )}\n`;
}

export function answerKeyDownloadFilename(
  bookId: string,
  testId: string,
  suffix = "answer-key",
): string {
  const safeBook = bookId.replace(/[^\w.-]+/g, "-");
  const safeTest = testId.replace(/[^\w.-]+/g, "-");
  return `${safeBook}-${safeTest}-${suffix}.json`;
}

export function downloadJsonFile(json: string, filename: string) {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
