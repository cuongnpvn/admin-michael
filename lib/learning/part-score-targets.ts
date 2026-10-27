import { TOEIC_PART_QUESTION_COUNTS } from "@/lib/content/toeic-global-item-number";
import {
  scaleToToeicScore,
  type ToeicExamSection,
} from "@/lib/exam/toeic-score-conversion";

export type ToeicScoreTarget = 600 | 700 | 800;

export const TOEIC_SCORE_TARGETS: ToeicScoreTarget[] = [600, 700, 800];

export const PART_SCORE_TARGETS: Record<
  ToeicScoreTarget,
  Record<1 | 2 | 3 | 4 | 5 | 6 | 7, number>
> = {
  600: { 1: 4, 2: 18, 3: 24, 4: 19, 5: 20, 6: 10, 7: 30 },
  700: { 1: 5, 2: 20, 3: 28, 4: 22, 5: 24, 6: 10, 7: 31 },
  800: { 1: 5, 2: 20, 3: 34, 4: 24, 5: 26, 6: 13, 7: 42 },
};

export const PART_NUMBERS = [1, 2, 3, 4, 5, 6, 7] as const;

export type PartNumber = (typeof PART_NUMBERS)[number];

export function partTargetAccuracyPercent(
  target: ToeicScoreTarget,
  part: PartNumber,
): number {
  const correct = PART_SCORE_TARGETS[target][part];
  const max = TOEIC_PART_QUESTION_COUNTS[part];
  return (correct / max) * 100;
}

export function partAccuracyPercent(
  correct: number,
  part: PartNumber,
): number {
  const max = TOEIC_PART_QUESTION_COUNTS[part];
  return (correct / max) * 100;
}

function sectionForPart(part: PartNumber): ToeicExamSection {
  return part <= 4 ? "listening" : "reading";
}

function sectionCorrectBeforePart(
  target: ToeicScoreTarget,
  part: PartNumber,
): number {
  const parts = part <= 4 ? ([1, 2, 3, 4] as const) : ([5, 6, 7] as const);
  let total = 0;

  for (const current of parts) {
    if (current >= part) break;
    total += PART_SCORE_TARGETS[target][current];
  }

  return total;
}

/** Marginal scaled points this part contributes toward its section score. */
export function partTargetScaledScore(
  target: ToeicScoreTarget,
  part: PartNumber,
): number {
  const section = sectionForPart(part);
  const before = sectionCorrectBeforePart(target, part);
  const after = before + PART_SCORE_TARGETS[target][part];

  return (
    scaleToToeicScore(after, 100, section) -
    scaleToToeicScore(before, 100, section)
  );
}

/**
 * Approximate scaled TOEIC points for a part's raw correct count.
 * Uses the section conversion table from a zero baseline so the same
 * correct count always maps to the same scaled value (multiples of 5).
 */
export function partCorrectToScaledScore(
  correct: number,
  part: PartNumber,
): number {
  const section = sectionForPart(part);
  return (
    scaleToToeicScore(correct, 100, section) -
    scaleToToeicScore(0, 100, section)
  );
}
