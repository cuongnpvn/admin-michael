"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Tags } from "lucide-react";
import { toast } from "sonner";
import {
  PassageTranslationProgressPanel,
  type ExamModulePhaseStatus,
  type ExamProgressLabels,
} from "@/components/admin/exams/admin-create-exam-test-progress";
import { runGroupedQuestionTagsWithProgress } from "@/components/admin/exams/run-grouped-question-tags-progress";
import { runListeningPartTagsWithProgress } from "@/components/admin/exams/run-listening-part-tags-progress";
import { runPart5TagsWithProgress } from "@/components/admin/exams/run-part5-tags-progress";
import { copy } from "@/lib/copy/vi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const TAGGED_PARTS = [1, 2, 3, 4, 5, 6, 7] as const;
type TaggedPart = (typeof TAGGED_PARTS)[number];

function isNoQuestionsError(error: string): boolean {
  return /has no Part \d+ questions to tag/i.test(error);
}

interface ImportExamTagsDialogProps {
  bookId: string;
  testId: string;
  disabled?: boolean;
}

function pendingParts(): Record<TaggedPart, ExamModulePhaseStatus> {
  return {
    1: { status: "pending" },
    2: { status: "pending" },
    3: { status: "pending" },
    4: { status: "pending" },
    5: { status: "pending" },
    6: { status: "pending" },
    7: { status: "pending" },
  };
}

function useExamTagsProgressLabels(partLabel: string): ExamProgressLabels {
  const wizardCopy = copy.admin.exams.create.wizard;

  return useMemo(
    (): ExamProgressLabels => ({
      init: wizardCopy.progressInit,
      finalize: wizardCopy.progressFinalize,
      gemini: wizardCopy.progressGeminiPhase,
      import: wizardCopy.progressImportPhase,
      translation: partLabel,
      vocabulary: wizardCopy.progressVocabularyPhase,
      done: wizardCopy.done,
      skipped: wizardCopy.skipped,
      failed: wizardCopy.failed,
      pending: wizardCopy.progressPending,
      running: wizardCopy.progressRunning,
      waiting: wizardCopy.progressWaiting,
      sending: wizardCopy.progressSending,
      importing: wizardCopy.progressImporting,
      exporting: wizardCopy.progressExporting,
      translating: wizardCopy.progressTranslating,
      validationRetry: wizardCopy.progressValidationRetry,
      tabSystem: wizardCopy.progressTabSystem,
      stepGeminiSend: wizardCopy.stepGeminiSend,
      stepGeminiWait: wizardCopy.stepGeminiWait,
      stepGeminiParse: wizardCopy.stepGeminiParse,
      downloadGeminiJson: wizardCopy.downloadGeminiJson,
      stepImportSupabase: wizardCopy.stepImportSupabase,
      stepTranslationExport: wizardCopy.stepTranslationExport,
      stepTranslationGeminiSend: wizardCopy.stepTranslationGeminiSend,
      stepTranslationGeminiWait: wizardCopy.stepTranslationGeminiWait,
      stepTranslationImport: wizardCopy.stepTranslationImport,
      stepInitRecord: wizardCopy.stepInitRecord,
      stepFinalizeCache: wizardCopy.stepFinalizeCache,
      moduleTabLabel: wizardCopy.moduleTabLabel,
      resultAllSuccess: wizardCopy.resultAllSuccess,
      resultPartial: wizardCopy.resultPartial,
      resultAllFailed: wizardCopy.resultAllFailed,
      retryHint: wizardCopy.retryHint,
      viewTest: wizardCopy.viewTest,
    }),
    [partLabel, wizardCopy],
  );
}

function PartTagsProgress({
  part,
  status,
  isFinished,
}: {
  part: TaggedPart;
  status: ExamModulePhaseStatus;
  isFinished: boolean;
}) {
  const labels = useExamTagsProgressLabels(
    copy.admin.examTagsImport.partLabel(part),
  );
  return (
    <PassageTranslationProgressPanel
      translation={status}
      labels={labels}
      isFinished={isFinished}
    />
  );
}

export function ImportExamTagsDialog({
  bookId,
  testId,
  disabled,
}: ImportExamTagsDialogProps) {
  const router = useRouter();
  const tagsCopy = copy.admin.examTagsImport;
  const [open, setOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [progress, setProgress] = useState(pendingParts);

  function patchPart(
    part: TaggedPart,
    patch: Partial<ExamModulePhaseStatus>,
  ) {
    setProgress((current) => ({
      ...current,
      [part]: { ...current[part], ...patch },
    }));
  }

  async function handleGenerate() {
    setIsRunning(true);
    setIsComplete(false);
    setProgress(pendingParts());

    for (const part of TAGGED_PARTS) {
      const result =
        part === 5
          ? await runPart5TagsWithProgress(bookId, testId, (patch) =>
              patchPart(5, patch),
            )
          : part === 1 || part === 2
            ? await runListeningPartTagsWithProgress(
                bookId,
                testId,
                part,
                (patch) => patchPart(part, patch),
              )
            : await runGroupedQuestionTagsWithProgress(
                bookId,
                testId,
                part,
                (patch) => patchPart(part, patch),
              );

      if (result.ok && "skipped" in result && result.skipped) {
        patchPart(part, { status: "skipped" });
        continue;
      }

      if (!result.ok) {
        if (isNoQuestionsError(result.error)) {
          patchPart(part, { status: "skipped" });
          continue;
        }
        setIsRunning(false);
        setIsComplete(true);
        toast.error(result.error);
        return;
      }
    }

    setIsRunning(false);
    setIsComplete(true);
    toast.success(tagsCopy.geminiSuccess);
    router.refresh();
  }

  const showProgress =
    isRunning ||
    isComplete ||
    TAGGED_PARTS.some((part) => progress[part].status !== "pending");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" disabled={disabled}>
          <Tags className="size-4" />
          {copy.admin.cms.addPart5Tags}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tagsCopy.title}</DialogTitle>
          <DialogDescription>{tagsCopy.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {showProgress
            ? TAGGED_PARTS.map((part) => (
                <PartTagsProgress
                  key={part}
                  part={part}
                  status={progress[part]}
                  isFinished={
                    isComplete ||
                    progress[part].status === "done" ||
                    progress[part].status === "skipped"
                  }
                />
              ))
            : null}
          <Button
            type="button"
            className="w-full"
            disabled={disabled || isRunning}
            onClick={() => void handleGenerate()}
          >
            <Sparkles className="size-4" />
            {isRunning ? copy.auth.signingIn : tagsCopy.geminiButton}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
