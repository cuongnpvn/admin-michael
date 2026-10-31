"use server";

import { revalidatePath } from "next/cache";
import {
  revalidateAdminExamCatalogPaths,
  revalidateLearnerPublishedCatalog,
} from "@/lib/admin/revalidate-admin-exam-catalog";
import { AdminAccessError, requireAdminSession } from "@/lib/admin/auth/require-admin";
import { copy } from "@/lib/copy/vi";

export type ReorderExamTestsResult =
  | { ok: true }
  | { ok: false; error: string };

function accessError(code: string): string {
  if (code === "not_signed_in") return copy.admin.import.errors.notSignedIn;
  if (code === "not_admin") return copy.admin.import.errors.notAdmin;
  return copy.admin.cms.errors.generic;
}

function revalidateAfterTestReorder(bookId: string): void {
  revalidatePath("/");
  revalidateAdminExamCatalogPaths();
  revalidateLearnerPublishedCatalog();
  revalidatePath("/subscriptions");
}

export async function reorderAdminExamTests(
  bookId: string,
  orderedTestIds: string[],
): Promise<ReorderExamTestsResult> {
  const trimmedBookId = bookId.trim();
  if (!trimmedBookId) {
    return { ok: false, error: copy.admin.exams.reorderTests.bookRequired };
  }

  if (orderedTestIds.length === 0) {
    return { ok: false, error: copy.admin.exams.reorderTests.empty };
  }

  try {
    const { supabase } = await requireAdminSession();

    const { data: existingTests, error: lookupError } = await supabase
      .from("tests")
      .select("id, sort_order")
      .eq("book_id", trimmedBookId)
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });

    if (lookupError) throw lookupError;

    const tests = existingTests ?? [];
    if (tests.length === 0) {
      return { ok: false, error: copy.admin.exams.reorderTests.bookNotFound };
    }

    const existingIds = new Set(tests.map((test) => test.id as string));
    if (
      orderedTestIds.length !== tests.length ||
      !orderedTestIds.every((id) => existingIds.has(id))
    ) {
      return { ok: false, error: copy.admin.exams.reorderTests.mismatch };
    }

    const currentOrder = tests.map((test) => test.id as string).join(",");
    const nextOrder = orderedTestIds.join(",");
    if (currentOrder === nextOrder) {
      return { ok: true };
    }

    for (let index = 0; index < orderedTestIds.length; index += 1) {
      const { error } = await supabase
        .from("tests")
        .update({ sort_order: index + 1 })
        .eq("book_id", trimmedBookId)
        .eq("id", orderedTestIds[index]);
      if (error) throw error;
    }

    revalidateAfterTestReorder(trimmedBookId);
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
