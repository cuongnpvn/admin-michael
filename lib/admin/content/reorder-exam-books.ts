"use server";

import { revalidatePath } from "next/cache";
import { revalidateAdminExamCatalogPaths } from "@/lib/admin/revalidate-admin-exam-catalog";
import { AdminAccessError, requireAdminSession } from "@/lib/admin/auth/require-admin";
import { isManagedExamBook } from "@/lib/content/catalog-ids";
import { copy } from "@/lib/copy/vi";

export type ReorderExamBooksResult =
  | { ok: true }
  | { ok: false; error: string };

function accessError(code: string): string {
  if (code === "not_signed_in") return copy.admin.import.errors.notSignedIn;
  if (code === "not_admin") return copy.admin.import.errors.notAdmin;
  return copy.admin.cms.errors.generic;
}

function revalidateAfterBookReorder(): void {
  revalidatePath("/admin");
  revalidateAdminExamCatalogPaths();
  revalidatePath("/admin/subscriptions");
}

export async function reorderAdminExamBooks(
  orderedBookIds: string[],
): Promise<ReorderExamBooksResult> {
  if (orderedBookIds.length === 0) {
    return { ok: false, error: copy.admin.exams.reorderBooks.empty };
  }

  if (!orderedBookIds.every((id) => isManagedExamBook(id))) {
    return { ok: false, error: copy.admin.exams.reorderBooks.notExamBook };
  }

  try {
    const { supabase } = await requireAdminSession();

    const { data: existingBooks, error: lookupError } = await supabase
      .from("books")
      .select("id, sort_order")
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });

    if (lookupError) throw lookupError;

    const examBooks = (existingBooks ?? []).filter((book) =>
      isManagedExamBook(book.id as string),
    );

    if (examBooks.length === 0) {
      return { ok: false, error: copy.admin.exams.reorderBooks.empty };
    }

    const existingIds = new Set(examBooks.map((book) => book.id as string));
    if (
      orderedBookIds.length !== examBooks.length ||
      !orderedBookIds.every((id) => existingIds.has(id))
    ) {
      return { ok: false, error: copy.admin.exams.reorderBooks.mismatch };
    }

    const currentOrder = examBooks.map((book) => book.id as string).join(",");
    const nextOrder = orderedBookIds.join(",");
    if (currentOrder === nextOrder) {
      return { ok: true };
    }

    for (let index = 0; index < orderedBookIds.length; index += 1) {
      const { error } = await supabase
        .from("books")
        .update({ sort_order: index + 1 })
        .eq("id", orderedBookIds[index]);
      if (error) throw error;
    }

    revalidateAfterBookReorder();
    return { ok: true };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }

    return {
      ok: false,
      error: error instanceof Error ? error.message : accessError("generic"),
    };
  }
}
