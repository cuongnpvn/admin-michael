import type { SupabaseClient } from "@supabase/supabase-js";
import { passageTranslationDebugLog } from "@/lib/admin/debug/passage-translation-debug-log";
import {
  loadPassageTranslationPassageIndex,
  resolvePassageSetIdFromQuestionIndex,
  resolvePassageSlugFromIndex,
} from "@/lib/admin/import/passage-translation-passage-index";
import {
  loadPassageTranslationQuestionIndex,
  resolveQuestionIdFromIndex,
} from "@/lib/admin/import/passage-translation-question-index";
import {
  assertPart7ProcessImportSets,
  isPart7PassageTranslationImportPayload,
  isPart7ProcessImportSet,
  normalizePart7PassageTranslationImportFile,
  normalizePassageTranslationImportFile,
  part7PassageTranslationImportFileSchema,
  passageTranslationImportFileSchema,
  type Part7PassageTranslationImportSet,
  type PassageTranslationQuestionImport,
} from "@/lib/content/passage-translation-import-schema";
import { splitTranslationsByPassages } from "@/lib/reading/passage-bilingual";
import { importPart7ProcessEnrichment } from "@/lib/admin/import/import-part7-process-enrichment";

export interface ImportPassageTranslationsSummary {
  bookId: string;
  testId: string;
  part: number;
  questionsUpdated: number;
  passagesUpdated: number;
  translationRows: number;
  setsTopicUpdated?: number;
  notFoundQuestionIds: string[];
  notFoundPassageSlugs: string[];
}

function filterTranslationRows(
  rows: Array<{ english: string; vietnamese: string }>,
): Array<{ english: string; vietnamese: string }> {
  return rows.filter(
    (row) => row.english.trim().length > 0 || row.vietnamese.trim().length > 0,
  );
}

async function importLegacyQuestionTranslations(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  part: 3 | 4 | 6,
  entries: PassageTranslationQuestionImport[],
  questionIndex: Awaited<ReturnType<typeof loadPassageTranslationQuestionIndex>>,
): Promise<ImportPassageTranslationsSummary> {
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

    const questionUpdate: {
      translations: Array<{ english: string; vietnamese: string }>;
      translation_html?: string;
    } = { translations };

    const passageTranslation = entry.passageTranslation?.trim();
    if (passageTranslation) {
      questionUpdate.translation_html = passageTranslation;
    }

    const { error: updateError } = await supabase
      .from("questions")
      .update(questionUpdate)
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
    part,
    questionsUpdated,
    passagesUpdated: 0,
    translationRows,
    notFoundQuestionIds,
    notFoundPassageSlugs: [],
  };
}

async function importLegacyPart7FlatTranslations(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  entries: PassageTranslationQuestionImport[],
  questionIndex: Awaited<ReturnType<typeof loadPassageTranslationQuestionIndex>>,
  passageIndex: Awaited<ReturnType<typeof loadPassageTranslationPassageIndex>>,
): Promise<ImportPassageTranslationsSummary> {
  const notFoundQuestionIds: string[] = [];
  const notFoundPassageSlugs: string[] = [];
  let passagesUpdated = 0;
  let translationRows = 0;

  for (const entry of entries) {
    const translations = filterTranslationRows(entry.translations);
    if (translations.length === 0) {
      continue;
    }

    const passageSetId = resolvePassageSetIdFromQuestionIndex(
      questionIndex,
      entry.questionId,
    );
    if (!passageSetId) {
      notFoundQuestionIds.push(entry.questionId);
      continue;
    }

    const setPassages = passageIndex.byPassageSetId.get(passageSetId) ?? [];
    if (setPassages.length === 0) {
      notFoundQuestionIds.push(entry.questionId);
      continue;
    }

    const { data: passageContents, error: contentError } = await supabase
      .from("reading_passages")
      .select("id, slug, content")
      .in(
        "id",
        setPassages.map((passage) => passage.id),
      )
      .order("sort_order", { ascending: true });

    if (contentError) throw contentError;

    const slices = splitTranslationsByPassages(
      (passageContents ?? []).map((passage) => ({ content: passage.content })),
      translations,
    );

    for (let index = 0; index < (passageContents ?? []).length; index += 1) {
      const passage = passageContents?.[index];
      const slice = filterTranslationRows(slices[index] ?? []);
      if (!passage || slice.length === 0) {
        continue;
      }

      const { error: updateError } = await supabase
        .from("reading_passages")
        .update({ translations: slice })
        .eq("id", passage.id);

      if (updateError) throw updateError;

      passagesUpdated += 1;
      translationRows += slice.length;
    }

    const anchor = resolveQuestionIdFromIndex(questionIndex, entry.questionId);
    if (anchor) {
      await supabase
        .from("questions")
        .update({ translations: [] })
        .eq("id", anchor.dbId)
        .eq("book_id", bookId)
        .eq("test_id", testId);
    }
  }

  if (passagesUpdated === 0) {
    const detail =
      notFoundQuestionIds.length > 0
        ? `Không tìm thấy câu hỏi: ${notFoundQuestionIds.join(", ")}`
        : notFoundPassageSlugs.length > 0
          ? `Không tìm thấy đoạn văn: ${notFoundPassageSlugs.join(", ")}`
          : "Không có bản dịch hợp lệ trong file.";
    throw new Error(detail);
  }

  return {
    bookId,
    testId,
    part: 7,
    questionsUpdated: 0,
    passagesUpdated,
    translationRows,
    notFoundQuestionIds,
    notFoundPassageSlugs,
  };
}

