"use server";

import { revalidateAdminExamCatalogPaths } from "@/lib/admin/revalidate-admin-exam-catalog";
import { ZodError } from "zod";
import { AdminAccessError, requireAdminSession } from "@/lib/admin/auth/require-admin";
import type { CreateExamStepResult } from "@/lib/admin/content/create-exam-test-pipeline";
import { loadListeningPart1TagImages } from "@/lib/admin/content/load-listening-part1-tag-images";
import {
  buildListeningPart1TagExport,
  buildListeningPart2TagExport,
  type ListeningPart1TagExportEntry,
} from "@/lib/admin/export/build-listening-part12-tag-export";
import { extractListeningPart12TagsFromExport } from "@/lib/admin/gemini/extract-listening-part12-tags";
import { importListeningPart12TagsFromRaw } from "@/lib/admin/import/import-listening-part12-tags";
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

function logFailure(
  event: string,
  details: Record<string, unknown>,
): void {
  console.error("[listening-part12-tags]", event, details);
}

export async function exportExamListeningPartTags(
  bookId: string,
  testId: string,
  part: 1 | 2,
): Promise<CreateExamStepResult & { exportJson?: string }> {
  try {
    const { supabase } = await requireAdminSession();
    const entries =
      part === 1
        ? await buildListeningPart1TagExport(supabase, bookId, testId)
        : await buildListeningPart2TagExport(supabase, bookId, testId);
    return { ok: true, exportJson: JSON.stringify(entries) };
  } catch (error) {
    logFailure("export_failed", {
      bookId,
      testId,
      part,
      error: formatThrownError(error),
    });
    return mapImportError(error);
  }
}

export async function extractExamListeningPartTags(
  bookId: string,
  testId: string,
  part: 1 | 2,
  exportJson: string,
): Promise<CreateExamStepResult & { tagsJson?: string }> {
  try {
    const { supabase } = await requireAdminSession();
    const images =
      part === 1
        ? await loadListeningPart1TagImages(
            supabase,
            bookId,
            testId,
            JSON.parse(exportJson) as ListeningPart1TagExportEntry[],
          )
        : undefined;
    const tagsJson = await extractListeningPart12TagsFromExport({
      part,
      exportJson,
      images,
    });
    return { ok: true, tagsJson };
  } catch (error) {
    logFailure("extract_failed", {
      bookId,
      testId,
      part,
      error: formatThrownError(error),
    });
    return mapImportError(error);
  }
}

export async function importExamListeningPartTags(
  bookId: string,
  testId: string,
  part: 1 | 2,
  tagsJson: string,
): Promise<CreateExamStepResult> {
  try {
    const { supabase } = await requireAdminSession();
    await importListeningPart12TagsFromRaw(
      supabase,
      bookId,
      testId,
      part,
      tagsJson,
    );
    revalidateAdminExamCatalogPaths();
    return { ok: true };
  } catch (error) {
    logFailure("import_failed", {
      bookId,
      testId,
      part,
      error: formatThrownError(error),
    });
    return mapImportError(error);
  }
}
