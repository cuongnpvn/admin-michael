import { importListeningJsonFromRaw } from "@/lib/admin/import/import-listening-json";
import { importReadingJsonFromRaw } from "@/lib/admin/import/import-reading-json";
import { mergeCreateExamReadingImport } from "@/lib/admin/import/merge-create-exam-reading-parts";
import { patchSectionImportIds } from "@/lib/admin/import/patch-section-import-ids";
import {
  createExamListeningPart12JsonPrecheck,
  createExamListeningSinglePartJsonPrecheck,
  sectionImportPrecheck,
} from "@/lib/admin/import/section-import-precheck";
import { elapsedMs, previewText } from "@/lib/admin/gemini/gemini-log";
import type { AdminInstructionId } from "@/lib/admin/instructions/catalog";
import { examPartModuleById } from "@/lib/admin/instructions/exam-part-modules";
import {
  parseCreateExamListeningPart12File,
  parseCreateExamListeningPart3File,
  parseCreateExamListeningPart4File,
  type CreateExamListeningPart12File,
  type CreateExamListeningPart3File,
  type CreateExamListeningPart4File,
} from "@/lib/content/listening-import-schema";
import { isEntranceTestBook } from "@/lib/content/catalog-ids";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  importError,
  importLog,
} from "@/lib/admin/import/exam-import-log";

export async function importListeningPart12Raw(
  supabase: SupabaseClient,
  raw: string,
  bookId: string,
  testId: string,
  testLabel: string,
): Promise<void> {
  importLog("listening_part12_start", { bookId, testId, rawChars: raw.length });
  const precheckError = createExamListeningPart12JsonPrecheck(raw);
  if (precheckError) {
    importError("listening_part12_precheck_failed", {
      bookId,
      testId,
      precheckError,
      rawPreview: previewText(raw, 400),
    });
    throw new Error(precheckError);
  }

  const patched = patchSectionImportIds(raw, bookId, testId, testLabel);
  let file: CreateExamListeningPart12File;
  try {
    file = parseCreateExamListeningPart12File(patched, {
      skipOfficialQuestionCount: isEntranceTestBook(bookId),
    });
  } catch (error) {
    importError(
      "listening_part12_schema_failed",
      { bookId, testId, rawPreview: previewText(raw, 400) },
      error,
    );
    throw error;
  }
  await importListeningJsonFromRaw(supabase, patched, {
    file,
    clearMode: "file-parts",
  });
  importLog("listening_part12_done", { bookId, testId, parts: file.parts.length });
}

export async function importListeningPart3Raw(
  supabase: SupabaseClient,
  raw: string,
  bookId: string,
  testId: string,
  testLabel: string,
): Promise<void> {
  importLog("listening_part3_start", { bookId, testId, rawChars: raw.length });
  const precheckError = createExamListeningSinglePartJsonPrecheck(raw, 3);
  if (precheckError) {
    importError("listening_part3_precheck_failed", {
      bookId,
      testId,
      precheckError,
      rawPreview: previewText(raw, 400),
    });
    throw new Error(precheckError);
  }

  const patched = patchSectionImportIds(raw, bookId, testId, testLabel);
  let file: CreateExamListeningPart3File;
  try {
    file = parseCreateExamListeningPart3File(patched, {
      skipOfficialQuestionCount: isEntranceTestBook(bookId),
    });
  } catch (error) {
    importError(
      "listening_part3_schema_failed",
      { bookId, testId, rawPreview: previewText(raw, 400) },
      error,
    );
    throw error;
  }
  await importListeningJsonFromRaw(supabase, patched, {
    file,
    clearMode: "file-parts",
  });
  importLog("listening_part3_done", { bookId, testId, parts: file.parts.length });
}

