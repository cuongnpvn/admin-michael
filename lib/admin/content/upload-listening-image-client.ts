import { linkAdminListeningImage } from "@/lib/admin/content/link-listening-image";
import { isEntranceTestBook } from "@/lib/content/catalog-ids";
import { canonicalListeningImageStoragePath } from "@/lib/content/listening-image-paths";
import { IMAGES_BUCKET } from "@/lib/content/media-storage-paths";
import { copy } from "@/lib/copy/vi";
import { createClient } from "@/lib/supabase/client";

type UploadInput = {
  bookId: string;
  testId: string;
  questionId: string;
  file: File;
} & (
  | { part: 1; globalItemNumber: number }
  | { part: 3 | 4; groupStartGlobalItemNumber: number }
);

export type UploadListeningImageResult =
  | { ok: true; publicUrl: string }
  | { ok: false; error: string };

export async function uploadListeningImageFromClient(
  input: UploadInput,
): Promise<UploadListeningImageResult> {
  if (!isEntranceTestBook(input.bookId)) {
    return { ok: false, error: copy.admin.cms.listeningImage.entranceOnly };
  }

  const pngName = input.file.name.toLowerCase().endsWith(".png");
  const pngType = !input.file.type || input.file.type === "image/png";
  if (!pngName || !pngType) {
    return { ok: false, error: copy.admin.cms.listeningImage.invalidType };
  }

  const storagePath = canonicalListeningImageStoragePath(imageStorageInput(input));
  const supabase = createClient();
  const { error: uploadError } = await supabase.storage
    .from(IMAGES_BUCKET)
    .upload(storagePath, input.file, {
      upsert: true,
      contentType: "image/png",
      cacheControl: "0",
    });

  if (uploadError) {
    return { ok: false, error: uploadError.message };
  }

  return linkAdminListeningImage(imageLinkInput(input, storagePath));
}

function imageStorageInput(input: UploadInput) {
  switch (input.part) {
    case 1:
      return {
        part: input.part,
        bookId: input.bookId,
        testId: input.testId,
        globalItemNumber: input.globalItemNumber,
      };
    case 3:
    case 4:
      return {
        part: input.part,
        bookId: input.bookId,
        testId: input.testId,
        groupStartGlobalItemNumber: input.groupStartGlobalItemNumber,
      };
  }
}

function imageLinkInput(input: UploadInput, storagePath: string) {
  switch (input.part) {
    case 1:
      return {
        bookId: input.bookId,
        testId: input.testId,
        part: input.part,
        questionId: input.questionId,
        storagePath,
      };
    case 3:
    case 4:
      return {
        bookId: input.bookId,
        testId: input.testId,
        part: input.part,
        questionId: input.questionId,
        storagePath,
      };
  }
}
