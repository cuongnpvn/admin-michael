"use server";

import { ZodError } from "zod";
import { revalidatePath } from "next/cache";
import { revalidateAdminExamCatalogPaths } from "@/lib/admin/revalidate-admin-exam-catalog";
import {
  AdminAccessError,
  requireAdminSession,
} from "@/lib/admin/auth/require-admin";
import {
  applyAnswerKeyFromRaw,
  type ApplyAnswerKeySummary,
} from "@/lib/admin/answer-key/apply-answer-key";
import {
  checkAnswerKeyConsistency,
  type CheckAnswerKeyResult,
} from "@/lib/admin/answer-key/check-answer-key";
import { copy } from "@/lib/copy/vi";

const MAX_JSON_BYTES = 2 * 1024 * 1024;

export type ImportAnswerKeyResult =
  | { ok: true; summary: ApplyAnswerKeySummary }
  | { ok: false; error: string };

export type CheckExamAnswerKeyResult =
  | { ok: true; result: CheckAnswerKeyResult }
  | { ok: false; error: string };

function accessErrorMessage(code: string): string {
  if (code === "not_signed_in") return copy.admin.answerKey.errors.notSignedIn;
  if (code === "not_admin") return copy.admin.answerKey.errors.notAdmin;
  return copy.admin.answerKey.errors.generic;
}

function validateJsonFile(file: FormDataEntryValue | null): File | null {
  if (!(file instanceof File) || file.size === 0) {
    return null;
  }

  const isJson =
    file.type === "application/json" ||
    file.name.toLowerCase().endsWith(".json");

  if (!isJson) {
    throw new Error(copy.admin.answerKey.errors.invalidType);
  }

  if (file.size > MAX_JSON_BYTES) {
    throw new Error(copy.admin.answerKey.errors.fileTooLarge);
  }

  return file;
}

async function resolveAnswerKeyRaw(formData: FormData): Promise<string> {
  const jsonContent = formData.get("jsonContent");
  if (typeof jsonContent === "string" && jsonContent.trim().length > 0) {
    if (new Blob([jsonContent]).size > MAX_JSON_BYTES) {
      throw new Error(copy.admin.answerKey.errors.fileTooLarge);
    }
    return jsonContent;
  }

  const file = validateJsonFile(formData.get("file"));
  if (!file) {
    throw new Error(copy.admin.answerKey.errors.missingInput);
  }

  return file.text();
}

function revalidateAnswerKeyPaths(bookId: string, testId: string) {
  revalidatePath("/answer-keys");
  revalidateAdminExamCatalogPaths(bookId, testId);
}

export async function checkExamAnswerKey(
  bookId: string,
  testId: string,
): Promise<CheckExamAnswerKeyResult> {
  try {
    const { supabase } = await requireAdminSession();
    const trimmedBookId = bookId.trim();
    const trimmedTestId = testId.trim();
    if (!trimmedBookId || !trimmedTestId) {
      return { ok: false, error: copy.admin.exams.checkAnswerKey.errors.generic };
    }

    const result = await checkAnswerKeyConsistency(
      supabase,
      trimmedBookId,
      trimmedTestId,
    );
    return { ok: true, result };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessErrorMessage(error.message) };
    }

    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : copy.admin.exams.checkAnswerKey.errors.generic,
    };
  }
}

export async function importAnswerKeyFromJson(
  formData: FormData,
): Promise<ImportAnswerKeyResult> {
  try {
    const { supabase, user } = await requireAdminSession();
    const raw = await resolveAnswerKeyRaw(formData);
    const summary = await applyAnswerKeyFromRaw(supabase, raw, user.id);

    revalidateAnswerKeyPaths(summary.bookId, summary.testId);

    return { ok: true, summary };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessErrorMessage(error.message) };
    }

    if (error instanceof SyntaxError) {
      return { ok: false, error: copy.admin.answerKey.errors.invalidJson };
    }

    if (error instanceof ZodError) {
      const first = error.issues[0];
      return {
        ok: false,
        error: first
          ? `${copy.admin.answerKey.errors.invalidSchema}: ${first.message}`
          : copy.admin.answerKey.errors.invalidSchema,
      };
    }

    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : copy.admin.answerKey.errors.generic,
    };
  }
}
