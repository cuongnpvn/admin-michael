"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
	PassageTranslationProgressPanel,
	type ExamModulePhaseStatus,
	type ExamProgressLabels,
} from "@/components/admin/exams/admin-create-exam-test-progress";
import { runContentVocabularyPartWithProgress } from "@/components/admin/exams/run-exam-module-progress-steps";
import type { ContentVocabularyPart } from "@/lib/content/content-vocabulary-export-schema";
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

interface ImportContentVocabularyDialogProps {
	bookId: string;
	testId: string;
	part: ContentVocabularyPart;
	disabled?: boolean;
}

function useContentVocabularyProgressLabels(): ExamProgressLabels {
	const wizardCopy = copy.admin.exams.create.wizard;

	return useMemo(
		(): ExamProgressLabels => ({
			init: wizardCopy.progressInit,
			finalize: wizardCopy.progressFinalize,
			gemini: wizardCopy.progressGeminiPhase,
			import: wizardCopy.progressImportPhase,
			translation: copy.admin.cms.addContentVocabulary,
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

function GeminiContentVocabularyForm({
	bookId,
	testId,
	part,
	disabled,
	onSuccess,
}: {
	bookId: string;
	testId: string;
	part: ContentVocabularyPart;
	disabled?: boolean;
	onSuccess?: () => void;
}) {
	const router = useRouter();
	const progressLabels = useContentVocabularyProgressLabels();
	const [isRunning, setIsRunning] = useState(false);
	const [isComplete, setIsComplete] = useState(false);
	const [vocabProgress, setVocabProgress] = useState<ExamModulePhaseStatus>({
		status: "pending",
	});

	async function handleGenerate() {
		setIsRunning(true);
		setIsComplete(false);
		setVocabProgress({ status: "pending" });

		const result = await runContentVocabularyPartWithProgress(
			part,
			bookId,
			testId,
			(patch) => {
				setVocabProgress((current) => ({ ...current, ...patch }));
			},
		);

		setIsRunning(false);
		setIsComplete(true);

		if (!result.ok) {
			toast.error(result.error);
			return;
		}

		toast.success(copy.admin.contentVocabularyImport.geminiSuccess);
		router.refresh();
		onSuccess?.();
	}

	const showProgress =
		isRunning || isComplete || vocabProgress.status !== "pending";

	return (
		<div className="space-y-4">
			<p className="text-sm text-muted-foreground">
				{copy.admin.contentVocabularyImport.geminiDescription}
			</p>

			{showProgress ? (
				<PassageTranslationProgressPanel
					translation={vocabProgress}
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
					: copy.admin.contentVocabularyImport.geminiButton}
			</Button>
		</div>
	);
}

export function ImportContentVocabularyDialog({
	bookId,
	testId,
	part,
	disabled,
}: ImportContentVocabularyDialogProps) {
	const [open, setOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button type="button" variant="outline" size="sm" disabled={disabled}>
					<BookOpen className="size-4" />
					{copy.admin.cms.addContentVocabulary}
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>
						{copy.admin.contentVocabularyImport.title}
					</DialogTitle>
					<DialogDescription>
						{copy.admin.contentVocabularyImport.description}
					</DialogDescription>
				</DialogHeader>
				<GeminiContentVocabularyForm
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
