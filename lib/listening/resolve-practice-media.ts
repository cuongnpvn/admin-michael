import {
  buildListeningGroupRangeAudioPath,
  buildListeningOptionAudioPath,
  buildListeningQuestionStemAudioPath,
  buildListeningWholeAudioPath,
  groupGlobalRange,
} from "@/lib/content/listening-audio-paths";
import { buildListeningPart1ImagePath } from "@/lib/content/listening-image-paths";
import {
  buildPublicAssetUrlForBucket,
  IMAGES_BUCKET,
  publicTestAssetUrl,
} from "@/lib/content/media-storage-paths";

/** Part 1 photograph: `images/{bookId}/{testId}/{globalNumber}.png`. */
export function resolvePracticePart1ImageUrl(
  bookId: string,
  testId: string,
  globalNumber: number,
): string | null {
  const storagePath = buildListeningPart1ImagePath(bookId, testId, globalNumber);
  return buildPublicAssetUrlForBucket(IMAGES_BUCKET, storagePath);
}

/** Whole question + answer audio: `audios/{bookId}/{testId}/{globalNumber}.mp3`. */
export function resolvePracticeWholeAudioUrl(
  bookId: string,
  testId: string,
  globalNumber: number,
): string | null {
  return publicTestAssetUrl(
    buildListeningWholeAudioPath(bookId, testId, globalNumber),
    "audio",
  );
}

/** Part 2 question stem only: `audios/{bookId}/{testId}/{globalNumber}-question.mp3`. */
export function resolvePracticeQuestionStemAudioUrl(
  bookId: string,
  testId: string,
  globalNumber: number,
): string | null {
  return publicTestAssetUrl(
    buildListeningQuestionStemAudioPath(bookId, testId, globalNumber),
    "audio",
  );
}

/** Part 2 per-option audio: `audios/{bookId}/{testId}/{globalNumber}-{label}.mp3`. */
export function resolvePracticeOptionAudioUrl(
  bookId: string,
  testId: string,
  globalNumber: number,
  label: string,
): string | null {
  return publicTestAssetUrl(
    buildListeningOptionAudioPath(bookId, testId, globalNumber, label),
    "audio",
  );
}

/** Parts 3–4 group stimulus: `audios/{bookId}/{testId}/{start}-{end}.mp3`. */
export function resolvePracticeGroupAudioUrl(
  bookId: string,
  testId: string,
  startGlobal: number,
  endGlobal: number,
): string | null {
  return publicTestAssetUrl(
    buildListeningGroupRangeAudioPath(bookId, testId, startGlobal, endGlobal),
    "audio",
  );
}

/**
 * Resolves listening practice audio from predictable storage paths (same layout as exam).
 * - Parts 1–2: `{globalItemNumber}.mp3`
 * - Parts 3–4: `{start}-{end}.mp3` when `groupGlobalNumbers` is provided
 */
export function resolvePracticeListeningAudioUrl(input: {
  bookId: string;
  testId: string;
  globalItemNumber: number;
  groupGlobalNumbers?: number[];
}): string | null {
  const { bookId, testId, globalItemNumber, groupGlobalNumbers } = input;

  if (groupGlobalNumbers && groupGlobalNumbers.length > 0) {
    const range = groupGlobalRange(groupGlobalNumbers);
    if (!range) return null;
    return resolvePracticeGroupAudioUrl(
      bookId,
      testId,
      range.start,
      range.end,
    );
  }

  return resolvePracticeWholeAudioUrl(bookId, testId, globalItemNumber);
}
