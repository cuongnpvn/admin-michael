"use server";

import { revalidatePath } from "next/cache";
import {
  AdminAccessError,
  requireAdminSession,
} from "@/lib/admin/auth/require-admin";
import { MAX_PDF_BYTES } from "@/lib/admin/gemini/constants";
import {
  applyLectureExtractFromPdf,
  nextLectureSortOrder,
  uniqueLectureSlug,
} from "@/lib/admin/lectures/apply-lecture-extract";
import { copy } from "@/lib/copy/vi";
import {
  adminLectureCollectionPath,
  adminLectureEditorPath,
  adminLecturesPath,
} from "@/lib/lectures/paths";
import type { AdminLectureActionResult } from "@/lib/admin/lectures/collection-actions";

function accessError(code: string): string {
  if (code === "not_signed_in") return copy.admin.lectures.errors.notSignedIn;
  if (code === "not_admin") return copy.admin.lectures.errors.notAdmin;
  return copy.admin.lectures.errors.generic;
}

function parsePdfFile(value: FormDataEntryValue | null): File | string {
  if (!(value instanceof File) || value.size === 0) {
    return copy.admin.lectures.errors.pdfRequired;
  }
  const isPdf =
    value.type === "application/pdf" || value.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) return copy.admin.lectures.errors.pdfInvalidType;
  if (value.size > MAX_PDF_BYTES) return copy.admin.lectures.errors.pdfTooLarge;
  return value;
}

function revalidateLectureAdmin(collectionId: string, lectureId: string) {
  revalidatePath(adminLecturesPath());
  revalidatePath(adminLectureCollectionPath(collectionId));
  revalidatePath(adminLectureEditorPath(collectionId, lectureId));
}

export async function uploadLecturePdf(
  collectionId: string,
  formData: FormData,
  lectureId?: string,
): Promise<AdminLectureActionResult> {
  try {
    const parsed = parsePdfFile(formData.get("pdf"));
    if (typeof parsed === "string") return { ok: false, error: parsed };

    const { supabase } = await requireAdminSession();
    const pdfBytes = Buffer.from(await parsed.arrayBuffer());

    let targetLectureId = lectureId;
    if (targetLectureId) {
      const { data: existing, error: existingError } = await supabase
        .from("lectures")
        .select("id")
        .eq("id", targetLectureId)
        .eq("collection_id", collectionId)
        .maybeSingle();

      if (existingError) return { ok: false, error: existingError.message };
      if (!existing) return { ok: false, error: copy.admin.lectures.errors.generic };
    } else {
      const placeholder =
        parsed.name.replace(/\.pdf$/i, "").trim() || "Bài giảng mới";
      const slug = await uniqueLectureSlug(supabase, collectionId, placeholder);
      const sortOrder = await nextLectureSortOrder(supabase, collectionId);
      const { data: created, error: createError } = await supabase
        .from("lectures")
        .insert({
          collection_id: collectionId,
          slug,
          title: placeholder,
          sort_order: sortOrder,
          extract_status: "extracting",
        })
        .select("id")
        .single();

      if (createError || !created) {
        return {
          ok: false,
          error: createError?.message ?? copy.admin.lectures.errors.generic,
        };
      }
      targetLectureId = created.id as string;
    }

    await supabase
      .from("lectures")
      .update({ extract_status: "extracting", extract_error: null })
      .eq("id", targetLectureId);

    const extract = await applyLectureExtractFromPdf(supabase, {
      lectureId: targetLectureId,
      collectionId,
      pdfBytes,
    });

    revalidateLectureAdmin(collectionId, targetLectureId);
    if (!extract.ok) return extract;
    return { ok: true, collectionId, lectureId: targetLectureId };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }
    return { ok: false, error: copy.admin.lectures.errors.generic };
  }
}
