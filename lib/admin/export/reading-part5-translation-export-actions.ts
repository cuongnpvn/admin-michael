"use server";

import { AdminAccessError, requireAdminSession } from "@/lib/admin/auth/require-admin";
import { buildReadingPart5TranslationExport } from "@/lib/admin/export/build-reading-part5-translation-export";
import { copy } from "@/lib/copy/vi";

export type ExportReadingPart5TranslationResult =
  | { ok: true; json: string; filename: string }
  | { ok: false; error: string };

function accessError(code: string): string {
  if (code === "not_signed_in") {
    return copy.admin.readingPart5TranslationExport.errors.notSignedIn;
  }
  if (code === "not_admin") {
    return copy.admin.readingPart5TranslationExport.errors.notAdmin;
  }
  return copy.admin.readingPart5TranslationExport.errors.generic;
}

export async function exportReadingPart5TranslationJson(
  bookId: string,
  testId: string,
): Promise<ExportReadingPart5TranslationResult> {
  try {
    const { supabase } = await requireAdminSession();
    const payload = await buildReadingPart5TranslationExport(
      supabase,
      bookId,
      testId,
    );

    if (payload.length === 0) {
      return {
        ok: false,
        error: copy.admin.readingPart5TranslationExport.errors.empty,
      };
    }

    const json = JSON.stringify(payload, null, 2);
    const filename = `${bookId}_${testId}_part5_translations.json`;

    return { ok: true, json, filename };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : copy.admin.readingPart5TranslationExport.errors.generic,
    };
  }
}
