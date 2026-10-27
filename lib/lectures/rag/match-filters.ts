export const LECTURE_CHUNK_SOURCE_KINDS = [
  "overview",
  "section",
  "exercise",
] as const;

export type LectureChunkSourceKind = (typeof LECTURE_CHUNK_SOURCE_KINDS)[number];

export const DEFAULT_MATCH_COUNT = 8;
export const MIN_MATCH_COUNT = 1;
export const MAX_MATCH_COUNT = 24;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type MatchLectureChunkFilters = {
  lectureId: string | null;
  collectionId: string | null;
  sourceKinds: LectureChunkSourceKind[] | null;
  matchCount: number;
};

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function isLectureChunkSourceKind(
  value: string,
): value is LectureChunkSourceKind {
  return (LECTURE_CHUNK_SOURCE_KINDS as readonly string[]).includes(value);
}

function optionalUuid(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return isUuid(trimmed) ? trimmed : null;
}

export function parseMatchLectureChunkFilters(input: {
  lectureId?: string | null;
  collectionId?: string | null;
  sourceKinds?: string[] | null;
  matchCount?: number;
}): MatchLectureChunkFilters {
  const kinds = (input.sourceKinds ?? []).filter(isLectureChunkSourceKind);
  const rawCount = input.matchCount;
  const matchCount =
    typeof rawCount === "number" && Number.isFinite(rawCount)
      ? Math.min(MAX_MATCH_COUNT, Math.max(MIN_MATCH_COUNT, Math.floor(rawCount)))
      : DEFAULT_MATCH_COUNT;

  return {
    lectureId: optionalUuid(input.lectureId),
    collectionId: optionalUuid(input.collectionId),
    sourceKinds: kinds.length > 0 ? kinds : null,
    matchCount,
  };
}
