"use server";

import { revalidateAdminExamCatalogPaths } from "@/lib/admin/revalidate-admin-exam-catalog";
import { ZodError } from "zod";
import { AdminAccessError, requireAdminSession } from "@/lib/admin/auth/require-admin";
import {
  importExamPartFromRawData,
  importListeningPart12Raw,
  importListeningPart3Raw,
  importListeningPart4Raw,
  importReadingPartRaw,
} from "@/lib/admin/content/import-exam-part-helpers";
import type { CreateExamStepResult } from "@/lib/admin/content/create-exam-test-pipeline";
import { buildListeningPart12TranslationExport } from "@/lib/admin/export/build-listening-part12-translation-export";
import { buildListeningPart3ProcessExport } from "@/lib/admin/export/build-listening-part3-process-export";
import { buildListeningTranslationExport } from "@/lib/admin/export/build-listening-translation-export";
import { buildPassageTranslationExport } from "@/lib/admin/export/build-passage-translation-export";
import { buildReadingPart5TranslationExport } from "@/lib/admin/export/build-reading-part5-translation-export";
import { extractListeningPart12TranslationsFromExportJson } from "@/lib/admin/gemini/extract-listening-part12-translations-from-json";
import { extractListeningPart3ProcessFromExportJson } from "@/lib/admin/gemini/extract-listening-part3-process-from-json";
import { extractListeningTranscriptTranslationsFromExportJson } from "@/lib/admin/gemini/extract-listening-transcript-translations-from-json";
import { extractPassageTranslationsFromExportJson } from "@/lib/admin/gemini/extract-passage-translations-from-json";
import { extractReadingPart5TranslationsFromExportJson } from "@/lib/admin/gemini/extract-reading-part5-translations-from-json";
import { generateAndImportContentVocabulary } from "@/lib/admin/content/generate-and-import-content-vocabulary";
import { generateAndImportListeningPart12Translations } from "@/lib/admin/content/generate-and-import-listening-part12-translations";
import { generateAndImportListeningPart3Process } from "@/lib/admin/content/generate-and-import-listening-part3-process";
import { generateAndImportListeningTranslations } from "@/lib/admin/content/generate-and-import-listening-translations";
import { generateAndImportPassageTranslations } from "@/lib/admin/content/generate-and-import-passage-translations";
import { generateAndImportReadingPart5Translations } from "@/lib/admin/content/generate-and-import-reading-part5-translations";
import { buildContentVocabularyExport } from "@/lib/admin/export/build-content-vocabulary-export";
import { extractContentVocabularyFromExportJson } from "@/lib/admin/gemini/extract-content-vocabulary-from-json";
import { importContentVocabularyFromRaw } from "@/lib/admin/import/import-content-vocabulary";
import { importListeningPart12TranslationsFromRaw } from "@/lib/admin/import/import-listening-part12-translations";
import { importListeningPart3ProcessEnrichment } from "@/lib/admin/import/import-listening-part3-process-enrichment";
import { loadPassageTranslationQuestionIndex } from "@/lib/admin/import/passage-translation-question-index";
import { importPassageTranslationsFromRaw } from "@/lib/admin/import/import-passage-translations";
import { importReadingPart5TranslationsFromRaw } from "@/lib/admin/import/import-reading-part5-translations";
import type { ContentVocabularyPart } from "@/lib/content/content-vocabulary-export-schema";
import {
  listeningPart3ProcessImportFileSchema,
  normalizeListeningPart3ProcessImportFile,
} from "@/lib/content/listening-part3-process-import-schema";
import {
  contentVocabularyPartsForExamModule,
  EXAM_PART_MODULES,
  examModuleSupportsContentVocabulary,
  isListeningPart12TranslationModule,
  isReadingPart5TranslationModule,
  translationPartForExamModule,
} from "@/lib/admin/instructions/exam-part-modules";
import type { AdminInstructionId } from "@/lib/admin/instructions/catalog";
import { copy } from "@/lib/copy/vi";

function isExamModuleId(value: string): value is AdminInstructionId {
  return EXAM_PART_MODULES.some((module) => module.id === value);
}

function accessError(code: string): string {
  if (code === "not_signed_in") return copy.admin.import.errors.notSignedIn;
  if (code === "not_admin") return copy.admin.import.errors.notAdmin;
  return copy.admin.cms.errors.generic;
}

