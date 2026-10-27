import { yieldProgressUi } from "@/components/admin/exams/admin-create-exam-test-progress";
import type { ExamModulePhaseStatus } from "@/components/admin/exams/admin-create-exam-test-progress";
import {
  exportExamGroupedQuestionTags,
  extractExamGroupedQuestionTags,
  importExamGroupedQuestionTags,
} from "@/lib/admin/content/grouped-question-tags-actions";
import type { GroupedTagPart } from "@/lib/admin/content/map-question-tag-updates";

type ProgressPatch = Partial<ExamModulePhaseStatus>;
type OnPhaseProgress = (patch: ProgressPatch) => void;

export type GroupedTagRunResult =
  | { ok: true; skipped?: boolean }
  | { ok: false; error: string };

export async function runGroupedQuestionTagsWithProgress(
  bookId: string,
  testId: string,
  part: GroupedTagPart,
  onProgress: OnPhaseProgress,
): Promise<GroupedTagRunResult> {
  onProgress({ status: "running", detail: "exporting" });
  await yieldProgressUi();

  const exportResult = await exportExamGroupedQuestionTags(bookId, testId, part);
  if (!exportResult.ok) {
    onProgress({
      status: "error",
      detail: "exporting",
      error: exportResult.error,
    });
    return exportResult;
  }

  if (exportResult.skipped || !exportResult.exportJson) {
    onProgress({ status: "skipped" });
    return { ok: true, skipped: true };
  }

  onProgress({ status: "running", detail: "sending" });
  await yieldProgressUi();
  onProgress({ status: "running", detail: "waiting" });
  await yieldProgressUi();

  const extractResult = await extractExamGroupedQuestionTags(
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

  const importResult = await importExamGroupedQuestionTags(
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
