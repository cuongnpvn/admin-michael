import type { AdminInstructionId } from "@/lib/admin/instructions/catalog";
import {
  EXAM_PART_MODULES,
  examModuleSupportsContentVocabulary,
  examModuleSupportsTranslation,
} from "@/lib/admin/instructions/exam-part-modules";

export type ExamModulePdfMap = Partial<Record<AdminInstructionId, File | null>>;

export type ApplyTranslationByModule = Partial<
  Record<AdminInstructionId, boolean>
>;

export type ApplyVocabularyByModule = Partial<
  Record<AdminInstructionId, boolean>
>;

export type ReadingPart7PdfPair = { single: File | null; multi: File | null };

export interface CreateExamFormState {
  bookMode: "existing" | "new";
  bookId: string;
  bookName: string;
  testLabel: string;
  modulePdfs: ExamModulePdfMap;
  readingPart7Pdfs: ReadingPart7PdfPair;
  applyTranslationByModule: ApplyTranslationByModule;
  applyVocabularyByModule: ApplyVocabularyByModule;
}

export function emptyModulePdfs(): ExamModulePdfMap {
  return {};
}

export function emptyReadingPart7Pdfs(): ReadingPart7PdfPair {
  return { single: null, multi: null };
}

export function emptyApplyTranslationByModule(): ApplyTranslationByModule {
  const defaults: ApplyTranslationByModule = {};
  for (const module of EXAM_PART_MODULES) {
    if (examModuleSupportsTranslation(module.id)) {
      defaults[module.id] = true;
    }
  }
  return defaults;
}

export function emptyApplyVocabularyByModule(): ApplyVocabularyByModule {
  const defaults: ApplyVocabularyByModule = {};
  for (const module of EXAM_PART_MODULES) {
    if (examModuleSupportsContentVocabulary(module.id)) {
      defaults[module.id] = true;
    }
  }
  return defaults;
}

export function initialCreateExamFormState(
  defaultBookId: string,
  hasBooks: boolean,
): CreateExamFormState {
  return {
    bookMode: hasBooks ? "existing" : "new",
    bookId: defaultBookId,
    bookName: "",
    testLabel: "",
    modulePdfs: emptyModulePdfs(),
    readingPart7Pdfs: emptyReadingPart7Pdfs(),
    applyTranslationByModule: emptyApplyTranslationByModule(),
    applyVocabularyByModule: emptyApplyVocabularyByModule(),
  };
}

export function shouldApplyTranslationForModule(
  moduleId: AdminInstructionId,
  applyTranslationByModule: ApplyTranslationByModule,
): boolean {
  return (
    examModuleSupportsTranslation(moduleId) &&
    applyTranslationByModule[moduleId] === true
  );
}

/** Part 3 / Part 7 always run extract → import → process (no toggle). */
export function moduleRunsProcessAutomatically(
  moduleId: AdminInstructionId,
): boolean {
  return moduleId === "reading-part-7" || moduleId === "listening-part-3";
}

export function shouldRunModuleProcess(
  moduleId: AdminInstructionId,
  applyTranslationByModule: ApplyTranslationByModule,
): boolean {
  if (!examModuleSupportsTranslation(moduleId)) return false;
  if (moduleRunsProcessAutomatically(moduleId)) return true;
  return applyTranslationByModule[moduleId] === true;
}

/** Part 3 optional transcript translation (separate from automatic process enrichment). */
export function shouldApplyListeningTranscriptTranslation(
  moduleId: AdminInstructionId,
  applyTranslationByModule: ApplyTranslationByModule,
): boolean {
  return (
    moduleId === "listening-part-3" &&
    applyTranslationByModule[moduleId] === true
  );
}

export function shouldApplyVocabularyForModule(
  moduleId: AdminInstructionId,
  applyVocabularyByModule: ApplyVocabularyByModule,
): boolean {
  return (
    examModuleSupportsContentVocabulary(moduleId) &&
    applyVocabularyByModule[moduleId] === true
  );
}

export function isReadingPart7Uploaded(pdfs: ReadingPart7PdfPair): boolean {
  return Boolean(pdfs.single && pdfs.multi);
}

export function hasPartialReadingPart7Upload(pdfs: ReadingPart7PdfPair): boolean {
  return Boolean(pdfs.single || pdfs.multi) && !isReadingPart7Uploaded(pdfs);
}

export function countModulePdfs(
  pdfs: ExamModulePdfMap,
  readingPart7Pdfs: ReadingPart7PdfPair = emptyReadingPart7Pdfs(),
): number {
  return EXAM_PART_MODULES.filter((module) => {
    if (module.id === "reading-part-7") {
      return isReadingPart7Uploaded(readingPart7Pdfs);
    }
    return pdfs[module.id];
  }).length;
}

export function uploadedExamModules(
  pdfs: ExamModulePdfMap,
  readingPart7Pdfs: ReadingPart7PdfPair = emptyReadingPart7Pdfs(),
) {
  return EXAM_PART_MODULES.filter((module) => {
    if (module.id === "reading-part-7") {
      return isReadingPart7Uploaded(readingPart7Pdfs);
    }
    return pdfs[module.id];
  });
}

export function buildInitFormData(state: CreateExamFormState): FormData {
  const formData = new FormData();
  formData.set("bookMode", state.bookMode);
  formData.set("testLabel", state.testLabel.trim());
  if (state.bookMode === "existing") {
    formData.set("bookId", state.bookId);
  } else {
    formData.set("bookName", state.bookName.trim());
  }
  return formData;
}

export function buildGeminiFormData(
  moduleId: AdminInstructionId,
  pdf: File,
  bookId?: string,
  testId?: string,
): FormData {
  const formData = new FormData();
  formData.set("moduleId", moduleId);
  formData.set("pdf", pdf);
  if (bookId) formData.set("bookId", bookId);
  if (testId) formData.set("testId", testId);
  return formData;
}

export function buildReadingPart7GeminiFormData(
  single: File,
  multi: File,
  bookId?: string,
  testId?: string,
): FormData {
  const formData = new FormData();
  formData.set("pdfSingle", single);
  formData.set("pdfMulti", multi);
  if (bookId) formData.set("bookId", bookId);
  if (testId) formData.set("testId", testId);
  return formData;
}
