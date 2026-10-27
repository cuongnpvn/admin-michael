"use server";

import { revalidateAdminExamCatalogPaths } from "@/lib/admin/revalidate-admin-exam-catalog";
import { ZodError } from "zod";
import { AdminAccessError, requireAdminSession } from "@/lib/admin/auth/require-admin";
import type { CreateExamStepResult } from "@/lib/admin/content/create-exam-test-pipeline";
import { buildPart5TagExport } from "@/lib/admin/export/build-part5-tag-export";
import { extractPart5TagsFromExportJson } from "@/lib/admin/gemini/extract-part5-tags-from-json";
import {
  importPart5TagsFromRaw,
  logPart5TagsFailure,
} from "@/lib/admin/import/import-part5-tags";
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

export async function exportExamPart5Tags(
  bookId: string,
  testId: string,
): Promise<CreateExamStepResult & { exportJson?: string }> {
  try {
    const { supabase } = await requireAdminSession();
    const entries = await buildPart5TagExport(supabase, bookId, testId);
    if (entries.length === 0) {
      throw new Error("This test has no Part 5 questions to tag.");
    }
    return { ok: true, exportJson: JSON.stringify(entries) };
  } catch (error) {
    logPart5TagsFailure("export_failed", {
      bookId,
      testId,
      error: formatThrownError(error),
    });
    return mapImportError(error);
  }
}

export async function extractExamPart5TagsExport(
  exportJson: string,
): Promise<CreateExamStepResult & { tagsJson?: string }> {
  try {
    await requireAdminSession();
    const tagsJson = await extractPart5TagsFromExportJson(exportJson);
    return { ok: true, tagsJson };
  } catch (error) {
    logPart5TagsFailure("extract_failed", {
      error: formatThrownError(error),
    });
    return mapImportError(error);
  }
}

export async function importExamPart5TagsJson(
  bookId: string,
  testId: string,
  tagsJson: string,
): Promise<CreateExamStepResult> {
  try {
    const { supabase } = await requireAdminSession();
    await importPart5TagsFromRaw(supabase, bookId, testId, tagsJson);
    revalidateAdminExamCatalogPaths();
    return { ok: true };
  } catch (error) {
    logPart5TagsFailure("import_failed", {
      bookId,
      testId,
      error: formatThrownError(error),
    });
    return mapImportError(error);
  }
}
