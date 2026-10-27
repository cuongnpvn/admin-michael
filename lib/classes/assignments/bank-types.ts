import type { AssignmentOptionLabel } from "@/lib/classes/assignments/types";
import type { QuestionExplanation } from "@/lib/content/question-explanation";

export const PART1_QUESTION_NUMBERS = [1, 2, 3, 4, 5, 6] as const;

export const PART5_QUESTION_NUMBERS = Array.from(
  { length: 30 },
  (_, index) => 101 + index,
);

export interface AssignmentBankBook {
  id: string;
  name: string;
}

export interface AssignmentBankTest {
  id: string;
  label: string;
}

export interface AssignmentBankCatalog {
  books: AssignmentBankBook[];
  testsByBookId: Record<string, AssignmentBankTest[]>;
}

export interface AssignmentBankPreviewOption {
  label: AssignmentOptionLabel;
  text: string;
}

export interface AssignmentBankPreview {
  bookId: string;
  testId: string;
  globalItemNumber: number;
  stem: string;
  options: AssignmentBankPreviewOption[];
  correctLabel: AssignmentOptionLabel;
  explanation: QuestionExplanation | null;
}
