import type { SupabaseClient } from "@supabase/supabase-js";
import {
  loadPassageTranslationQuestionIndex,
  resolveQuestionIdFromIndex,
} from "@/lib/admin/import/passage-translation-question-index";
import {
  normalizePassageTranslationImportFile,
  passageTranslationImportFileSchema,
  type PassageTranslationQuestionImport,
} from "@/lib/content/passage-translation-import-schema";

export interface ImportReadingPart5TranslationsSummary {
  bookId: string;
  testId: string;
  questionsUpdated: number;
  translationRows: number;
  notFoundQuestionIds: string[];
}

function filterTranslationRows(
  rows: Array<{ english: string; vietnamese: string }>,
): Array<{ english: string; vietnamese: string }> {
  return rows.filter(
    (row) => row.english.trim().length > 0 || row.vietnamese.trim().length > 0,
  );
}

export async function importReadingPart5TranslationsFromRaw(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  raw: string,
): Promise<ImportReadingPart5TranslationsSummary> {
  const parsed = JSON.parse(raw) as unknown;
  const entries = normalizePassageTranslationImportFile(
    passageTranslationImportFileSchema.parse(parsed),
  );
  const questionIndex = await loadPassageTranslationQuestionIndex(
    supabase,
    bookId,
    testId,
    5,
  );

  return importReadingPart5TranslationEntries(
    supabase,
    bookId,
    testId,
    entries,
    questionIndex,
  );
}

async function importReadingPart5TranslationEntries(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  entries: PassageTranslationQuestionImport[],
  questionIndex: Awaited<ReturnType<typeof loadPassageTranslationQuestionIndex>>,
): Promise<ImportReadingPart5TranslationsSummary> {
  const notFoundQuestionIds: string[] = [];
  let questionsUpdated = 0;
  let translationRows = 0;

  for (const entry of entries) {
    const translations = filterTranslationRows(entry.translations);
    if (translations.length === 0) {
      continue;
    }

    const resolved = resolveQuestionIdFromIndex(questionIndex, entry.questionId);
    if (!resolved) {
      notFoundQuestionIds.push(entry.questionId);
      continue;
    }

    const { error: updateError } = await supabase
      .from("questions")
      .update({ translations })
      .eq("id", resolved.dbId)
      .eq("book_id", bookId)
      .eq("test_id", testId);

    if (updateError) throw updateError;

    questionsUpdated += 1;
    translationRows += translations.length;
  }

  if (questionsUpdated === 0) {
    const detail =
      notFoundQuestionIds.length > 0
        ? `Không tìm thấy câu hỏi: ${notFoundQuestionIds.join(", ")}`
        : "Không có bản dịch hợp lệ trong file.";
    throw new Error(detail);
  }

  return {
    bookId,
    testId,
    questionsUpdated,
    translationRows,
    notFoundQuestionIds,
  };
}
