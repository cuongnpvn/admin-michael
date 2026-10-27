"use server";

import { revalidatePath } from "next/cache";
import { revalidateAdminExamCatalogPaths } from "@/lib/admin/revalidate-admin-exam-catalog";
import { AdminAccessError, requireAdminSession } from "@/lib/admin/auth/require-admin";
import { isExamBook } from "@/lib/content/catalog-ids";
import { copy } from "@/lib/copy/vi";

export type DeleteExamTestResult =
  | { ok: true }
  | { ok: false; error: string };

function accessError(code: string): string {
  if (code === "not_signed_in") return copy.admin.import.errors.notSignedIn;
  if (code === "not_admin") return copy.admin.import.errors.notAdmin;
  return copy.admin.cms.errors.generic;
}

export async function deleteTestRow(
  supabase: Awaited<ReturnType<typeof requireAdminSession>>["supabase"],
  bookId: string,
  testId: string,
): Promise<void> {
  const { error } = await supabase
    .from("tests")
    .delete()
    .eq("book_id", bookId)
    .eq("id", testId);

  if (error) throw error;
}

function revalidateAfterTestDelete(_bookId: string, _testId: string): void {
  revalidatePath("/admin");
  revalidateAdminExamCatalogPaths();
}

export async function deleteAdminExamTest(
  bookId: string,
  testId: string,
): Promise<DeleteExamTestResult> {
  try {
    if (!isExamBook(bookId)) {
      return { ok: false, error: copy.admin.exams.delete.notExamBook };
    }

    const { supabase } = await requireAdminSession();

    const { data: existingTest, error: lookupError } = await supabase
      .from("tests")
      .select("id")
      .eq("book_id", bookId)
      .eq("id", testId)
      .maybeSingle();

    if (lookupError) throw lookupError;

    if (!existingTest) {
      return { ok: false, error: copy.admin.exams.delete.notFound };
    }

    await deleteTestRow(supabase, bookId, testId);
    revalidateAfterTestDelete(bookId, testId);

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
