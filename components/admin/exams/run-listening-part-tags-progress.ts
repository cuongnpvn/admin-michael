import { yieldProgressUi } from "@/components/admin/exams/admin-create-exam-test-progress";
import type { ExamModulePhaseStatus } from "@/components/admin/exams/admin-create-exam-test-progress";
import {
  exportExamListeningPartTags,
  extractExamListeningPartTags,
  importExamListeningPartTags,
} from "@/lib/admin/content/listening-part12-tags-actions";

type ProgressPatch = Partial<ExamModulePhaseStatus>;
type OnPhaseProgress = (patch: ProgressPatch) => void;

export async function runListeningPartTagsWithProgress(
  bookId: string,
  testId: string,
  part: 1 | 2,
  onProgress: OnPhaseProgress,
): Promise<{ ok: true } | { ok: false; error: string }> {
  onProgress({ status: "running", detail: "exporting" });
  await yieldProgressUi();

  const exportResult = await exportExamListeningPartTags(bookId, testId, part);
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

  const extractResult = await extractExamListeningPartTags(
    bookId,
    testId,
    part,
    exportResult.exportJson,
  );
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

  const importResult = await importExamListeningPartTags(
    bookId,
    testId,
    part,
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
