import { yieldProgressUi } from "@/components/admin/exams/admin-create-exam-test-progress";
import type { ExamModulePhaseStatus } from "@/components/admin/exams/admin-create-exam-test-progress";
import {
  exportExamPart5Tags,
  extractExamPart5TagsExport,
  importExamPart5TagsJson,
} from "@/lib/admin/content/part5-tags-actions";

type ProgressPatch = Partial<ExamModulePhaseStatus>;
type OnPhaseProgress = (patch: ProgressPatch) => void;

export async function runPart5TagsWithProgress(
  bookId: string,
  testId: string,
  onProgress: OnPhaseProgress,
): Promise<{ ok: true } | { ok: false; error: string }> {
  onProgress({ status: "running", detail: "exporting" });
  await yieldProgressUi();

  const exportResult = await exportExamPart5Tags(bookId, testId);
  if (!exportResult.ok || !exportResult.exportJson) {
    onProgress({
      status: "error",
      detail: "exporting",
      error: exportResult.ok ? "Export failed." : exportResult.error,
    });
    return {
      ok: false,
      error: exportResult.ok ? "Export failed." : exportResult.error,
    };
  }

  onProgress({ status: "running", detail: "sending" });
  await yieldProgressUi();
  onProgress({ status: "running", detail: "waiting" });
  await yieldProgressUi();

  const extractResult = await extractExamPart5TagsExport(exportResult.exportJson);
  if (!extractResult.ok || !extractResult.tagsJson) {
    onProgress({
      status: "error",
      detail: "waiting",
      error: extractResult.ok ? "Extract failed." : extractResult.error,
    });
    return {
      ok: false,
      error: extractResult.ok ? "Extract failed." : extractResult.error,
    };
  }

  onProgress({ status: "running", detail: "importing" });
  await yieldProgressUi();

  const importResult = await importExamPart5TagsJson(
    bookId,
    testId,
    extractResult.tagsJson,
  );
  if (!importResult.ok) {
    onProgress({
      status: "error",
      detail: "importing",
      error: importResult.error,
    });
    return importResult;
  }

  onProgress({ status: "done", detail: "complete" });
  return { ok: true };
}
