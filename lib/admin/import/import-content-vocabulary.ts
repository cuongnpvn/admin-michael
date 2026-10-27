import type { SupabaseClient } from "@supabase/supabase-js";
import { resolvePassageSetIdFromQuestionIndex } from "@/lib/admin/import/passage-translation-passage-index";
import {
  loadListeningPart12TranslationQuestionIndex,
  loadPassageTranslationQuestionIndex,
  resolveQuestionIdFromIndex,
  type PassageTranslationQuestionIndex,
} from "@/lib/admin/import/passage-translation-question-index";
import {
  contentVocabularyImportFileSchema,
  normalizeContentVocabularyImportFile,
  type ContentVocabularyImportUnit,
  type ContentVocabularyPart,
} from "@/lib/content/content-vocabulary-export-schema";
import { normalizeContentVocabulary } from "@/lib/content/content-vocabulary";

export interface ImportContentVocabularySummary {
  bookId: string;
  testId: string;
  part: ContentVocabularyPart;
  unitsUpdated: number;
  vocabularyTerms: number;
  notFoundQuestionIds: string[];
}

async function loadQuestionIndexForPart(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  part: ContentVocabularyPart,
): Promise<PassageTranslationQuestionIndex> {
  if (part === 1 || part === 2) {
    return loadListeningPart12TranslationQuestionIndex(
      supabase,
      bookId,
      testId,
    );
  }

  return loadPassageTranslationQuestionIndex(
    supabase,
    bookId,
    testId,
    part,
  );
}

function resolveListeningGroupId(
  questionIndex: PassageTranslationQuestionIndex,
  questionId: string,
): string | null {
  const resolved = resolveQuestionIdFromIndex(questionIndex, questionId);
  if (!resolved) return null;
  const row = questionIndex.rows.find((entry) => entry.id === resolved.dbId);
  return row?.listeningGroupId ?? null;
}

export async function importContentVocabularyFromRaw(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  part: ContentVocabularyPart,
  raw: string,
): Promise<ImportContentVocabularySummary> {
  const parsed = JSON.parse(raw) as unknown;
  const entries = normalizeContentVocabularyImportFile(
    contentVocabularyImportFileSchema.parse(parsed),
  );
  const questionIndex = await loadQuestionIndexForPart(
    supabase,
    bookId,
    testId,
    part,
  );

  return importContentVocabularyEntries(
    supabase,
    bookId,
    testId,
    part,
    entries,
    questionIndex,
  );
}

async function importContentVocabularyEntries(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  part: ContentVocabularyPart,
  entries: ContentVocabularyImportUnit[],
  questionIndex: PassageTranslationQuestionIndex,
): Promise<ImportContentVocabularySummary> {
  const notFoundQuestionIds: string[] = [];
  let unitsUpdated = 0;
  let vocabularyTerms = 0;

  for (const entry of entries) {
    const vocabulary = normalizeContentVocabulary(entry.vocabulary);

    if (part === 3 || part === 4) {
      const listeningGroupId = resolveListeningGroupId(
        questionIndex,
        entry.questionId,
      );
      if (!listeningGroupId) {
        notFoundQuestionIds.push(entry.questionId);
        continue;
      }

      const { error } = await supabase
        .from("listening_groups")
        .update({ vocabulary })
        .eq("id", listeningGroupId)
        .eq("book_id", bookId)
        .eq("test_id", testId);

      if (error) throw error;
      unitsUpdated += 1;
      vocabularyTerms += vocabulary.length;
      continue;
    }

    if (part === 6 || part === 7) {
      const passageSetId = resolvePassageSetIdFromQuestionIndex(
        questionIndex,
        entry.questionId,
      );
      if (!passageSetId) {
        notFoundQuestionIds.push(entry.questionId);
        continue;
      }

      const { error } = await supabase
        .from("reading_passage_sets")
        .update({ vocabulary })
        .eq("id", passageSetId)
        .eq("book_id", bookId)
        .eq("test_id", testId);

      if (error) throw error;
      unitsUpdated += 1;
      vocabularyTerms += vocabulary.length;
      continue;
    }

    // Parts 1, 2, 5 — vocabulary on the question
    const resolved = resolveQuestionIdFromIndex(
      questionIndex,
      entry.questionId,
    );
    if (!resolved) {
      notFoundQuestionIds.push(entry.questionId);
      continue;
    }

    const { error } = await supabase
      .from("questions")
      .update({ vocabulary })
      .eq("id", resolved.dbId)
      .eq("book_id", bookId)
      .eq("test_id", testId);

    if (error) throw error;
    unitsUpdated += 1;
    vocabularyTerms += vocabulary.length;
  }

  if (unitsUpdated === 0) {
    const detail =
      notFoundQuestionIds.length > 0
        ? `Không tìm thấy đơn vị: ${notFoundQuestionIds.join(", ")}`
        : "Không có từ vựng hợp lệ trong kết quả.";
    throw new Error(detail);
  }

  return {
    bookId,
    testId,
    part,
    unitsUpdated,
    vocabularyTerms,
    notFoundQuestionIds,
  };
}
