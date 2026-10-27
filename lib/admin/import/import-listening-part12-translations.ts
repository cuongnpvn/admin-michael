import type { SupabaseClient } from "@supabase/supabase-js";
import {
  loadListeningPart12TranslationQuestionIndex,
  resolveQuestionIdFromIndex,
} from "@/lib/admin/import/passage-translation-question-index";
import {
  normalizePassageTranslationImportFile,
  passageTranslationImportFileSchema,
  type PassageTranslationQuestionImport,
} from "@/lib/content/passage-translation-import-schema";
import type { ImportPassageTranslationsSummary } from "@/lib/admin/import/import-passage-translations";

function filterTranslationRows(
  rows: PassageTranslationQuestionImport["translations"],
): PassageTranslationQuestionImport["translations"] {
  return rows.filter(
    (row) => row.english.trim().length > 0 || row.vietnamese.trim().length > 0,
  );
}

export async function importListeningPart12TranslationsFromRaw(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  raw: string,
): Promise<ImportPassageTranslationsSummary> {
  const parsed = JSON.parse(raw) as unknown;
  const file = passageTranslationImportFileSchema.parse(parsed);
  const entries = normalizePassageTranslationImportFile(file);

  const questionIndex = await loadListeningPart12TranslationQuestionIndex(
    supabase,
    bookId,
    testId,
  );

  const notFoundQuestionIds: string[] = [];
  let questionsUpdated = 0;
  let translationRows = 0;

  for (const entry of entries) {
    const translations = filterTranslationRows(entry.translations);
    if (translations.length === 0) continue;

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
    part: 0,
    questionsUpdated,
    passagesUpdated: 0,
    translationRows,
    notFoundQuestionIds,
    notFoundPassageSlugs: [],
  };
}
