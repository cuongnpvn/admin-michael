"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Languages, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";
import {
	PassageTranslationProgressPanel,
	type ExamModulePhaseStatus,
	type ExamProgressLabels,
} from "@/components/admin/exams/admin-create-exam-test-progress";
import { runPassageTranslationWithProgress } from "@/components/admin/exams/run-exam-module-progress-steps";
import { importPassageTranslationsFromJson } from "@/lib/admin/import/actions";
import type { AdminInstructionId } from "@/lib/admin/instructions/catalog";
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
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ImportPassageTranslationsDialogProps {
	bookId: string;
	testId: string;
	part: 3 | 4 | 5 | 6 | 7;
	disabled?: boolean;
}

function readingModuleIdForPart(part: 5 | 6 | 7): AdminInstructionId {
	if (part === 5) return "reading-part-5";
	return part === 6 ? "reading-part-6" : "reading-part-7";
}

function usePassageTranslationProgressLabels(): ExamProgressLabels {
	const wizardCopy = copy.admin.exams.create.wizard;

	return useMemo(
		(): ExamProgressLabels => ({
			init: wizardCopy.progressInit,
			finalize: wizardCopy.progressFinalize,
			gemini: wizardCopy.progressGeminiPhase,
			import: wizardCopy.progressImportPhase,
			translation: wizardCopy.progressTranslationPhase,
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

function GeminiPassageTranslationForm({
	bookId,
	testId,
	part,
	disabled,
	onSuccess,
}: {
	bookId: string;
	testId: string;
	part: 5 | 6 | 7;
	disabled?: boolean;
	onSuccess?: () => void;
}) {
	const router = useRouter();
	const progressLabels = usePassageTranslationProgressLabels();
	const [isRunning, setIsRunning] = useState(false);
	const [isComplete, setIsComplete] = useState(false);
	const [translationProgress, setTranslationProgress] =
		useState<ExamModulePhaseStatus>({ status: "pending" });

	async function handleGenerate() {
		setIsRunning(true);
		setIsComplete(false);
		setTranslationProgress({ status: "pending" });

		const result = await runPassageTranslationWithProgress(
			readingModuleIdForPart(part),
			bookId,
			testId,
			(patch) => {
				setTranslationProgress((current) => ({ ...current, ...patch }));
			},
		);

		setIsRunning(false);
		setIsComplete(true);

		if (!result.ok) {
			toast.error(result.error);
			return;
		}

		toast.success(copy.admin.passageTranslationImport.geminiSuccess);
		router.refresh();
		onSuccess?.();
	}

	const showProgress =
		isRunning || isComplete || translationProgress.status !== "pending";

	return (
		<div className="space-y-4">
			<p className="text-sm text-muted-foreground">
				{copy.admin.passageTranslationImport.geminiDescription}
			</p>

			{showProgress ? (
				<PassageTranslationProgressPanel
					translation={translationProgress}
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
					: copy.admin.passageTranslationImport.geminiButton}
			</Button>
		</div>
	);
}

function JsonPassageTranslationForm({
	bookId,
	testId,
	part,
	disabled,
	onSuccess,
}: ImportPassageTranslationsDialogProps & { onSuccess?: () => void }) {
	const router = useRouter();
	const formRef = useRef<HTMLFormElement>(null);
	const [isPending, startTransition] = useTransition();

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);

		startTransition(async () => {
			const result = await importPassageTranslationsFromJson(
				bookId,
				testId,
				part,
				formData,
			);
			if (!result.ok) {
				toast.error(result.error);
				return;
			}
			const { summary } = result;
			toast.success(
				copy.admin.passageTranslationImport.success(
					summary.questionsUpdated,
					summary.passagesUpdated,
					summary.translationRows,
					summary.notFoundQuestionIds,
					summary.notFoundPassageSlugs,
				),
			);
			formRef.current?.reset();
			router.refresh();
			onSuccess?.();
		});
	}

	return (
		<div className="space-y-4">
			<p className="text-sm text-muted-foreground">
				{part === 5
					? copy.admin.readingPart5TranslationImport.jsonDescription
					: part === 6 || part === 7
						? copy.admin.passageTranslationImport.jsonDescription
						: copy.admin.passageTranslationImport.requiredFieldsNote}
			</p>
			<form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="import-passage-translations-file">
						{copy.admin.passageTranslationImport.selectFile}
					</Label>
					<input
						id="import-passage-translations-file"
						name="file"
						type="file"
						accept="application/json,.json"
						required
						disabled={disabled || isPending}
						className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-[10px] file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm file:font-medium file:text-foreground"
					/>
				</div>
				<Button
					type="submit"
					className="w-full"
					disabled={disabled || isPending}
				>
					<Upload className="size-4" />
					{isPending
						? copy.auth.signingIn
						: copy.admin.passageTranslationImport.importButton}
				</Button>
			</form>
		</div>
	);
}

function ImportPassageTranslationsForm({
	bookId,
	testId,
	part,
	disabled,
	onSuccess,
}: ImportPassageTranslationsDialogProps & { onSuccess?: () => void }) {
	const supportsGemini = part === 5 || part === 6 || part === 7;

	if (!supportsGemini) {
		return (
			<JsonPassageTranslationForm
				bookId={bookId}
				testId={testId}
				part={part}
				disabled={disabled}
				onSuccess={onSuccess}
			/>
		);
	}

	return (
		<Tabs defaultValue="gemini" className="gap-4">
			<TabsList className="w-full">
				<TabsTrigger value="gemini" className="flex-1">
					{copy.admin.passageTranslationImport.tabGemini}
				</TabsTrigger>
				<TabsTrigger value="json" className="flex-1">
					{copy.admin.passageTranslationImport.tabJson}
				</TabsTrigger>
			</TabsList>
			<TabsContent value="gemini" className="mt-4">
				<GeminiPassageTranslationForm
					bookId={bookId}
					testId={testId}
					part={part}
					disabled={disabled}
					onSuccess={onSuccess}
				/>
			</TabsContent>
			<TabsContent value="json" className="mt-4">
				<JsonPassageTranslationForm
					bookId={bookId}
					testId={testId}
					part={part}
					disabled={disabled}
					onSuccess={onSuccess}
				/>
			</TabsContent>
		</Tabs>
	);
}

export function ImportPassageTranslationsDialog({
	bookId,
	testId,
	part,
	disabled,
}: ImportPassageTranslationsDialogProps) {
	const [open, setOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button type="button" variant="outline" size="sm" disabled={disabled}>
					<Languages className="size-4" />
					{copy.admin.cms.addPassageTranslations}
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>{copy.admin.passageTranslationImport.title}</DialogTitle>
					<DialogDescription>
						{copy.admin.passageTranslationImport.description}
					</DialogDescription>
				</DialogHeader>
				<ImportPassageTranslationsForm
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
