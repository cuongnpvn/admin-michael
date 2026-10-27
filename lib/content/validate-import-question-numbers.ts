import { enforceOfficialQuestionNumberQa } from "@/lib/content/catalog-ids";
import {
  toeicPartFromGlobalItemNumber,
  toeicPartGlobalItemRange,
} from "@/lib/content/toeic-global-item-number";

export interface ValidateImportQuestionNumbersInput {
  part: number;
  globalItemNumber: number;
  /** Slug or id for error messages */
  label?: string;
  /** When set, entrance-test books skip the official 1–200 part range. */
  bookId?: string;
}

function errorPrefix(label?: string): string {
  return label ? `Question ${label}: ` : "";
}

/**
 * Validates official booklet number from Gemini/PDF output.
 * No inference — globalItemNumber must be present and in the part's range.
 */
export function validateImportQuestionNumber(
  input: ValidateImportQuestionNumbersInput,
): number {
  const prefix = errorPrefix(input.label);
  const { part, globalItemNumber } = input;

  if (!Number.isInteger(globalItemNumber) || globalItemNumber < 1) {
    throw new Error(`${prefix}invalid globalItemNumber: ${globalItemNumber}`);
  }

  if (input.bookId && !enforceOfficialQuestionNumberQa(input.bookId)) {
    return globalItemNumber;
  }

  const range = toeicPartGlobalItemRange(part);
  if (globalItemNumber < range.first || globalItemNumber > range.last) {
    throw new Error(
      `${prefix}globalItemNumber ${globalItemNumber} must be ${range.first}–${range.last} for part ${part}`,
    );
  }

  const mapped = toeicPartFromGlobalItemNumber(globalItemNumber);
  if (mapped.part !== part) {
    throw new Error(
      `${prefix}globalItemNumber ${globalItemNumber} belongs to part ${mapped.part}, not part ${part}`,
    );
  }

  return globalItemNumber;
}

export function assertUniqueGlobalItemNumbers(
  questions: Array<{ globalItemNumber?: number; slug?: string; part: number }>,
): { min: number; max: number } {
  const globals = new Set<number>();
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (const question of questions) {
    const global = question.globalItemNumber;
    if (global == null || !Number.isInteger(global) || global < 1) {
      throw new Error(
        `Missing globalItemNumber on part ${question.part} question ${question.slug ?? "(unknown)"}`,
      );
    }
    if (globals.has(global)) {
      throw new Error(`Duplicate globalItemNumber: ${global}`);
    }
    globals.add(global);
    min = Math.min(min, global);
    max = Math.max(max, global);
  }

  if (globals.size === 0) {
    throw new Error("No questions to validate");
  }

  return { min, max };
}
