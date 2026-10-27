"use server";

import { revalidatePath } from "next/cache";
import {
  AdminAccessError,
  requireAdminSession,
} from "@/lib/admin/auth/require-admin";
import type { AdminLectureActionResult } from "@/lib/admin/lectures/collection-actions";
import { copy } from "@/lib/copy/vi";
import {
  adminLectureCollectionPath,
  adminLecturesPath,
} from "@/lib/lectures/paths";

function accessError(code: string): string {
  if (code === "not_signed_in") return copy.admin.lectures.errors.notSignedIn;
  if (code === "not_admin") return copy.admin.lectures.errors.notAdmin;
  return copy.admin.lectures.errors.generic;
}

export async function reorderAdminLectures(
  collectionId: string,
  orderedLectureIds: string[],
): Promise<AdminLectureActionResult> {
  const trimmedCollectionId = collectionId.trim();
  if (!trimmedCollectionId) {
    return { ok: false, error: copy.admin.lectures.errors.generic };
  }
  if (orderedLectureIds.length === 0) {
    return { ok: false, error: copy.admin.lectures.reorder.empty };
  }

  try {
    const { supabase } = await requireAdminSession();

    const { data: collection, error: collectionError } = await supabase
      .from("lecture_collections")
      .select("id, slug")
      .eq("id", trimmedCollectionId)
      .maybeSingle();

    if (collectionError) return { ok: false, error: collectionError.message };
    if (!collection) return { ok: false, error: copy.admin.lectures.errors.generic };

    const { data: existing, error: lookupError } = await supabase
      .from("lectures")
      .select("id, sort_order")
      .eq("collection_id", trimmedCollectionId)
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });

    if (lookupError) return { ok: false, error: lookupError.message };

    const lectures = existing ?? [];
    if (lectures.length === 0) {
      return { ok: false, error: copy.admin.lectures.reorder.empty };
    }

    const existingIds = new Set(lectures.map((row) => row.id as string));
    if (
      orderedLectureIds.length !== lectures.length ||
      !orderedLectureIds.every((id) => existingIds.has(id))
    ) {
      return { ok: false, error: copy.admin.lectures.reorder.mismatch };
    }

    const currentOrder = lectures.map((row) => row.id as string).join(",");
    const nextOrder = orderedLectureIds.join(",");
    if (currentOrder === nextOrder) {
      return { ok: true, collectionId: trimmedCollectionId };
    }

    for (let index = 0; index < orderedLectureIds.length; index += 1) {
      const { error } = await supabase
        .from("lectures")
        .update({ sort_order: index + 1 })
        .eq("collection_id", trimmedCollectionId)
        .eq("id", orderedLectureIds[index]);
      if (error) return { ok: false, error: error.message };
    }

    revalidatePath(adminLecturesPath());
    revalidatePath(adminLectureCollectionPath(trimmedCollectionId));
    return { ok: true, collectionId: trimmedCollectionId };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }
    return { ok: false, error: copy.admin.lectures.errors.generic };
  }
}
