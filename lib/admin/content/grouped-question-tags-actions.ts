"use server";

import { revalidateAdminExamCatalogPaths } from "@/lib/admin/revalidate-admin-exam-catalog";
import { ZodError } from "zod";
import { AdminAccessError, requireAdminSession } from "@/lib/admin/auth/require-admin";
import type { CreateExamStepResult } from "@/lib/admin/content/create-exam-test-pipeline";
import type { GroupedTagPart } from "@/lib/admin/content/map-question-tag-updates";
import {
  buildGroupedQuestionTagExport,
  groupedTagQuestionCount,
} from "@/lib/admin/export/build-grouped-question-tag-export";
import { extractGroupedQuestionTagsFromExport } from "@/lib/admin/gemini/extract-grouped-question-tags";
import {
  importGroupedQuestionTagsFromRaw,
  logGroupedQuestionTagsFailure,
} from "@/lib/admin/import/import-grouped-question-tags";
import { copy } from "@/lib/copy/vi";

function accessError(code: string): string {
  if (code === "not_signed_in") return copy.admin.import.errors.notSignedIn;
  if (code === "not_admin") return copy.admin.import.errors.notAdmin;
  return copy.admin.cms.errors.generic;
}

function formatThrownError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function mapImportError(error: unknown): CreateExamStepResult {
  if (error instanceof AdminAccessError) {
    return { ok: false, error: accessError(error.message) };
  }
  if (error instanceof SyntaxError) {
    return { ok: false, error: copy.admin.listeningImport.errors.invalidJson };
  }
  if (error instanceof ZodError) {
    return {
      ok: false,
      error:
        error.issues[0]?.message ?? copy.admin.listeningImport.errors.invalidSchema,
    };
  }
  return {
    ok: false,
    error: formatThrownError(error) || copy.admin.cms.errors.generic,
  };
}

export async function exportExamGroupedQuestionTags(
  bookId: string,
  testId: string,
  part: GroupedTagPart,
): Promise<CreateExamStepResult & { exportJson?: string; skipped?: boolean }> {
  try {
    const { supabase } = await requireAdminSession();
    const units = await buildGroupedQuestionTagExport(
      supabase,
      bookId,
      testId,
      part,
    );
    if (groupedTagQuestionCount(units) === 0) {
      return { ok: true, skipped: true };
    }
    return { ok: true, exportJson: JSON.stringify(units) };
  } catch (error) {
    logGroupedQuestionTagsFailure("export_failed", {
      bookId,
      testId,
      part,
      error: formatThrownError(error),
    });
    return mapImportError(error);
  }
}

export async function extractExamGroupedQuestionTags(
  part: GroupedTagPart,
  exportJson: string,
): Promise<CreateExamStepResult & { tagsJson?: string }> {
  try {
    await requireAdminSession();
    const tagsJson = await extractGroupedQuestionTagsFromExport({
      part,
      exportJson,
    });
    return { ok: true, tagsJson };
  } catch (error) {
    logGroupedQuestionTagsFailure("extract_failed", {
      part,
      error: formatThrownError(error),
    });
    return mapImportError(error);
  }
}

export async function importExamGroupedQuestionTags(
  bookId: string,
  testId: string,
  part: GroupedTagPart,
  tagsJson: string,
): Promise<CreateExamStepResult> {
  try {
    const { supabase } = await requireAdminSession();
    await importGroupedQuestionTagsFromRaw(
      supabase,
      bookId,
      testId,
      part,
      tagsJson,
    );
    revalidateAdminExamCatalogPaths(bookId, testId);
    return { ok: true };
  } catch (error) {
    logGroupedQuestionTagsFailure("import_failed", {
      bookId,
      testId,
      part,
      error: formatThrownError(error),
    });
    return mapImportError(error);
  }
}
