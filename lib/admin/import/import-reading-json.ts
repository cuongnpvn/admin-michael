import type { SupabaseClient } from "@supabase/supabase-js";
import { importLog, importError } from "@/lib/admin/import/exam-import-log";
import {
  clearReadingContent,
  clearReadingParts,
  type ReadingPartNumber,
} from "@/lib/content/clear-reading-content";
import { insertDraftBundle } from "@/lib/content/insert-draft-bundle";
import {
  draftBundleFromReadingImport,
  readingImportMetaParts,
} from "@/lib/content/reading-import-to-draft";
import { parseReadingImportFile } from "@/lib/content/reading-import-schema";
import { assertUniqueGlobalItemNumbers } from "@/lib/content/validate-import-question-numbers";
import { upsertTestPartsFromMeta } from "@/lib/content/upsert-test-parts";
import type { DraftQuestionRow } from "@/lib/content/draft-types";

export interface ImportReadingJsonSummary {
  bookId: string;
  testId: string;
  questionCount: number;
  partsUpdated: number[];
  missingAnswerKeys: boolean;
  globalItemNumberMin: number;
  globalItemNumberMax: number;
  published: false;
}

function assertReadingGlobalItemNumbers(
  questions: DraftQuestionRow[],
  options: { requireFullTest?: boolean },
): {
  min: number;
  max: number;
} {
  const readingQuestions = questions.filter(
    (question) => question.part >= 5 && question.part <= 7,
  );

  if (options.requireFullTest !== false && readingQuestions.length !== 100) {
    throw new Error(
      `Reading import must contain 100 questions (got ${readingQuestions.length})`,
    );
  }

  return assertUniqueGlobalItemNumbers(readingQuestions);
}

async function assertNoOccupiedGlobalItemNumbers(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  questions: DraftQuestionRow[],
): Promise<void> {
  const globals = [
    ...new Set(
      questions
        .map((question) => question.globalItemNumber)
        .filter((value): value is number => typeof value === "number"),
    ),
  ];

  if (globals.length === 0) return;

  const { data, error } = await supabase
    .from("questions")
    .select("global_item_number, part, slug")
    .eq("book_id", bookId)
    .eq("test_id", testId)
    .in("global_item_number", globals);

  if (error) throw error;

  if (data && data.length > 0) {
    const conflicts = data.map(
      (row) =>
        `${row.global_item_number} (part ${row.part}, ${row.slug})`,
    );
    throw new Error(
      `Global item number conflict with existing questions: ${conflicts.join(", ")}`,
    );
  }
}

export interface ImportReadingJsonOptions {
  /**
   * `all` — replace every reading part (5–7). Default for standalone import.
   * `file-parts` — clear and replace only parts present in the JSON file.
   */
  clearMode?: "all" | "file-parts";
}

export async function importReadingJsonFromRaw(
  supabase: SupabaseClient,
  raw: string,
  options: ImportReadingJsonOptions = {},
): Promise<ImportReadingJsonSummary> {
  const clearMode = options.clearMode ?? "all";
  importLog("reading_import_parse_start", { clearMode, rawChars: raw.length });

  let file;
  try {
    file = parseReadingImportFile(raw);
  } catch (error) {
    importError("reading_import_parse_failed", { clearMode }, error);
    throw error;
  }

  importLog("reading_import_parsed", {
    bookId: file.bookId,
    testId: file.testId,
    parts: file.parts.map((part) => ({
      part: part.part,
      title: part.title,
      questionCount:
        part.part === 5
          ? part.questions.length
          : part.passageSets.reduce((sum, set) => sum + set.questions.length, 0),
      setCount: part.part === 5 ? 0 : part.passageSets.length,
    })),
  });

  const { data: testRow, error: testError } = await supabase
    .from("tests")
    .select("id")
    .eq("book_id", file.bookId)
    .eq("id", file.testId)
    .maybeSingle();

  if (testError || !testRow) {
    importError("reading_import_test_not_found", {
      bookId: file.bookId,
      testId: file.testId,
    }, testError);
    throw new Error(`Test not found: ${file.bookId}/${file.testId}`);
  }

  importLog("reading_import_draft_start", {
    bookId: file.bookId,
    testId: file.testId,
  });
  const draftBundle = draftBundleFromReadingImport(file);
  importLog("reading_import_draft_built", {
    questionCount: draftBundle.questions.length,
    passageSetCount: draftBundle.readingPassageSets.length,
    passageSets: draftBundle.readingPassageSets.map((set, index) => ({
      index: index + 1,
      slug: set.slug,
      part: set.part,
      topic: set.topic,
      passageCount: set.passages.length,
      questionCount: set.questionSlugs.length,
    })),
    globalItemNumbers: draftBundle.questions.map((question) => ({
      slug: question.slug,
      part: question.part,
      globalItemNumber: question.globalItemNumber,
    })),
  });

  const { min: globalItemNumberMin, max: globalItemNumberMax } =
    assertReadingGlobalItemNumbers(draftBundle.questions, {
      requireFullTest: clearMode === "all",
    });
  const missingAnswerKeys = draftBundle.questions.some(
    (question) => !question.correctOptionSlug,
  );

  if (clearMode === "file-parts") {
    const parts = file.parts.map(
      (part) => part.part,
    ) as ReadingPartNumber[];
    importLog("reading_import_clear_parts", { parts });
    await clearReadingParts(supabase, file.bookId, file.testId, parts);
  } else {
    importLog("reading_import_clear_all", {
      bookId: file.bookId,
      testId: file.testId,
    });
    await clearReadingContent(supabase, file.bookId, file.testId);
  }

  await assertNoOccupiedGlobalItemNumbers(
    supabase,
    file.bookId,
    file.testId,
    draftBundle.questions,
  );

  importLog("reading_import_upsert_meta", {
    partTitles: draftBundle.partTitles,
  });
  await upsertTestPartsFromMeta(supabase, {
    bookId: file.bookId,
    testId: file.testId,
    title: file.title,
    parts: readingImportMetaParts(file).map((part) => ({
      part: part.part,
      title: part.title,
      questionCount: part.questionCount,
    })),
  });

  importLog("reading_import_insert_start", {
    questionCount: draftBundle.questions.length,
    passageSetCount: draftBundle.readingPassageSets.length,
  });
  try {
    await insertDraftBundle(supabase, draftBundle);
  } catch (error) {
    importError("reading_import_insert_failed", {
      bookId: file.bookId,
      testId: file.testId,
    }, error);
    throw error;
  }

  importLog("reading_import_done", {
    bookId: file.bookId,
    testId: file.testId,
    questionCount: draftBundle.questions.length,
    missingAnswerKeys,
    globalItemNumberMin,
    globalItemNumberMax,
  });

  return {
    bookId: file.bookId,
    testId: file.testId,
    questionCount: draftBundle.questions.length,
    partsUpdated: file.parts.map((part) => part.part),
    missingAnswerKeys,
    globalItemNumberMin,
    globalItemNumberMax,
    published: false,
  };
}
