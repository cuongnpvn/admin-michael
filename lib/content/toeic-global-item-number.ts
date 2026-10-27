/** First global TOEIC item number for each part (official numbering). */
const PART_GLOBAL_START: Record<number, number> = {
  1: 1,
  2: 7,
  3: 32,
  4: 71,
  5: 101,
  6: 131,
  7: 147,
};

/** Expected question count per part on a standard full test. */
export const TOEIC_PART_QUESTION_COUNTS: Record<number, number> = {
  1: 6,
  2: 25,
  3: 39,
  4: 30,
  5: 30,
  6: 16,
  7: 54,
};

export const TOEIC_READING_GLOBAL_MIN = 101;
export const TOEIC_READING_GLOBAL_MAX = 200;

export function toeicPartFromGlobalItemNumber(globalItemNumber: number): {
  part: number;
} {
  if (globalItemNumber < 1 || globalItemNumber > 200) {
    throw new Error(`Invalid global item number: ${globalItemNumber}`);
  }

  const parts = [7, 6, 5, 4, 3, 2, 1] as const;
  for (const part of parts) {
    const start = PART_GLOBAL_START[part];
    const count = TOEIC_PART_QUESTION_COUNTS[part];
    if (globalItemNumber >= start && globalItemNumber < start + count) {
      return { part };
    }
  }

  throw new Error(`Global item number does not map to a part: ${globalItemNumber}`);
}

export function isReadingGlobalItemNumber(globalItemNumber: number): boolean {
  return (
    globalItemNumber >= TOEIC_READING_GLOBAL_MIN &&
    globalItemNumber <= TOEIC_READING_GLOBAL_MAX
  );
}

/** Inclusive global range for a part on a standard full test. */
export function toeicPartGlobalItemRange(part: number): {
  first: number;
  last: number;
} {
  const start = PART_GLOBAL_START[part];
  const count = TOEIC_PART_QUESTION_COUNTS[part];
  if (start === undefined || count === undefined) {
    throw new Error(`Invalid TOEIC part: ${part}`);
  }
  return { first: start, last: start + count - 1 };
}
