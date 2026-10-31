"use server";

import { revalidatePath } from "next/cache";
import {
  revalidateAdminExamCatalogPaths,
  revalidateLearnerPublishedCatalog,
} from "@/lib/admin/revalidate-admin-exam-catalog";
import { AdminAccessError, requireAdminSession } from "@/lib/admin/auth/require-admin";
import { copy } from "@/lib/copy/vi";

export type UpdateCatalogLabelResult =
  | { ok: true }
  | { ok: false; error: string };

function accessError(code: string): string {
  if (code === "not_signed_in") return copy.admin.import.errors.notSignedIn;
  if (code === "not_admin") return copy.admin.import.errors.notAdmin;
  return copy.admin.cms.errors.generic;
}

function revalidateAfterCatalogLabelChange(
  bookId: string,
  testId?: string,
): void {
  revalidatePath("/");
  revalidateAdminExamCatalogPaths();
  revalidateLearnerPublishedCatalog();
  revalidatePath("/subscriptions");

  if (testId) {
  }

}

export async function updateAdminBookName(
  bookId: string,
  name: string,
): Promise<UpdateCatalogLabelResult> {
  const trimmed = name.trim();
  if (!trimmed) {
    return { ok: false, error: copy.admin.exams.editLabels.bookNameRequired };
  }

  try {
    const { supabase } = await requireAdminSession();

    const { data: existingBook, error: lookupError } = await supabase
      .from("books")
      .select("id")
      .eq("id", bookId)
      .maybeSingle();

    if (lookupError) throw lookupError;
    if (!existingBook) {
      return { ok: false, error: copy.admin.exams.editLabels.bookNotFound };
    }

    const { error } = await supabase
      .from("books")
      .update({ name: trimmed })
      .eq("id", bookId);

    if (error) throw error;

    revalidateAfterCatalogLabelChange(bookId);
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

export async function updateAdminTestAccessTier(
  bookId: string,
  testId: string,
  accessTier: "free" | "pro",
): Promise<UpdateCatalogLabelResult> {
  if (accessTier !== "free" && accessTier !== "pro") {
    return { ok: false, error: copy.admin.cms.errors.generic };
  }

  try {
    const { supabase } = await requireAdminSession();

    const { data: existingTest, error: lookupError } = await supabase
      .from("tests")
      .select("id")
      .eq("book_id", bookId)
      .eq("id", testId)
      .maybeSingle();

    if (lookupError) throw lookupError;
    if (!existingTest) {
      return { ok: false, error: copy.admin.exams.editLabels.testNotFound };
    }

    const { error } = await supabase
      .from("tests")
      .update({ access_tier: accessTier })
      .eq("book_id", bookId)
      .eq("id", testId);

    if (error) throw error;

    revalidateAfterCatalogLabelChange(bookId, testId);
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

export async function updateAdminTestLabel(
  bookId: string,
  testId: string,
  label: string,
): Promise<UpdateCatalogLabelResult> {
  const trimmed = label.trim();
  if (!trimmed) {
    return { ok: false, error: copy.admin.exams.editLabels.testLabelRequired };
  }

  try {
    const { supabase } = await requireAdminSession();

    const { data: existingTest, error: lookupError } = await supabase
      .from("tests")
      .select("id")
      .eq("book_id", bookId)
      .eq("id", testId)
      .maybeSingle();

    if (lookupError) throw lookupError;
    if (!existingTest) {
      return { ok: false, error: copy.admin.exams.editLabels.testNotFound };
    }

    const { error } = await supabase
      .from("tests")
      .update({ label: trimmed })
      .eq("book_id", bookId)
      .eq("id", testId);

    if (error) throw error;

    revalidateAfterCatalogLabelChange(bookId, testId);
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
