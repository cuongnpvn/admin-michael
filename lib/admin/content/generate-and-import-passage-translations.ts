import type { SupabaseClient } from "@supabase/supabase-js";
import { buildPassageTranslationExport } from "@/lib/admin/export/build-passage-translation-export";
import { extractPassageTranslationsFromExportJson } from "@/lib/admin/gemini/extract-passage-translations-from-json";
import { elapsedMs, geminiLog, previewText } from "@/lib/admin/gemini/gemini-log";
import { importPassageTranslationsFromRaw } from "@/lib/admin/import/import-passage-translations";

const TRANSLATION_PREFIX = "[exam-translation]";

function translationLog(
  event: string,
  details: Record<string, unknown> = {},
): void {
  console.log(TRANSLATION_PREFIX, event, details);
}

function translationError(
  event: string,
  details: Record<string, unknown> = {},
  error?: unknown,
): void {
  if (error !== undefined) {
    console.error(TRANSLATION_PREFIX, event, {
      ...details,
      error: error instanceof Error ? error.message : String(error),
    });
    return;
  }
  console.error(TRANSLATION_PREFIX, event, details);
}

export async function generateAndImportPassageTranslations(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  part: 6 | 7,
): Promise<void> {
  const startedAt = performance.now();
  translationLog("start", { bookId, testId, part });

  const exportEntries = await buildPassageTranslationExport(
    supabase,
    bookId,
    testId,
    part,
  );

  if (exportEntries.length === 0) {
    translationError("export_empty", { bookId, testId, part });
    throw new Error(`Part ${part} has no passage sets to translate.`);
  }

  const exportJson = JSON.stringify(exportEntries);
  translationLog("export_built", {
    bookId,
    testId,
    part,
    entryCount: exportEntries.length,
    exportJsonChars: exportJson.length,
    exportPreview: previewText(exportJson, 400),
  });

  geminiLog("translation_export_ready", {
    bookId,
    testId,
    part,
    entryCount: exportEntries.length,
  });

  const translationJson = await extractPassageTranslationsFromExportJson(
    exportJson,
    part,
    { supabase, bookId, testId },
  );

  translationLog("gemini_done", {
    bookId,
    testId,
    part,
    translationJsonChars: translationJson.length,
    translationPreview: previewText(translationJson, 400),
  });

  const summary = await importPassageTranslationsFromRaw(
    supabase,
    bookId,
    testId,
    part,
    translationJson,
  );

  translationLog("import_done", {
    bookId,
    testId,
    part,
    summary,
    totalMs: elapsedMs(startedAt),
  });
}
