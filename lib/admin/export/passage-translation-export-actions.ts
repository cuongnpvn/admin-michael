"use server";

import { AdminAccessError, requireAdminSession } from "@/lib/admin/auth/require-admin";
import { buildPassageTranslationExport } from "@/lib/admin/export/build-passage-translation-export";
import { copy } from "@/lib/copy/vi";

export type ExportPassageTranslationResult =
  | { ok: true; json: string; filename: string }
  | { ok: false; error: string };

function accessError(code: string): string {
  if (code === "not_signed_in") {
    return copy.admin.passageTranslationExport.errors.notSignedIn;
  }
  if (code === "not_admin") {
    return copy.admin.passageTranslationExport.errors.notAdmin;
  }
  return copy.admin.passageTranslationExport.errors.generic;
}

export async function exportPassageTranslationJson(
  bookId: string,
  testId: string,
  part: number,
): Promise<ExportPassageTranslationResult> {
  if (part !== 6 && part !== 7) {
    return {
      ok: false,
      error: copy.admin.passageTranslationExport.errors.wrongPart,
    };
  }

  try {
    const { supabase } = await requireAdminSession();
    const payload = await buildPassageTranslationExport(
      supabase,
      bookId,
      testId,
      part,
    );

    const json = JSON.stringify(payload, null, 2);
    const filename = `${bookId}_${testId}_part${part}_passages.json`;

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
          : copy.admin.passageTranslationExport.errors.generic,
    };
  }
}
