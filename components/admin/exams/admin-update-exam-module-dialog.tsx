"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import {
	SingleModuleProgressPanel,
	yieldProgressUi,
	type ExamModuleProgressItem,
	type ExamProgressLabels,
} from "@/components/admin/exams/admin-create-exam-test-progress";
import {
	buildGeminiFormData,
	buildReadingPart7GeminiFormData,
	emptyReadingPart7Pdfs,
	isReadingPart7Uploaded,
	type ReadingPart7PdfPair,
} from "@/components/admin/exams/create-exam-test-form";
import {
	runGeminiExtractWithProgress,
	runModuleProcessWithProgress,
	runReadingPart7ExtractWithProgress,
} from "@/components/admin/exams/run-exam-module-progress-steps";
import type { AdminInstructionId } from "@/lib/admin/instructions/catalog";
import {
	examPartModuleById,
	examModuleSupportsTranslation,
} from "@/lib/admin/instructions/exam-part-modules";
import { importExamPartFromRaw } from "@/lib/admin/content/import-exam-part-from-raw";
import { finalizeCreateExamTest } from "@/lib/admin/content/create-exam-test";
import { copy } from "@/lib/copy/vi";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { FileInput } from "@/components/ui/file-input";
import { Label } from "@/components/ui/label";

const PDF_ACCEPT = "application/pdf,.pdf";

interface AdminUpdateExamModuleDialogProps {
	bookId: string;
	testId: string;
	testLabel: string;
	moduleId: AdminInstructionId;
	disabled?: boolean;
	compact?: boolean;
	label?: string;
}

function moduleSupportsProcess(moduleId: AdminInstructionId): boolean {
	return examModuleSupportsTranslation(moduleId);
}

function initialModuleProgress(
	moduleId: AdminInstructionId,
	title: string,
): ExamModuleProgressItem {
	return {
		moduleId,
		title,
		gemini: { status: "pending" },
		import: { status: "pending" },
		translation: {
			status: moduleSupportsProcess(moduleId) ? "pending" : "skipped",
		},
		vocabulary: { status: "skipped" },
	};
}