function formatThrownError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    if (typeof record.message === "string" && record.message.trim()) {
      const code =
        typeof record.code === "string" && record.code.trim()
          ? ` (${record.code})`
          : "";
      return `${record.message}${code}`;
    }
  }

  return String(error);
}

function mapImportError(error: unknown): CreateExamStepResult {
  if (error instanceof AdminAccessError) {
    return { ok: false, error: accessError(error.message) };
  }

  if (error instanceof SyntaxError) {
    return { ok: false, error: copy.admin.listeningImport.errors.invalidJson };
  }

  if (error instanceof ZodError) {
    const firstIssue = error.issues[0]?.message;
    return {
      ok: false,
      error:
        firstIssue ?? copy.admin.listeningImport.errors.invalidSchema,
    };
  }

  const message = formatThrownError(error);
  return { ok: false, error: message || copy.admin.cms.errors.generic };
}

export async function importExamPartFromRaw(
  moduleId: AdminInstructionId,
  bookId: string,
  testId: string,
  testLabel: string,
  rawJson: string,
): Promise<CreateExamStepResult> {
  try {
    const { supabase } = await requireAdminSession();
    await importExamPartFromRawData(
      supabase,
      moduleId,
      rawJson,
      bookId,
      testId,
      testLabel,
    );
    revalidateAdminExamCatalogPaths(bookId, testId);
    return { ok: true };
  } catch (error) {
    return mapImportError(error);
  }
}

export async function exportExamPartPassageTranslations(
  moduleId: AdminInstructionId,
  bookId: string,
  testId: string,
): Promise<CreateExamStepResult & { exportJson?: string }> {
  if (isListeningPart12TranslationModule(moduleId)) {
    try {
      const { supabase } = await requireAdminSession();
      const exportEntries = await buildListeningPart12TranslationExport(
        supabase,
        bookId,
        testId,
      );
      if (exportEntries.length === 0) {
        throw new Error(
          "Parts 1–2 have no questions with complete English content to translate.",
        );
      }
      return { ok: true, exportJson: JSON.stringify(exportEntries) };
    } catch (error) {
      return mapImportError(error);
    }
  }

  if (isReadingPart5TranslationModule(moduleId)) {
    try {
      const { supabase } = await requireAdminSession();
      const exportEntries = await buildReadingPart5TranslationExport(
        supabase,
        bookId,
        testId,
      );
      if (exportEntries.length === 0) {
        throw new Error(
          "Part 5 has no questions with complete English content to translate.",
        );
      }
      return { ok: true, exportJson: JSON.stringify(exportEntries) };
    } catch (error) {
      return mapImportError(error);
    }
  }

  if (moduleId === "listening-part-3") {
    try {
      const { supabase } = await requireAdminSession();
      const exportEntries = await buildListeningPart3ProcessExport(
        supabase,
        bookId,
        testId,
      );
      if (exportEntries.length === 0) {
        throw new Error("Part 3 has no listening groups to process.");
      }
      return { ok: true, exportJson: JSON.stringify(exportEntries) };
    } catch (error) {
      return mapImportError(error);
    }
  }

  const part = translationPartForExamModule(moduleId);
  if (!part || part === 3) {
    revalidateAdminExamCatalogPaths(bookId, testId);
    return { ok: true };
  }

  try {
    const { supabase } = await requireAdminSession();
    const exportEntries =
      part === 4
        ? await buildListeningTranslationExport(supabase, bookId, testId, part)
        : await buildPassageTranslationExport(supabase, bookId, testId, part);

    if (exportEntries.length === 0) {
      const label = part === 4 ? "listening groups" : "passage sets";
      throw new Error(`Part ${part} has no ${label} to translate.`);
    }

    return { ok: true, exportJson: JSON.stringify(exportEntries) };
  } catch (error) {
    return mapImportError(error);
  }
}

