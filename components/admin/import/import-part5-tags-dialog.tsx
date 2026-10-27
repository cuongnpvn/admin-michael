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

interface ImportPart5TagsDialogProps {
  bookId: string;
  testId: string;
  disabled?: boolean;
}

function usePart5TagsProgressLabels(): ExamProgressLabels {
  const wizardCopy = copy.admin.exams.create.wizard;

  return useMemo(
    (): ExamProgressLabels => ({
      init: wizardCopy.progressInit,
      finalize: wizardCopy.progressFinalize,
      gemini: wizardCopy.progressGeminiPhase,
      import: wizardCopy.progressImportPhase,
      translation: copy.admin.cms.addPart5Tags,
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
    [wizardCopy],
  );
}

function GeminiPart5TagsForm({
  bookId,
  testId,
  disabled,
  onSuccess,
}: {
  bookId: string;
  testId: string;
  disabled?: boolean;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const progressLabels = usePart5TagsProgressLabels();
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [tagsProgress, setTagsProgress] = useState<ExamModulePhaseStatus>({
    status: "pending",
  });

  async function handleGenerate() {
    setIsRunning(true);
    setIsComplete(false);
    setTagsProgress({ status: "pending" });

    const result = await runPart5TagsWithProgress(bookId, testId, (patch) => {
      setTagsProgress((current) => ({ ...current, ...patch }));
    });

    setIsRunning(false);
    setIsComplete(true);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(copy.admin.part5TagsImport.geminiSuccess);
    router.refresh();
    onSuccess?.();
  }

  const showProgress =
    isRunning || isComplete || tagsProgress.status !== "pending";

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {copy.admin.part5TagsImport.geminiDescription}
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
        {isRunning
          ? copy.auth.signingIn
          : copy.admin.part5TagsImport.geminiButton}
      </Button>
    </div>
  );
}

export function ImportPart5TagsDialog({
  bookId,
  testId,
  disabled,
}: ImportPart5TagsDialogProps) {
  const [open, setOpen] = useState(false);

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
          <DialogTitle>{copy.admin.part5TagsImport.title}</DialogTitle>
          <DialogDescription>
            {copy.admin.part5TagsImport.description}
          </DialogDescription>
        </DialogHeader>
        <GeminiPart5TagsForm
          bookId={bookId}
          testId={testId}
          disabled={disabled}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
