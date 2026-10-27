import type { SupabaseClient } from "@supabase/supabase-js";
import { buildListeningPart12TranslationExport } from "@/lib/admin/export/build-listening-part12-translation-export";
import { extractListeningPart12TranslationsFromExportJson } from "@/lib/admin/gemini/extract-listening-part12-translations-from-json";
import { elapsedMs, geminiLog, previewText } from "@/lib/admin/gemini/gemini-log";
import { importListeningPart12TranslationsFromRaw } from "@/lib/admin/import/import-listening-part12-translations";

const TRANSLATION_PREFIX = "[listening-part12-translation]";

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

export async function generateAndImportListeningPart12Translations(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
): Promise<void> {
  const startedAt = performance.now();
  translationLog("start", { bookId, testId });

  const exportEntries = await buildListeningPart12TranslationExport(
    supabase,
    bookId,
    testId,
  );

  if (exportEntries.length === 0) {
    translationError("export_empty", { bookId, testId });
    throw new Error(
      "Parts 1–2 have no questions with complete English content to translate.",
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
    moduleId: "listening-parts-1-2",
    entryCount: exportEntries.length,
  });

  const translationJson =
    await extractListeningPart12TranslationsFromExportJson(exportJson);

  translationLog("gemini_done", {
    bookId,
    testId,
    translationJsonChars: translationJson.length,
    translationPreview: previewText(translationJson, 400),
  });

  const summary = await importListeningPart12TranslationsFromRaw(
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