export async function translateExamPartPassageExport(
  exportJson: string,
  moduleId: AdminInstructionId,
  bookId: string,
  testId: string,
): Promise<CreateExamStepResult & { translationJson?: string }> {
  if (isListeningPart12TranslationModule(moduleId)) {
    try {
      await requireAdminSession();
      const translationJson =
        await extractListeningPart12TranslationsFromExportJson(exportJson);
      return { ok: true, translationJson };
    } catch (error) {
      return mapImportError(error);
    }
  }

  if (isReadingPart5TranslationModule(moduleId)) {
    try {
      await requireAdminSession();
      const translationJson =
        await extractReadingPart5TranslationsFromExportJson(exportJson);
      return { ok: true, translationJson };
    } catch (error) {
      return mapImportError(error);
    }
  }

  if (moduleId === "listening-part-3") {
    try {
      const { supabase } = await requireAdminSession();
      const translationJson = await extractListeningPart3ProcessFromExportJson(
        exportJson,
        { supabase, bookId, testId },
      );
      return { ok: true, translationJson };
    } catch (error) {
      return mapImportError(error);
    }
  }

  const part = translationPartForExamModule(moduleId);
  if (!part || part === 3) {
    revalidateAdminExamCatalogPaths(bookId, testId);
    return { ok: true };
  }

  try {
    const { supabase } = await requireAdminSession();
    const translationJson =
      part === 4
        ? await extractListeningTranscriptTranslationsFromExportJson(
            exportJson,
            part,
          )
        : await extractPassageTranslationsFromExportJson(exportJson, part, {
            supabase,
            bookId,
            testId,
          });
    return { ok: true, translationJson };
  } catch (error) {
    return mapImportError(error);
  }
}

export async function importExamPartPassageTranslationJson(
  moduleId: AdminInstructionId,
  bookId: string,
  testId: string,
  translationJson: string,
): Promise<CreateExamStepResult> {
  if (isListeningPart12TranslationModule(moduleId)) {
    try {
      const { supabase } = await requireAdminSession();
      await importListeningPart12TranslationsFromRaw(
        supabase,
        bookId,
        testId,
        translationJson,
      );
      revalidateAdminExamCatalogPaths(bookId, testId);
      return { ok: true };
    } catch (error) {
      return mapImportError(error);
    }
  }

  if (isReadingPart5TranslationModule(moduleId)) {
    try {
      const { supabase } = await requireAdminSession();
      await importReadingPart5TranslationsFromRaw(
        supabase,
        bookId,
        testId,
        translationJson,
      );
      revalidateAdminExamCatalogPaths(bookId, testId);
      return { ok: true };
    } catch (error) {
      return mapImportError(error);
    }
  }

  if (moduleId === "listening-part-3") {
    try {
      const { supabase } = await requireAdminSession();
      const parsed = JSON.parse(translationJson) as unknown;
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
      revalidateAdminExamCatalogPaths(bookId, testId);
      return { ok: true };
    } catch (error) {
      return mapImportError(error);
    }
  }

  const part = translationPartForExamModule(moduleId);
  if (!part) {
    revalidateAdminExamCatalogPaths(bookId, testId);
    return { ok: true };
  }

  try {
    const { supabase } = await requireAdminSession();
    await importPassageTranslationsFromRaw(
      supabase,
      bookId,
      testId,
      part,
      translationJson,
    );
    revalidateAdminExamCatalogPaths(bookId, testId);
    return { ok: true };
  } catch (error) {
    return mapImportError(error);
  }
}

/** Optional Part 3/4 transcript translation (separate from Part 3 process enrichment). */
export async function exportListeningTranscriptTranslations(
  part: 3 | 4,
  bookId: string,
  testId: string,
): Promise<CreateExamStepResult & { exportJson?: string }> {
  try {
    const { supabase } = await requireAdminSession();
    const exportEntries = await buildListeningTranslationExport(
      supabase,
      bookId,
      testId,
      part,
    );
    if (exportEntries.length === 0) {
      throw new Error(`Part ${part} has no listening groups to translate.`);
    }
    return { ok: true, exportJson: JSON.stringify(exportEntries) };
  } catch (error) {
    return mapImportError(error);
  }
}

export async function translateListeningTranscriptExport(
  exportJson: string,
  part: 3 | 4,
): Promise<CreateExamStepResult & { translationJson?: string }> {
  try {
    await requireAdminSession();
    const translationJson =
      await extractListeningTranscriptTranslationsFromExportJson(
        exportJson,
        part,
      );
    return { ok: true, translationJson };
  } catch (error) {
    return mapImportError(error);
  }
}

export async function importListeningTranscriptTranslationJson(
  part: 3 | 4,
  bookId: string,
  testId: string,
  translationJson: string,
): Promise<CreateExamStepResult> {
  try {
    const { supabase } = await requireAdminSession();
    await importPassageTranslationsFromRaw(
      supabase,
      bookId,
      testId,
      part,
      translationJson,
    );
    revalidateAdminExamCatalogPaths(bookId, testId);
    return { ok: true };
  } catch (error) {
    return mapImportError(error);
  }
}

