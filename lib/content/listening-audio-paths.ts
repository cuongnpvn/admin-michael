import { buildAudioStoragePath } from "@/lib/content/media-storage-paths";

/** Whole question + all answer options audio track. */
export function buildListeningWholeAudioPath(
  bookId: string,
  testId: string,
  globalItemNumber: number,
): string {
  return buildAudioStoragePath(bookId, testId, String(globalItemNumber));
}

/** Question stem only (no answer options). */
export function buildListeningQuestionStemAudioPath(
  bookId: string,
  testId: string,
  globalItemNumber: number,
): string {
  return buildAudioStoragePath(
    bookId,
    testId,
    `${globalItemNumber}-question`,
  );
}

/** Per-option labeled audio (A–D). */
export function buildListeningOptionAudioPath(
  bookId: string,
  testId: string,
  globalItemNumber: number,
  label: string,
): string {
  return buildAudioStoragePath(
    bookId,
    testId,
    `${globalItemNumber}-${label.toLowerCase()}`,
  );
}

/** Parts 3–4 shared group stimulus audio spanning a question range. */
export function buildListeningGroupRangeAudioPath(
  bookId: string,
  testId: string,
  startGlobal: number,
  endGlobal: number,
): string {
  const slug =
    startGlobal === endGlobal
      ? String(startGlobal)
      : `${startGlobal}-${endGlobal}`;
  return buildAudioStoragePath(bookId, testId, slug);
}

export function groupGlobalRange(
  globalItemNumbers: number[],
): { start: number; end: number } | null {
  if (globalItemNumbers.length === 0) return null;
  const start = Math.min(...globalItemNumbers);
  const end = Math.max(...globalItemNumbers);
  return { start, end };
}

/**
 * Playback object path inside the audios bucket.
 * Parts 1–2: `{bookId}/{testId}/{globalItemNumber}.mp3`
 * Parts 3–4: `{bookId}/{testId}/{start}-{end}.mp3`
 */
export function canonicalListeningPlaybackStoragePath(input: {
  bookId: string;
  testId: string;
  part: 1 | 2 | 3 | 4;
  globalItemNumber?: number;
  groupGlobalNumbers?: number[];
}): string | null {
  if (input.part === 3 || input.part === 4) {
    const range = groupGlobalRange(input.groupGlobalNumbers ?? []);
    if (!range) return null;
    return buildListeningGroupRangeAudioPath(
      input.bookId,
      input.testId,
      range.start,
      range.end,
    );
  }

  if (!input.globalItemNumber || input.globalItemNumber < 1) return null;
  return buildListeningWholeAudioPath(
    input.bookId,
    input.testId,
    input.globalItemNumber,
  );
}
