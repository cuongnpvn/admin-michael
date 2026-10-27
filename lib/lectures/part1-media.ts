import {
  resolvePracticePart1ImageUrl,
  resolvePracticeWholeAudioUrl,
} from "@/lib/listening/resolve-practice-media";
import type { LectureQuestionPayload } from "@/lib/lectures/exercise";

/** Rebuild a Part 1 photograph and spoken item from the saved bank keys. */
export function lecturePart1Media(payload: LectureQuestionPayload): {
  imageUrl: string | null;
  audioUrl: string | null;
} {
  if (
    payload.part !== "1" ||
    !payload.bankBookId ||
    !payload.bankTestId ||
    payload.bankItemNumber == null
  ) {
    return { imageUrl: null, audioUrl: null };
  }
  return {
    imageUrl: resolvePracticePart1ImageUrl(
      payload.bankBookId,
      payload.bankTestId,
      payload.bankItemNumber,
    ),
    audioUrl: resolvePracticeWholeAudioUrl(
      payload.bankBookId,
      payload.bankTestId,
      payload.bankItemNumber,
    ),
  };
}