export function AdminUpdateExamModuleDialog({
	bookId,
	testId,
	testLabel,
	moduleId,
	disabled,
	compact = false,
	label,
}: AdminUpdateExamModuleDialogProps) {
	const router = useRouter();
	const examPartModule = examPartModuleById(moduleId);
	const createCopy = copy.admin.exams.create;
	const updateCopy = copy.admin.exams.updateModule;
	const wizardCopy = createCopy.wizard;
	const buttonLabel = label ?? updateCopy.editModule;
	const isReadingPart7 = moduleId === "reading-part-7";
	const supportsProcess = moduleSupportsProcess(moduleId);

	const progressLabels = useMemo(
		(): ExamProgressLabels => ({
			init: wizardCopy.progressInit,
			finalize: wizardCopy.progressFinalize,
			gemini: wizardCopy.progressGeminiPhase,
			import: wizardCopy.progressImportPhase,
			translation: updateCopy.progressProcessPhase,
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
			translating: updateCopy.progressProcessing,
			validationRetry: wizardCopy.progressValidationRetry,
			tabSystem: wizardCopy.progressTabSystem,
			stepGeminiSend: wizardCopy.stepGeminiSend,
			stepGeminiWait: wizardCopy.stepGeminiWait,
			stepGeminiParse: wizardCopy.stepGeminiParse,
			downloadGeminiJson: wizardCopy.downloadGeminiJson,
			stepImportSupabase: wizardCopy.stepImportSupabase,
			stepTranslationExport: updateCopy.stepProcessExport,
			stepTranslationGeminiSend: updateCopy.stepProcessGeminiSend,
			stepTranslationGeminiWait: updateCopy.stepProcessGeminiWait,
			stepTranslationImport: updateCopy.stepProcessImport,
			stepInitRecord: wizardCopy.stepInitRecord,
			stepFinalizeCache: wizardCopy.stepFinalizeCache,
			moduleTabLabel: wizardCopy.moduleTabLabel,
			resultAllSuccess: wizardCopy.resultAllSuccess,
			resultPartial: wizardCopy.resultPartial,
			resultAllFailed: wizardCopy.resultAllFailed,
			retryHint: wizardCopy.retryHint,
			viewTest: wizardCopy.viewTest,
		}),
		[updateCopy, wizardCopy],
	);

	const [open, setOpen] = useState(false);
	const [pdfFile, setPdfFile] = useState<File | null>(null);
	const [readingPart7Pdfs, setReadingPart7Pdfs] =
		useState<ReadingPart7PdfPair>(emptyReadingPart7Pdfs());
	const [isUpdating, setIsUpdating] = useState(false);
	const [isComplete, setIsComplete] = useState(false);
	const [moduleProgress, setModuleProgress] =
		useState<ExamModuleProgressItem | null>(null);

	const hasRequiredFiles = isReadingPart7
		? isReadingPart7Uploaded(readingPart7Pdfs)
		: Boolean(pdfFile);

	function resetDialog() {
		setPdfFile(null);
		setReadingPart7Pdfs(emptyReadingPart7Pdfs());
		setIsUpdating(false);
		setIsComplete(false);
		setModuleProgress(null);
	}

	function handleOpenChange(nextOpen: boolean) {
		if (!nextOpen && isUpdating && !isComplete) return;
		setOpen(nextOpen);
		if (!nextOpen) resetDialog();
	}

	async function runUpdate() {
		if (!examPartModule || !hasRequiredFiles) {
			toast.error(
				isReadingPart7
					? createCopy.readingPart7BothPdfsRequired
					: updateCopy.noFiles,
			);
			return;
		}

		setIsUpdating(true);
		setIsComplete(false);
		setModuleProgress(
			initialModuleProgress(examPartModule.id, examPartModule.title),
		);

		let progress = initialModuleProgress(
			examPartModule.id,
			examPartModule.title,
		);

		try {
			const geminiResult = isReadingPart7
				? await runReadingPart7ExtractWithProgress(
						buildReadingPart7GeminiFormData(
							readingPart7Pdfs.single!,
							readingPart7Pdfs.multi!,
							bookId,
							testId,
						),
						(patch) => {
							progress = {
								...progress,
								gemini: { ...progress.gemini, ...patch },
							};
							setModuleProgress({ ...progress });
						},
					)
				: await runGeminiExtractWithProgress(
						examPartModule.id,
						buildGeminiFormData(examPartModule.id, pdfFile!, bookId, testId),
						(patch) => {
							progress = {
								...progress,
								gemini: { ...progress.gemini, ...patch },
							};
							setModuleProgress({ ...progress });
						},
					);

			if (!geminiResult.ok) {
				progress = {
					...progress,
					import: { status: "skipped" },
					translation: {
						status: supportsProcess
							? "skipped"
							: progress.translation.status,
					},
				};
				setModuleProgress({ ...progress });
				toast.error(geminiResult.error);
				setIsUpdating(false);
				setIsComplete(true);
				return;
			}

			progress = {
				...progress,
				import: { status: "running", detail: "importing" },
			};
			setModuleProgress({ ...progress });
			await yieldProgressUi();

			const importResult = await importExamPartFromRaw(
				examPartModule.id,
				bookId,
				testId,
				testLabel,
				geminiResult.rawJson,
			);

			if (!importResult.ok) {
				progress = {
					...progress,
					import: {
						status: "error",
						detail: "importing",
						error: importResult.error,
					},
					translation: {
						status: supportsProcess
							? "skipped"
							: progress.translation.status,
					},
				};
				setModuleProgress({ ...progress });
				toast.error(importResult.error);
				setIsUpdating(false);
				setIsComplete(true);
				return;
			}

			progress = {
				...progress,
				import: { status: "done", detail: "complete" },
			};
			setModuleProgress({ ...progress });

			if (supportsProcess) {
				const processResult = await runModuleProcessWithProgress(
					examPartModule.id,
					bookId,
					testId,
					(patch) => {
						progress = {
							...progress,
							translation: {
								...progress.translation,
								...patch,
							},
						};
						setModuleProgress({ ...progress });
					},
				);

				if (!processResult.ok) {
					toast.error(processResult.error);
					setIsUpdating(false);
					setIsComplete(true);
					return;
				}
			}

			const finalized = await finalizeCreateExamTest(bookId, testId);
			if (!finalized.ok) {
				toast.error(finalized.error);
				setIsUpdating(false);
				setIsComplete(true);
				return;
			}

			toast.success(copy.admin.exams.toast.moduleUpdated);
			setIsComplete(true);
			setIsUpdating(false);
			router.refresh();

			window.setTimeout(() => {
				setOpen(false);
				resetDialog();
			}, 900);
		} catch (submitError) {
			const message =
				submitError instanceof Error
					? submitError.message
					: String(submitError);
			toast.error(message || createCopy.submitFailed);
			setIsUpdating(false);
			setIsComplete(true);
		}
	}

	if (!examPartModule) return null;

	const isProgressView = isUpdating || isComplete;

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					disabled={disabled}
					className={compact ? "size-8 shrink-0 px-0" : undefined}
					aria-label={buttonLabel}
					title={compact ? buttonLabel : undefined}
				>
					<Pencil className="size-4" />
					{compact ? null : buttonLabel}
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{updateCopy.title(examPartModule.title)}
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-4 py-2">
					{isProgressView && moduleProgress ? (
						<SingleModuleProgressPanel
							module={moduleProgress}
							labels={progressLabels}
							isFinished={isComplete}
						/>
					) : (
						<div className="space-y-3 rounded-[10px] border border-border bg-muted/30 p-4">
							{isReadingPart7 ? (
								<>
									<div className="space-y-2">
										<Label>
											{createCopy.readingPart7PdfSingle}
										</Label>
										<FileInput
											variant="dropzone"
											accept={PDF_ACCEPT}
											disabled={disabled}
											placeholderLabel={createCopy.noFile}
											emptyLabel={
												readingPart7Pdfs.single?.name ??
												createCopy.noFile
											}
											onFilesChange={(files) => {
												setReadingPart7Pdfs(
													(current) => ({
														...current,
														single:
															files[0] ?? null,
													}),
												);
											}}
										/>
									</div>
									<div className="space-y-2">
										<Label>
											{createCopy.readingPart7PdfMulti}
										</Label>
										<FileInput
											variant="dropzone"
											accept={PDF_ACCEPT}
											disabled={disabled}
											placeholderLabel={createCopy.noFile}
											emptyLabel={
												readingPart7Pdfs.multi?.name ??
												createCopy.noFile
											}
											onFilesChange={(files) => {
												setReadingPart7Pdfs(
													(current) => ({
														...current,
														multi: files[0] ?? null,
													}),
												);
											}}
										/>
									</div>
								</>
							) : (
								<FileInput
									variant="dropzone"
									accept={PDF_ACCEPT}
									disabled={disabled}
									placeholderLabel={createCopy.noFile}
									emptyLabel={
										pdfFile?.name ?? createCopy.noFile
									}
									onFilesChange={(files) => {
										setPdfFile(files[0] ?? null);
									}}
								/>
							)}
						</div>
					)}
				</div>

				<DialogFooter className="border-t border-border pt-4">
					{!isProgressView && (
						<Button
							type="button"
							disabled={
								disabled || isUpdating || !hasRequiredFiles
							}
							onClick={runUpdate}
							className="w-full sm:ml-auto sm:w-auto"
						>
							{updateCopy.submit}
						</Button>
					)}
					{isProgressView && isComplete && (
						<Button
							type="button"
							className="w-full sm:ml-auto sm:w-auto"
							onClick={() => {
								setOpen(false);
								resetDialog();
							}}
						>
							{wizardCopy.closeRun}
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
