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
import { runListeningPartTagsWithProgress } from "@/components/admin/exams/run-listening-part-tags-progress";
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

interface ImportListeningPartTagsDialogProps {
  bookId: string;
  testId: string;
  part: 1 | 2;
  disabled?: boolean;
}

function useListeningPartTagsProgressLabels(): ExamProgressLabels {
  const wizardCopy = copy.admin.exams.create.wizard;
  const tagsCopy = copy.admin.listeningPartTagsImport;

  return useMemo(
    (): ExamProgressLabels => ({
      init: wizardCopy.progressInit,
      finalize: wizardCopy.progressFinalize,
      gemini: wizardCopy.progressGeminiPhase,
      import: wizardCopy.progressImportPhase,
      translation: tagsCopy.geminiButton,
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
    [tagsCopy.geminiButton, wizardCopy],
  );
}

function GeminiListeningPartTagsForm({
  bookId,
  testId,
  part,
  disabled,
  onSuccess,
}: {
  bookId: string;
  testId: string;
  part: 1 | 2;
  disabled?: boolean;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const progressLabels = useListeningPartTagsProgressLabels();
  const tagsCopy = copy.admin.listeningPartTagsImport;
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [tagsProgress, setTagsProgress] = useState<ExamModulePhaseStatus>({
    status: "pending",
  });

  async function handleGenerate() {
    setIsRunning(true);
    setIsComplete(false);
    setTagsProgress({ status: "pending" });

    const result = await runListeningPartTagsWithProgress(
      bookId,
      testId,
      part,
      (patch) => {
        setTagsProgress((current) => ({ ...current, ...patch }));
      },
    );

    setIsRunning(false);
    setIsComplete(true);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(tagsCopy.geminiSuccess(part));
    router.refresh();
    onSuccess?.();
  }

  const showProgress =
    isRunning || isComplete || tagsProgress.status !== "pending";

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {tagsCopy.geminiDescription(part)}
      </p>

      {showProgress ? (
        <PassageTranslationProgressPanel
          translation={tagsProgress}
          labels={progressLabels}
          isFinished={isComplete}
        />
      ) : null}

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
  );
}

export function ImportListeningPartTagsDialog({
  bookId,
  testId,
  part,
  disabled,
}: ImportListeningPartTagsDialogProps) {
  const [open, setOpen] = useState(false);
  const tagsCopy = copy.admin.listeningPartTagsImport;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" disabled={disabled}>
          <Tags className="size-4" />
          {copy.admin.cms.addPart5Tags}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{tagsCopy.title(part)}</DialogTitle>
          <DialogDescription>{tagsCopy.description(part)}</DialogDescription>
        </DialogHeader>
        <GeminiListeningPartTagsForm
          bookId={bookId}
          testId={testId}
          part={part}
          disabled={disabled}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
