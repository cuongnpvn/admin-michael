"use server";

import { randomUUID } from "node:crypto";
import {
  AdminAccessError,
  requireAdminSession,
} from "@/lib/admin/auth/require-admin";
import {
  VOCABULARY_IMAGE_MAX_BYTES,
  VOCABULARY_IMAGE_MIME_TYPES,
} from "@/lib/admin/vocabulary/constants";
import { extensionFromVocabImageFile } from "@/lib/admin/vocabulary/vocab-image-storage";
import {
  IMAGES_BUCKET,
  buildPublicAssetUrlForBucket,
  type ImageExtension,
} from "@/lib/content/media-storage-paths";
import { copy } from "@/lib/copy/vi";

export type UploadLectureImageResult =
  | { ok: true; imageUrl: string }
  | { ok: false; error: string };

const LECTURE_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function accessErrorMessage(code: string): string {
  if (code === "not_signed_in") return copy.admin.lectures.errors.notSignedIn;
  if (code === "not_admin") return copy.admin.lectures.errors.notAdmin;
  return copy.admin.lectures.errors.generic;
}

export async function uploadLectureImage(
  lectureId: string,
  formData: FormData,
): Promise<UploadLectureImageResult> {
  try {
    const { supabase } = await requireAdminSession();
    if (!LECTURE_ID_RE.test(lectureId)) {
      return { ok: false, error: copy.admin.lectures.errors.generic };
    }

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: copy.admin.lectures.errors.imageMissing };
    }
    const extension = extensionFromVocabImageFile(file);
    if (
      !extension ||
      (file.type && !VOCABULARY_IMAGE_MIME_TYPES.has(file.type))
    ) {
      return { ok: false, error: copy.admin.lectures.errors.imageInvalidType };
    }
    if (file.size > VOCABULARY_IMAGE_MAX_BYTES) {
      return { ok: false, error: copy.admin.lectures.errors.imageTooLarge };
    }

    const { data: lecture, error: lectureError } = await supabase
      .from("lectures")
      .select("id")
      .eq("id", lectureId)
      .maybeSingle();
    if (lectureError) throw lectureError;
    if (!lecture) return { ok: false, error: copy.admin.lectures.errors.generic };

    const storagePath = lectureImagePath(lectureId, extension);
    const contentType =
      file.type && VOCABULARY_IMAGE_MIME_TYPES.has(file.type)
        ? file.type
        : `image/${extension === "jpg" ? "jpeg" : extension}`;
    const { error: uploadError } = await supabase.storage
      .from(IMAGES_BUCKET)
      .upload(storagePath, file, { contentType });
    if (uploadError) throw uploadError;

    const imageUrl = buildPublicAssetUrlForBucket(IMAGES_BUCKET, storagePath);
    if (!imageUrl) return { ok: false, error: copy.admin.lectures.errors.generic };
    return { ok: true, imageUrl };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessErrorMessage(error.message) };
    }
    return { ok: false, error: copy.admin.lectures.errors.imageUploadFailed };
  }
}

function lectureImagePath(lectureId: string, extension: ImageExtension): string {
  const normalized = extension === "jpeg" ? "jpg" : extension;
  return `lectures/${lectureId}/${randomUUID()}.${normalized}`;
}
