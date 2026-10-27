"use server";

import { revalidatePath, updateTag } from "next/cache";
import {
  AdminAccessError,
  requireAdminSession,
} from "@/lib/admin/auth/require-admin";
import {
  VOCABULARY_IMAGE_MAX_BYTES,
  VOCABULARY_IMAGE_MIME_TYPES,
} from "@/lib/admin/vocabulary/constants";
import {
  assertAdminOwnedDeck,
  extensionFromVocabImageFile,
  isVocabularyItemId,
  listItemImagePath,
  removeVocabImageObjects,
} from "@/lib/admin/vocabulary/vocab-image-storage";
import {
  IMAGES_BUCKET,
  buildPublicAssetUrlForBucket,
  buildVocabItemImagePath,
} from "@/lib/content/media-storage-paths";
import { copy } from "@/lib/copy/vi";

export type VocabularyItemImageResult =
  | { ok: true; imageUrl: string | null }
  | { ok: false; error: string };

function accessErrorMessage(code: string): string {
  if (code === "not_signed_in") {
    return copy.admin.vocabularyImport.errors.notSignedIn;
  }
  if (code === "not_admin") {
    return copy.admin.vocabularyImport.errors.notAdmin;
  }
  return copy.admin.vocabularyImport.errors.generic;
}

function revalidateVocabularyPaths(deckId: string): void {
  updateTag("vocabulary-catalog");
  revalidatePath("/admin");
  revalidatePath("/admin/vocab");
  revalidatePath(`/admin/vocab/${deckId}`);
}

function validateImageFile(file: FormDataEntryValue | null): File | string {
  if (!(file instanceof File) || file.size === 0) {
    return copy.admin.vocabulary.errors.imageMissing;
  }

  const extension = extensionFromVocabImageFile(file);
  if (
    !extension ||
    (file.type && !VOCABULARY_IMAGE_MIME_TYPES.has(file.type))
  ) {
    return copy.admin.vocabulary.errors.imageInvalidType;
  }

  if (file.size > VOCABULARY_IMAGE_MAX_BYTES) {
    return copy.admin.vocabulary.errors.imageTooLarge;
  }

  return file;
}

export async function uploadVocabularyItemImage(
  itemId: string,
  deckId: string,
  formData: FormData,
): Promise<VocabularyItemImageResult> {
  try {
    const { supabase } = await requireAdminSession();

    if (!isVocabularyItemId(itemId)) {
      return { ok: false, error: copy.admin.vocabulary.errors.imageUploadFailed };
    }

    const deck = await assertAdminOwnedDeck(supabase, deckId);
    if (!deck.ok) {
      return {
        ok: false,
        error:
          deck.reason === "not_common"
            ? copy.admin.vocabulary.errors.imageNotCommonDeck
            : copy.admin.vocabManage.errors.generic,
      };
    }

    const file = validateImageFile(formData.get("file"));
    if (typeof file === "string") {
      return { ok: false, error: file };
    }

    const extension = extensionFromVocabImageFile(file);
    if (!extension) {
      return { ok: false, error: copy.admin.vocabulary.errors.imageInvalidType };
    }

    const previousPath = await listItemImagePath(supabase, itemId, deckId);
    const storagePath = buildVocabItemImagePath(itemId, extension);
    const contentType =
      file.type && VOCABULARY_IMAGE_MIME_TYPES.has(file.type)
        ? file.type
        : `image/${extension === "jpg" ? "jpeg" : extension}`;

    const { error: uploadError } = await supabase.storage
      .from(IMAGES_BUCKET)
      .upload(storagePath, file, {
        upsert: true,
        contentType,
      });

    if (uploadError) throw uploadError;

    const { error: updateError } = await supabase
      .from("vocabulary_items")
      .update({ image_path: storagePath })
      .eq("id", itemId)
      .eq("deck_id", deckId);

    if (updateError) throw updateError;

    if (previousPath && previousPath !== storagePath) {
      await removeVocabImageObjects(supabase, [previousPath]).catch(() => undefined);
    }

    revalidateVocabularyPaths(deckId);

    return {
      ok: true,
      imageUrl: buildPublicAssetUrlForBucket(IMAGES_BUCKET, storagePath),
    };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessErrorMessage(error.message) };
    }
    const message =
      error instanceof Error
        ? error.message
        : copy.admin.vocabulary.errors.imageUploadFailed;
    return { ok: false, error: message };
  }
}

export async function deleteVocabularyItemImage(
  itemId: string,
  deckId: string,
): Promise<VocabularyItemImageResult> {
  try {
    const { supabase } = await requireAdminSession();

    const deck = await assertAdminOwnedDeck(supabase, deckId);
    if (!deck.ok) {
      return {
        ok: false,
        error:
          deck.reason === "not_common"
            ? copy.admin.vocabulary.errors.imageNotCommonDeck
            : copy.admin.vocabManage.errors.generic,
      };
    }

    const previousPath = await listItemImagePath(supabase, itemId, deckId);

    const { error } = await supabase
      .from("vocabulary_items")
      .update({ image_path: null })
      .eq("id", itemId)
      .eq("deck_id", deckId);

    if (error) throw error;

    if (previousPath) {
      await removeVocabImageObjects(supabase, [previousPath]).catch(() => undefined);
    }

    revalidateVocabularyPaths(deckId);
    return { ok: true, imageUrl: null };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessErrorMessage(error.message) };
    }
    const message =
      error instanceof Error
        ? error.message
        : copy.admin.vocabulary.errors.imageUploadFailed;
    return { ok: false, error: message };
  }
}
