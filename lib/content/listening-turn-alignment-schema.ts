import { z } from "zod";
import {
  normalizeTurnEnglish,
  type SpeakerTurn,
} from "@/lib/listening/speaker-turns";
import type { TranscriptSegment } from "@/lib/listening/transcript-segments";

export const listeningTurnAlignmentSegmentSchema = z.object({
  index: z.number().int().nonnegative(),
  english: z.string().min(1),
  startSec: z.number().finite(),
  endSec: z.number().finite(),
});

export const listeningTurnAlignmentResponseSchema = z.object({
  questionId: z.string().min(1),
  segments: z.array(listeningTurnAlignmentSegmentSchema).min(1),
});

export type ListeningTurnAlignmentResponse = z.infer<
  typeof listeningTurnAlignmentResponseSchema
>;

function assertSegmentTimesDoNotOverlap(
  segments: Array<{ index: number; startSec: number; endSec: number }>,
): void {
  for (const [offset, segment] of segments.entries()) {
    if (segment.startSec < 0 || segment.endSec <= segment.startSec) {
      throw new Error(
        `Turn alignment times invalid at index ${segment.index}: ${segment.startSec}–${segment.endSec}.`,
      );
    }

    const previous = segments[offset - 1];
    if (previous && previous.endSec > segment.startSec) {
      throw new Error(
        `Turn alignment overlap at index ${segment.index}: previous end ${previous.endSec} > start ${segment.startSec}.`,
      );
    }
  }
}

function roundTurnSeconds(value: number): number {
  return Math.round(value * 100) / 100;
}

export function assertTranscriptSegmentsValid(
  segments: TranscriptSegment[],
): TranscriptSegment[] {
  if (segments.length === 0) {
    throw new Error("Turn alignment segments empty.");
  }

  const byIndex = [...segments].sort((left, right) => left.index - right.index);
  const normalized: TranscriptSegment[] = [];

  for (const [offset, segment] of byIndex.entries()) {
    const english = segment.english.trim();
    if (!english) {
      throw new Error(
        `Turn alignment english empty at index ${segment.index}.`,
      );
    }
    if (segment.index !== offset) {
      throw new Error(
        `Turn alignment index mismatch at ${offset}: got ${segment.index}.`,
      );
    }

    normalized.push({
      index: segment.index,
      english,
      startSec: roundTurnSeconds(segment.startSec),
      endSec: roundTurnSeconds(segment.endSec),
    });
  }

  assertSegmentTimesDoNotOverlap(normalized);
  return normalized;
}

export function assertAlignedSegmentsMatchTurns(
  expectedQuestionId: string,
  turns: SpeakerTurn[],
  response: ListeningTurnAlignmentResponse,
): TranscriptSegment[] {
  if (response.questionId !== expectedQuestionId) {
    throw new Error(
      `Turn alignment questionId mismatch: expected ${expectedQuestionId}, got ${response.questionId}.`,
    );
  }

  if (response.segments.length !== turns.length) {
    throw new Error(
      `Turn alignment count mismatch: expected ${turns.length} turns, got ${response.segments.length} segments.`,
    );
  }

  const byIndex = [...response.segments].sort(
    (left, right) => left.index - right.index,
  );

  const segments: TranscriptSegment[] = [];

  for (const [offset, turn] of turns.entries()) {
    const segment = byIndex[offset];
    if (!segment || segment.index !== turn.index) {
      throw new Error(
        `Turn alignment index mismatch at ${turn.index}: got ${segment?.index ?? "missing"}.`,
      );
    }

    if (normalizeTurnEnglish(segment.english) !== normalizeTurnEnglish(turn.english)) {
      throw new Error(
        `Turn alignment english mismatch at index ${turn.index}.`,
      );
    }

    segments.push({
      index: turn.index,
      english: turn.english,
      startSec: segment.startSec,
      endSec: segment.endSec,
    });
  }

  return assertTranscriptSegmentsValid(segments);
}
