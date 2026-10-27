"use server";

import { AdminAccessError, requireAdminSession } from "@/lib/admin/auth/require-admin";
import { buildListeningTranslationExport } from "@/lib/admin/export/build-listening-translation-export";
import { copy } from "@/lib/copy/vi";

export type ExportListeningTranslationResult =
  | { ok: true; json: string; filename: string }
  | { ok: false; error: string };

function accessError(code: string): string {
  if (code === "not_signed_in") {
    return copy.admin.listeningTranslationExport.errors.notSignedIn;
  }
  if (code === "not_admin") {
    return copy.admin.listeningTranslationExport.errors.notAdmin;
  }
  return copy.admin.listeningTranslationExport.errors.generic;
}

export async function exportListeningTranslationJson(
  bookId: string,
  testId: string,
  part: number,
): Promise<ExportListeningTranslationResult> {
  if (part !== 3 && part !== 4) {
    return {
      ok: false,
      error: copy.admin.listeningTranslationExport.errors.wrongPart,
    };
  }

  try {
    const { supabase } = await requireAdminSession();
    const payload = await buildListeningTranslationExport(
      supabase,
      bookId,
      testId,
      part,
    );

    const json = JSON.stringify(payload, null, 2);
    const filename = `${bookId}_${testId}_part${part}_transcripts.json`;

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
          : copy.admin.listeningTranslationExport.errors.generic,
    };
  }
}
