import type { SupabaseClient } from "@supabase/supabase-js";
import { buildContentVocabularyExport } from "@/lib/admin/export/build-content-vocabulary-export";
import { extractContentVocabularyFromExportJson } from "@/lib/admin/gemini/extract-content-vocabulary-from-json";
import { elapsedMs, geminiLog, previewText } from "@/lib/admin/gemini/gemini-log";
import { importContentVocabularyFromRaw } from "@/lib/admin/import/import-content-vocabulary";
import type { ContentVocabularyPart } from "@/lib/content/content-vocabulary-export-schema";

const VOCAB_PREFIX = "[content-vocabulary]";

function vocabLog(
  event: string,
  details: Record<string, unknown> = {},
): void {
  console.log(VOCAB_PREFIX, event, details);
}

function vocabError(
  event: string,
  details: Record<string, unknown> = {},
  error?: unknown,
): void {
  if (error !== undefined) {
    console.error(VOCAB_PREFIX, event, {
      ...details,
      error: error instanceof Error ? error.message : String(error),
    });
    return;
  }
  console.error(VOCAB_PREFIX, event, details);
}

export async function generateAndImportContentVocabulary(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  part: ContentVocabularyPart,
): Promise<void> {
  const startedAt = performance.now();
  vocabLog("start", { bookId, testId, part });

  const exportEntries = await buildContentVocabularyExport(
    supabase,
    bookId,
    testId,
    part,
  );

  if (exportEntries.length === 0) {
    vocabError("export_empty", { bookId, testId, part });
    throw new Error(`Part ${part} has no content units to extract vocabulary.`);
  }

  const exportJson = JSON.stringify(exportEntries);
  vocabLog("export_built", {
    bookId,
    testId,
    part,
    entryCount: exportEntries.length,
    exportJsonChars: exportJson.length,
    exportPreview: previewText(exportJson, 400),
  });

  geminiLog("content_vocabulary_export_ready", {
    bookId,
    testId,
    part,
    entryCount: exportEntries.length,
  });

  const vocabularyJson = await extractContentVocabularyFromExportJson(
    exportJson,
    part,
  );

  vocabLog("gemini_done", {
    bookId,
    testId,
    part,
    vocabularyJsonChars: vocabularyJson.length,
    vocabularyPreview: previewText(vocabularyJson, 400),
  });

  const summary = await importContentVocabularyFromRaw(
    supabase,
    bookId,
    testId,
    part,
    vocabularyJson,
  );

  vocabLog("import_done", {
    bookId,
    testId,
    part,
    summary,
    totalMs: elapsedMs(startedAt),
  });
}
