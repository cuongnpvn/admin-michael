import type { AdminInstructionId } from "@/lib/admin/instructions/catalog";

export interface ReadingPart7SegmentSpec {
  id: AdminInstructionId;
  globalFirst: number;
  globalLast: number;
  questions: number;
  passagesPerSet: { min: number; max: number };
}

export const READING_PART7_SINGLE_SEGMENT: ReadingPart7SegmentSpec = {
  id: "reading-part-7-single",
  globalFirst: 147,
  globalLast: 175,
  questions: 29,
  passagesPerSet: { min: 1, max: 1 },
};

export const READING_PART7_MULTI_SEGMENT: ReadingPart7SegmentSpec = {
  id: "reading-part-7-multi",
  globalFirst: 176,
  globalLast: 200,
  questions: 25,
  passagesPerSet: { min: 2, max: 3 },
};

export const READING_PART7_EXTRACT_SEGMENTS = [
  READING_PART7_SINGLE_SEGMENT,
  READING_PART7_MULTI_SEGMENT,
] as const;

export const READING_PART7_SEGMENT_IDS = READING_PART7_EXTRACT_SEGMENTS.map(
  (segment) => segment.id,
);

export function isReadingPart7SegmentId(
  value: string,
): value is (typeof READING_PART7_SEGMENT_IDS)[number] {
  return READING_PART7_SEGMENT_IDS.includes(
    value as (typeof READING_PART7_SEGMENT_IDS)[number],
  );
}

export function readingPart7SegmentById(
  id: AdminInstructionId,
): ReadingPart7SegmentSpec | undefined {
  return READING_PART7_EXTRACT_SEGMENTS.find((segment) => segment.id === id);
}
