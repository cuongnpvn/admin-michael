import { isEntranceTestBook } from "@/lib/content/catalog-ids";
import { isListeningGroupWithStimulusImage } from "@/lib/content/listening-part-specs";
import {
  buildImageStoragePath,
  normalizeMediaStorageInput,
  type ImageExtension,
} from "@/lib/content/media-storage-paths";

/** Part 1 photograph image keyed by global TOEIC item number. */
export function buildListeningPart1ImagePath(
  bookId: string,
  testId: string,
  globalItemNumber: number,
  ext: ImageExtension = "png",
): string {
  return buildImageStoragePath(bookId, testId, String(globalItemNumber), ext);
}

export function resolveListeningPart1ImagePath(
  bookId: string,
  testId: string,
  globalItemNumber: number,
  explicitUrl?: string | null,
): string {
  if (explicitUrl?.trim()) {
    const parsed = normalizeMediaStorageInput(explicitUrl, "image");
    if (parsed) return parsed.storagePath;
  }
  return buildListeningPart1ImagePath(bookId, testId, globalItemNumber);
}

/** Parts 3–4 group stimulus image keyed by the group's first global TOEIC item number. */
export function buildListeningGroupStimulusImagePath(
  bookId: string,
  testId: string,
  groupStartGlobalItemNumber: number,
  ext: ImageExtension = "png",
): string {
  return buildImageStoragePath(
    bookId,
    testId,
    String(groupStartGlobalItemNumber),
    ext,
  );
}

export function resolveListeningGroupStimulusImagePath(
  bookId: string,
  testId: string,
  groupStartGlobalItemNumber: number,
  explicitUrl?: string | null,
): string {
  if (explicitUrl?.trim()) {
    const parsed = normalizeMediaStorageInput(explicitUrl, "image");
    if (parsed) return parsed.storagePath;
  }
  return buildListeningGroupStimulusImagePath(
    bookId,
    testId,
    groupStartGlobalItemNumber,
  );
}

/** Official graphic groups, plus entrance groups whose anchor question has an image. */
export function listeningGroupUsesStimulusImage(
  bookId: string,
  part: number,
  groupStart: number,
  imageUrl?: string | null,
): boolean {
  if (isListeningGroupWithStimulusImage(part, groupStart)) return true;
  return isEntranceTestBook(bookId) && Boolean(imageUrl?.trim());
}

/** Canonical photograph / graphic path: `{bookId}/{testId}/{number}.png`. */
export function canonicalListeningImageStoragePath(
  input:
    | {
        part: 1;
        bookId: string;
        testId: string;
        globalItemNumber: number;
      }
    | {
        part: 3 | 4;
        bookId: string;
        testId: string;
        groupStartGlobalItemNumber: number;
      },
): string {
  switch (input.part) {
    case 1:
      return buildListeningPart1ImagePath(
        input.bookId,
        input.testId,
        input.globalItemNumber,
        "png",
      );
    case 3:
    case 4:
      return buildListeningGroupStimulusImagePath(
        input.bookId,
        input.testId,
        input.groupStartGlobalItemNumber,
        "png",
      );
  }
}