export async function importListeningPart4Raw(
  supabase: SupabaseClient,
  raw: string,
  bookId: string,
  testId: string,
  testLabel: string,
): Promise<void> {
  importLog("listening_part4_start", { bookId, testId, rawChars: raw.length });
  const precheckError = createExamListeningSinglePartJsonPrecheck(raw, 4);
  if (precheckError) {
    importError("listening_part4_precheck_failed", {
      bookId,
      testId,
      precheckError,
      rawPreview: previewText(raw, 400),
    });
    throw new Error(precheckError);
  }

  const patched = patchSectionImportIds(raw, bookId, testId, testLabel);
  let file: CreateExamListeningPart4File;
  try {
    file = parseCreateExamListeningPart4File(patched, {
      skipOfficialQuestionCount: isEntranceTestBook(bookId),
    });
  } catch (error) {
    importError(
      "listening_part4_schema_failed",
      { bookId, testId, rawPreview: previewText(raw, 400) },
      error,
    );
    throw error;
  }
  await importListeningJsonFromRaw(supabase, patched, {
    file,
    clearMode: "file-parts",
  });
  importLog("listening_part4_done", { bookId, testId, parts: file.parts.length });
}

export async function importReadingPartRaw(
  supabase: SupabaseClient,
  raw: string,
  part: 5 | 6 | 7,
  bookId: string,
  testId: string,
  testLabel: string,
): Promise<void> {
  importLog("reading_part_start", { bookId, testId, part, rawChars: raw.length });

  let mergedReadingImport: string | null;
  try {
    mergedReadingImport = mergeCreateExamReadingImport(
      { [part]: raw },
      bookId,
      testId,
      testLabel,
    );
  } catch (error) {
    importError("reading_part_merge_failed", { bookId, testId, part }, error);
    throw error;
  }

  if (!mergedReadingImport) {
    importError("reading_part_merge_empty", { bookId, testId, part });
    return;
  }

  const precheckError = sectionImportPrecheck(mergedReadingImport, "reading");
  if (precheckError) {
    importError("reading_part_precheck_failed", {
      bookId,
      testId,
      part,
      precheckError,
      rawPreview: previewText(raw, 400),
    });
    throw new Error(precheckError);
  }

  importLog("reading_part_import_db_start", { bookId, testId, part });
  try {
    await importReadingJsonFromRaw(supabase, mergedReadingImport, {
      clearMode: "file-parts",
    });
  } catch (error) {
    importError("reading_part_import_db_failed", { bookId, testId, part }, error);
    throw error;
  }

  importLog("reading_part_done", { bookId, testId, part });
}

export async function importExamPartFromRawData(
  supabase: SupabaseClient,
  moduleId: AdminInstructionId,
  rawJson: string,
  bookId: string,
  testId: string,
  testLabel: string,
): Promise<void> {
  const startedAt = performance.now();
  importLog("module_import_start", {
    moduleId,
    bookId,
    testId,
    rawJsonChars: rawJson.length,
  });

  try {
    const examModule = examPartModuleById(moduleId);
    if (!examModule) {
      throw new Error(`Unknown exam module: ${moduleId}`);
    }

    if (examModule.id === "listening-parts-1-2") {
      await importListeningPart12Raw(supabase, rawJson, bookId, testId, testLabel);
    } else if (examModule.listeningPart === 3) {
      await importListeningPart3Raw(supabase, rawJson, bookId, testId, testLabel);
    } else if (examModule.listeningPart === 4) {
      await importListeningPart4Raw(supabase, rawJson, bookId, testId, testLabel);
    } else if (examModule.readingPart) {
      await importReadingPartRaw(
        supabase,
        rawJson,
        examModule.readingPart,
        bookId,
        testId,
        testLabel,
      );
    }

    importLog("module_import_done", {
      moduleId,
      bookId,
      testId,
      totalMs: elapsedMs(startedAt),
    });
  } catch (error) {
    importError(
      "module_import_failed",
      {
        moduleId,
        bookId,
        testId,
        totalMs: elapsedMs(startedAt),
      },
      error,
    );
    throw error;
  }
}