export async function importExamPartPassageTranslations(
  moduleId: AdminInstructionId,
  bookId: string,
  testId: string,
): Promise<CreateExamStepResult> {
  if (isListeningPart12TranslationModule(moduleId)) {
    try {
      const { supabase } = await requireAdminSession();
      await generateAndImportListeningPart12Translations(
        supabase,
        bookId,
        testId,
      );
      revalidateAdminExamCatalogPaths(bookId, testId);
      return { ok: true };
    } catch (error) {
      return mapImportError(error);
    }
  }

  if (isReadingPart5TranslationModule(moduleId)) {
    try {
      const { supabase } = await requireAdminSession();
      await generateAndImportReadingPart5Translations(
        supabase,
        bookId,
        testId,
      );
      revalidateAdminExamCatalogPaths(bookId, testId);
      return { ok: true };
    } catch (error) {
      return mapImportError(error);
    }
  }

  const part = translationPartForExamModule(moduleId);
  if (!part) {
    revalidateAdminExamCatalogPaths(bookId, testId);
    return { ok: true };
  }

  try {
    const { supabase } = await requireAdminSession();
    if (part === 3) {
      await generateAndImportListeningPart3Process(supabase, bookId, testId);
    } else if (part === 4) {
      await generateAndImportListeningTranslations(
        supabase,
        bookId,
        testId,
        part,
      );
    } else {
      await generateAndImportPassageTranslations(
        supabase,
        bookId,
        testId,
        part,
      );
    }
    revalidateAdminExamCatalogPaths(bookId, testId);
    return { ok: true };
  } catch (error) {
    return mapImportError(error);
  }
}

export async function exportExamPartContentVocabulary(
  part: ContentVocabularyPart,
  bookId: string,
  testId: string,
): Promise<CreateExamStepResult & { exportJson?: string }> {
  try {
    const { supabase } = await requireAdminSession();
    const exportEntries = await buildContentVocabularyExport(
      supabase,
      bookId,
      testId,
      part,
    );
    if (exportEntries.length === 0) {
      throw new Error(
        `Part ${part} has no content units to extract vocabulary.`,
      );
    }
    return { ok: true, exportJson: JSON.stringify(exportEntries) };
  } catch (error) {
    return mapImportError(error);
  }
}

export async function extractExamPartContentVocabularyExport(
  exportJson: string,
  part: ContentVocabularyPart,
): Promise<CreateExamStepResult & { vocabularyJson?: string }> {
  try {
    await requireAdminSession();
    const vocabularyJson = await extractContentVocabularyFromExportJson(
      exportJson,
      part,
    );
    return { ok: true, vocabularyJson };
  } catch (error) {
    return mapImportError(error);
  }
}

export async function importExamPartContentVocabularyJson(
  part: ContentVocabularyPart,
  bookId: string,
  testId: string,
  vocabularyJson: string,
): Promise<CreateExamStepResult> {
  try {
    const { supabase } = await requireAdminSession();
    await importContentVocabularyFromRaw(
      supabase,
      bookId,
      testId,
      part,
      vocabularyJson,
    );
    revalidateAdminExamCatalogPaths(bookId, testId);
    return { ok: true };
  } catch (error) {
    return mapImportError(error);
  }
}

/** Run content-vocabulary for every part in an exam module (create-exam toggle). */
export async function importExamPartContentVocabulary(
  moduleId: AdminInstructionId,
  bookId: string,
  testId: string,
): Promise<CreateExamStepResult> {
  if (!examModuleSupportsContentVocabulary(moduleId)) {
    revalidateAdminExamCatalogPaths(bookId, testId);
    return { ok: true };
  }

  const parts = contentVocabularyPartsForExamModule(moduleId);
  if (parts.length === 0) {
    revalidateAdminExamCatalogPaths(bookId, testId);
    return { ok: true };
  }

  try {
    const { supabase } = await requireAdminSession();
    for (const part of parts) {
      await generateAndImportContentVocabulary(
        supabase,
        bookId,
        testId,
        part,
      );
    }
    revalidateAdminExamCatalogPaths(bookId, testId);
    return { ok: true };
  } catch (error) {
    return mapImportError(error);
  }
}

export {
  importListeningPart12Raw,
  importListeningPart3Raw,
  importListeningPart4Raw,
  importReadingPartRaw,
};