async function importPart7SlugKeyedTranslations(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  entries: Part7PassageTranslationImportSet[],
  questionIndex: Awaited<ReturnType<typeof loadPassageTranslationQuestionIndex>>,
  passageIndex: Awaited<ReturnType<typeof loadPassageTranslationPassageIndex>>,
): Promise<ImportPassageTranslationsSummary> {
  const notFoundQuestionIds: string[] = [];
  const notFoundPassageSlugs: string[] = [];
  let passagesUpdated = 0;
  let translationRows = 0;

  for (const entry of entries) {
    const passageSetId = resolvePassageSetIdFromQuestionIndex(
      questionIndex,
      entry.questionId,
    );
    if (!passageSetId) {
      notFoundQuestionIds.push(entry.questionId);
      continue;
    }

    for (const passageBlock of entry.passages) {
      const translations = filterTranslationRows(passageBlock.translations);
      if (translations.length === 0) {
        continue;
      }

      const resolved = resolvePassageSlugFromIndex(
        passageIndex,
        passageBlock.passageSlug,
      );
      if (!resolved) {
        notFoundPassageSlugs.push(passageBlock.passageSlug);
        continue;
      }

      const passageRow = passageIndex.rows.find((row) => row.id === resolved.dbId);
      if (!passageRow || passageRow.passageSetId !== passageSetId) {
        notFoundPassageSlugs.push(passageBlock.passageSlug);
        continue;
      }

      const passageUpdate: {
        translations: Array<{ english: string; vietnamese: string }>;
        translation_html?: string;
      } = { translations };

      const passageTranslation = passageBlock.passageTranslation?.trim();
      if (passageTranslation) {
        passageUpdate.translation_html = passageTranslation;
      }

      const { error: updateError } = await supabase
        .from("reading_passages")
        .update(passageUpdate)
        .eq("id", resolved.dbId);

      if (updateError) throw updateError;

      passagesUpdated += 1;
      translationRows += translations.length;
    }
  }

  if (passagesUpdated === 0) {
    const detail =
      notFoundQuestionIds.length > 0
        ? `Không tìm thấy câu hỏi: ${notFoundQuestionIds.join(", ")}`
        : notFoundPassageSlugs.length > 0
          ? `Không tìm thấy đoạn văn: ${notFoundPassageSlugs.join(", ")}`
          : "Không có bản dịch hợp lệ trong file.";
    throw new Error(detail);
  }

  return {
    bookId,
    testId,
    part: 7,
    questionsUpdated: 0,
    passagesUpdated,
    translationRows,
    notFoundQuestionIds,
    notFoundPassageSlugs,
  };
}

export async function importPassageTranslationsFromRaw(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  part: 3 | 4 | 6 | 7,
  raw: string,
): Promise<ImportPassageTranslationsSummary> {
  passageTranslationDebugLog(
    "import-passage-translations.ts:entry",
    "import raw start",
    {
      bookId,
      testId,
      part,
      rawLength: raw.length,
      rawPreview: raw.slice(0, 200),
    },
    "H6",
  );

  const parsed = JSON.parse(raw) as unknown;
  const questionIndex = await loadPassageTranslationQuestionIndex(
    supabase,
    bookId,
    testId,
    part,
  );

  if (part === 7) {
    const passageIndex = await loadPassageTranslationPassageIndex(
      supabase,
      bookId,
      testId,
    );

    if (isPart7PassageTranslationImportPayload(parsed)) {
      const entries = normalizePart7PassageTranslationImportFile(
        part7PassageTranslationImportFileSchema.parse(parsed),
      );

      if (entries.some(isPart7ProcessImportSet)) {
        assertPart7ProcessImportSets(entries);
      }

      const translationSummary = await importPart7SlugKeyedTranslations(
        supabase,
        bookId,
        testId,
        entries,
        questionIndex,
        passageIndex,
      );

      if (entries.some(isPart7ProcessImportSet)) {
        const enrichmentSummary = await importPart7ProcessEnrichment(
          supabase,
          bookId,
          testId,
          entries,
          questionIndex,
        );

        return {
          ...translationSummary,
          questionsUpdated: enrichmentSummary.questionsUpdated,
          setsTopicUpdated: enrichmentSummary.setsTopicUpdated,
          notFoundQuestionIds: [
            ...new Set([
              ...translationSummary.notFoundQuestionIds,
              ...enrichmentSummary.notFoundQuestionIds,
            ]),
          ],
        };
      }

      return translationSummary;
    }

    const legacyEntries = normalizePassageTranslationImportFile(
      passageTranslationImportFileSchema.parse(parsed),
    );
    return importLegacyPart7FlatTranslations(
      supabase,
      bookId,
      testId,
      legacyEntries,
      questionIndex,
      passageIndex,
    );
  }

  const entries = normalizePassageTranslationImportFile(
    passageTranslationImportFileSchema.parse(parsed),
  );

  return importLegacyQuestionTranslations(
    supabase,
    bookId,
    testId,
    part,
    entries,
    questionIndex,
  );
}
