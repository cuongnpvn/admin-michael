import type { SupabaseClient } from "@supabase/supabase-js";
import { buildListeningPart3ProcessExport } from "@/lib/admin/export/build-listening-part3-process-export";
import { extractListeningPart3ProcessFromExportJson } from "@/lib/admin/gemini/extract-listening-part3-process-from-json";
import { importListeningPart3ProcessEnrichment } from "@/lib/admin/import/import-listening-part3-process-enrichment";
import { loadPassageTranslationQuestionIndex } from "@/lib/admin/import/passage-translation-question-index";
import {
  listeningPart3ProcessImportFileSchema,
  normalizeListeningPart3ProcessImportFile,
} from "@/lib/content/listening-part3-process-import-schema";

export async function generateAndImportListeningPart3Process(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
): Promise<void> {
  const exportEntries = await buildListeningPart3ProcessExport(
    supabase,
    bookId,
    testId,
  );

  if (exportEntries.length === 0) {
    throw new Error("Part 3 has no listening groups to process.");
  }

  const exportJson = JSON.stringify(exportEntries);
  const processJson = await extractListeningPart3ProcessFromExportJson(
    exportJson,
    { supabase, bookId, testId },
  );

  const parsed = JSON.parse(processJson) as unknown;
  const entries = normalizeListeningPart3ProcessImportFile(
    listeningPart3ProcessImportFileSchema.parse(parsed),
  );
  const questionIndex = await loadPassageTranslationQuestionIndex(
    supabase,
    bookId,
    testId,
    3,
  );

  await importListeningPart3ProcessEnrichment(
    supabase,
    bookId,
    testId,
    entries,
    questionIndex,
  );
}
