import type { SupabaseClient } from "@supabase/supabase-js";
import { buildReadingPart5TranslationExport } from "@/lib/admin/export/build-reading-part5-translation-export";
import { extractReadingPart5TranslationsFromExportJson } from "@/lib/admin/gemini/extract-reading-part5-translations-from-json";
import { elapsedMs, geminiLog, previewText } from "@/lib/admin/gemini/gemini-log";
import { importReadingPart5TranslationsFromRaw } from "@/lib/admin/import/import-reading-part5-translations";

const TRANSLATION_PREFIX = "[reading-part5-translation]";

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

export async function generateAndImportReadingPart5Translations(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
): Promise<void> {
  const startedAt = performance.now();
  translationLog("start", { bookId, testId });

  const exportEntries = await buildReadingPart5TranslationExport(
    supabase,
    bookId,
    testId,
  );

  if (exportEntries.length === 0) {
    translationError("export_empty", { bookId, testId });
    throw new Error(
      "Part 5 has no questions with complete English content to translate.",
    );
  }

  const exportJson = JSON.stringify(exportEntries);
  translationLog("export_built", {
    bookId,
    testId,
    entryCount: exportEntries.length,
    exportJsonChars: exportJson.length,
    exportPreview: previewText(exportJson, 400),
  });

  geminiLog("translation_export_ready", {
    bookId,
    testId,
    moduleId: "reading-part-5",
    entryCount: exportEntries.length,
  });

  const translationJson =
    await extractReadingPart5TranslationsFromExportJson(exportJson);

  translationLog("gemini_done", {
    bookId,
    testId,
    translationJsonChars: translationJson.length,
    translationPreview: previewText(translationJson, 400),
  });

  const summary = await importReadingPart5TranslationsFromRaw(
    supabase,
    bookId,
    testId,
    translationJson,
  );

  translationLog("import_done", {
    bookId,
    testId,
    summary,
    totalMs: elapsedMs(startedAt),
  });
}
