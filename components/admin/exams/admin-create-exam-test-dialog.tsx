"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import {
	CreateExamModuleProgressPanel,
	WizardStepIndicator,
	initialExamRunProgress,
	patchModuleGemini,
	patchModuleImport,
	patchModuleTranslation,
	patchModuleVocabulary,
	summarizeExamRun,
	yieldProgressUi,
	type ExamProgressLabels,
	type ExamRunProgressState,
	type CreateExamWizardStepId,
} from "@/components/admin/exams/admin-create-exam-test-progress";
import {
	runContentVocabularyWithProgress,
	runGeminiExtractWithProgress,
	runListeningTranscriptTranslationWithProgress,
	runModuleProcessWithProgress,
	runReadingPart7ExtractWithProgress,
} from "@/components/admin/exams/run-exam-module-progress-steps";
import {
	buildGeminiFormData,
	buildInitFormData,
	buildReadingPart7GeminiFormData,
	countModulePdfs,
	hasPartialReadingPart7Upload,
	initialCreateExamFormState,
	isReadingPart7Uploaded,
	moduleRunsProcessAutomatically,
	shouldApplyListeningTranscriptTranslation,
	shouldApplyVocabularyForModule,
	shouldRunModuleProcess,
	uploadedExamModules,
	type CreateExamFormState,
} from "@/components/admin/exams/create-exam-test-form";
import {
	createExamTestInit,
	finalizeCreateExamTest,
} from "@/lib/admin/content/create-exam-test";
import { importExamPartFromRaw } from "@/lib/admin/content/import-exam-part-from-raw";
import { GEMINI_EXTRACT_CONCURRENCY } from "@/lib/admin/gemini/constants";
import { runWithConcurrency } from "@/lib/admin/gemini/run-with-concurrency";
import { adminExamsPath } from "@/lib/admin/admin-paths";
import type { AdminInstructionId } from "@/lib/admin/instructions/catalog";
import {
	EXAM_PART_MODULES,
	examModuleSupportsContentVocabulary,
	examModuleSupportsTranslation,
	examPartModulesForSection,
	type ExamPartModule,
} from "@/lib/admin/instructions/exam-part-modules";
import { slugifyCatalogId } from "@/lib/content/slugify-catalog-id";
import { copy } from "@/lib/copy/vi";
import type { BookCatalogEntry } from "@/types/test-data";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const NEW_BOOK_VALUE = "__new__";
const PDF_ACCEPT = "application/pdf,.pdf";

const CREATE_WIZARD_STEPS: CreateExamWizardStepId[] = [
	"info",
	"upload",
	"review",
];
const EXISTING_WIZARD_STEPS: CreateExamWizardStepId[] = ["upload", "review"];

export interface ExistingExamUploadTarget {
	bookId: string;
	testId: string;
	testLabel: string;
	bookName: string;
}

function initialFormStateForDialog(
	books: BookCatalogEntry[],
	existingTest?: ExistingExamUploadTarget,
): CreateExamFormState {
	if (existingTest) {
		return {
			...initialCreateExamFormState(existingTest.bookId, true),
			bookMode: "existing",
			bookId: existingTest.bookId,
			testLabel: existingTest.testLabel,
		};
	}
	return initialCreateExamFormState(books[0]?.id ?? "", books.length > 0);
}

function ApplyTranslationToggle({
	moduleId,
	checked,
	disabled,
	onCheckedChange,
}: {
	moduleId: AdminInstructionId;
	checked: boolean;
	disabled?: boolean;
	onCheckedChange: (checked: boolean) => void;
}) {
	if (!examModuleSupportsTranslation(moduleId)) {
		return null;
	}

	return (
		<div className="flex items-center justify-between gap-3 rounded-[8px] border border-border/60 bg-muted/20 px-3 py-2">
			<div className="min-w-0">
				<p className="text-sm font-medium">
					{copy.admin.exams.create.applyTranslationLabel}
				</p>
			</div>
			<Switch
				checked={checked}
				disabled={disabled}
				onCheckedChange={onCheckedChange}
				aria-label={copy.admin.exams.create.applyTranslationLabel}
			/>
		</div>
	);
}

function ApplyVocabularyToggle({
	moduleId,
	checked,
	disabled,
	onCheckedChange,
}: {
	moduleId: AdminInstructionId;
	checked: boolean;
	disabled?: boolean;
	onCheckedChange: (checked: boolean) => void;
}) {
	if (!examModuleSupportsContentVocabulary(moduleId)) {
		return null;
	}

	return (
		<div className="flex items-center justify-between gap-3 rounded-[8px] border border-border/60 bg-muted/20 px-3 py-2">
			<div className="min-w-0">
				<p className="text-sm font-medium">
					{copy.admin.exams.create.applyVocabularyLabel}
				</p>
			</div>
			<Switch
				checked={checked}
				disabled={disabled}
				onCheckedChange={onCheckedChange}
				aria-label={copy.admin.exams.create.applyVocabularyLabel}
			/>
		</div>
	);
}

function ModuleUploadCard({
	module,
	formState,
	formDisabled,
	onPatch,
}: {
	module: ExamPartModule;
	formState: CreateExamFormState;
	formDisabled: boolean;
	onPatch: (patch: Partial<CreateExamFormState>) => void;
}) {
	const createCopy = copy.admin.exams.create;

	if (module.id === "reading-part-7") {
		return (
			<div className="space-y-3 rounded-[8px] border border-border/60 bg-background/50 p-3">
				<p className="text-sm font-medium">{module.title}</p>
				<div className="space-y-2">
					<Label>{createCopy.readingPart7PdfSingle}</Label>
					<FileInput
						variant="dropzone"
						accept={PDF_ACCEPT}
						disabled={formDisabled}
						placeholderLabel={createCopy.noFile}
						emptyLabel={
							formState.readingPart7Pdfs.single?.name ??
							createCopy.noFile
						}
						onFilesChange={(files) =>
							onPatch({
								readingPart7Pdfs: {
									...formState.readingPart7Pdfs,
									single: files[0] ?? null,
								},
							})
						}
					/>
				</div>
				<div className="space-y-2">
					<Label>{createCopy.readingPart7PdfMulti}</Label>
					<FileInput
						variant="dropzone"
						accept={PDF_ACCEPT}
						disabled={formDisabled}
						placeholderLabel={createCopy.noFile}
						emptyLabel={
							formState.readingPart7Pdfs.multi?.name ??
							createCopy.noFile
						}
						onFilesChange={(files) =>
							onPatch({
								readingPart7Pdfs: {
									...formState.readingPart7Pdfs,
									multi: files[0] ?? null,
								},
							})
						}
					/>
				</div>
				<ApplyVocabularyToggle
					moduleId={module.id}
					checked={
						formState.applyVocabularyByModule[module.id] === true
					}
					disabled={formDisabled}
					onCheckedChange={(checked) =>
						onPatch({
							applyVocabularyByModule: {
								...formState.applyVocabularyByModule,
								[module.id]: checked,
							},
						})
					}
				/>
			</div>
		);
	}

	const isListeningPart3 = module.id === "listening-part-3";

	return (
		<div className="space-y-2 rounded-[8px] border border-border/60 bg-background/50 p-3">
			<Label>{module.title}</Label>
			<FileInput
				variant="dropzone"
				accept={PDF_ACCEPT}
				disabled={formDisabled}
				placeholderLabel={createCopy.noFile}
				emptyLabel={
					formState.modulePdfs[module.id]?.name ?? createCopy.noFile
				}
				onFilesChange={(files) =>
					onPatch({
						modulePdfs: {
							...formState.modulePdfs,
							[module.id]: files[0] ?? null,
						},
					})
				}
			/>
			<ApplyTranslationToggle
				moduleId={module.id}
				checked={formState.applyTranslationByModule[module.id] === true}
				disabled={formDisabled}
				onCheckedChange={(checked) =>
					onPatch({
						applyTranslationByModule: {
							...formState.applyTranslationByModule,
							[module.id]: checked,
						},
					})
				}
			/>
			<ApplyVocabularyToggle
				moduleId={module.id}
				checked={formState.applyVocabularyByModule[module.id] === true}
				disabled={formDisabled}
				onCheckedChange={(checked) =>
					onPatch({
						applyVocabularyByModule: {
							...formState.applyVocabularyByModule,
							[module.id]: checked,
						},
					})
				}
			/>
		</div>
	);
}

function ReviewRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex gap-4 px-4 py-3">
			<dt className="w-48 shrink-0 text-muted-foreground">{label}</dt>
			<dd className="min-w-0 flex-1 truncate font-medium">{value}</dd>
		</div>
	);
}

interface AdminCreateExamTestDialogProps {
	books: BookCatalogEntry[];
	disabled?: boolean;
	disabledReason?: string;
	/** Skip catalog creation and upload PDFs into this existing test. */
	existingTest?: ExistingExamUploadTarget;
	/** Keep the book fixed (entrance test). Hides the book picker. */
	lockBook?: boolean;
}

export function AdminCreateExamTestDialog({
	books,
	disabled,
	disabledReason,
	existingTest,
	lockBook = false,
}: AdminCreateExamTestDialogProps) {
	const router = useRouter();
	const createCopy = copy.admin.exams.create;
	const wizardCopy = createCopy.wizard;
	const isExistingUpload = existingTest != null;
	const wizardSteps = isExistingUpload
		? EXISTING_WIZARD_STEPS
		: CREATE_WIZARD_STEPS;

	const moduleTitles = useMemo(
		() =>
			Object.fromEntries(
				EXAM_PART_MODULES.map((module) => [module.id, module.title]),
			) as Record<AdminInstructionId, string>,
		[],
	);

	const progressLabels = useMemo(
		(): ExamProgressLabels => ({
			init: isExistingUpload
				? wizardCopy.progressInitExisting
				: wizardCopy.progressInit,
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
			stepInitRecord: isExistingUpload
				? wizardCopy.progressInitExisting
				: wizardCopy.stepInitRecord,
			stepFinalizeCache: wizardCopy.stepFinalizeCache,
			moduleTabLabel: wizardCopy.moduleTabLabel,
			resultAllSuccess: wizardCopy.resultAllSuccess,
			resultPartial: wizardCopy.resultPartial,
			resultAllFailed: wizardCopy.resultAllFailed,
			retryHint: wizardCopy.retryHint,
			viewTest: wizardCopy.viewTest,
		}),
		[isExistingUpload, wizardCopy],
	);

	const [open, setOpen] = useState(false);
	const [wizardStep, setWizardStep] = useState<CreateExamWizardStepId>(
		isExistingUpload ? "upload" : "info",
	);
	const [formState, setFormState] = useState<CreateExamFormState>(() =>
		initialFormStateForDialog(books, existingTest),
	);
	const [isCreating, setIsCreating] = useState(false);
	const [runProgress, setRunProgress] = useState<ExamRunProgressState | null>(
		null,
	);
	const [isRunFinished, setIsRunFinished] = useState(false);
	const [createdTestPath, setCreatedTestPath] = useState<string | null>(null);

	const selectedBook = useMemo(
		() => books.find((book) => book.id === formState.bookId),
		[books, formState.bookId],
	);

	const duplicateTestId = useMemo(() => {
		if (isExistingUpload) return null;
		if (
			formState.bookMode !== "existing" ||
			!formState.testLabel.trim() ||
			!selectedBook
		) {
			return null;
		}
		const slug = slugifyCatalogId(formState.testLabel);
		if (!slug) return null;
		return selectedBook.tests.some((test) => test.id === slug)
			? slug
			: null;
	}, [
		formState.bookMode,
		formState.testLabel,
		isExistingUpload,
		selectedBook,
	]);

	const resolvedBookLabel = useMemo(() => {
		if (existingTest) return existingTest.bookName;
		if (formState.bookMode === "new") {
			return formState.bookName.trim() || createCopy.bookNew;
		}
		return selectedBook?.name ?? formState.bookId;
	}, [createCopy.bookNew, existingTest, formState, selectedBook]);

	const uploadedModules = useMemo(
		() =>
			uploadedExamModules(
				formState.modulePdfs,
				formState.readingPart7Pdfs,
			),
		[formState.modulePdfs, formState.readingPart7Pdfs],
	);

	const wizardStepIndex = wizardSteps.indexOf(wizardStep);
	const isProgressView =
		wizardStep === "review" && (isCreating || isRunFinished);
	const formDisabled = disabled || isCreating;

	function resetDialog() {
		setWizardStep(isExistingUpload ? "upload" : "info");
		setFormState(initialFormStateForDialog(books, existingTest));
		setIsCreating(false);
		setIsRunFinished(false);
		setRunProgress(null);
		setCreatedTestPath(null);
	}

	function handleOpenChange(nextOpen: boolean) {
		if (!nextOpen && isCreating && !isRunFinished) return;
		setOpen(nextOpen);
		if (!nextOpen) resetDialog();
	}

	function patchFormState(patch: Partial<CreateExamFormState>) {
		setFormState((current) => ({ ...current, ...patch }));
	}

	function handleBookChange(value: string) {
		if (value === NEW_BOOK_VALUE) {
			patchFormState({ bookMode: "new", bookId: "" });
			return;
		}
		patchFormState({ bookMode: "existing", bookId: value });
	}

	function validateCurrentStep(): string | null {
		if (wizardStep === "info") {
			if (!formState.testLabel.trim()) return createCopy.testRequired;
			if (formState.bookMode === "new" && !formState.bookName.trim()) {
				return createCopy.bookRequired;
			}
			if (formState.bookMode === "existing" && !formState.bookId) {
				return createCopy.bookRequired;
			}
			if (duplicateTestId) {
				return createCopy.duplicateTest(
					formState.bookId,
					duplicateTestId,
				);
			}
		}

		if (
			wizardStep === "upload" &&
			countModulePdfs(
				formState.modulePdfs,
				formState.readingPart7Pdfs,
			) === 0
		) {
			return createCopy.pdfRequired;
		}

		if (
			wizardStep === "upload" &&
			hasPartialReadingPart7Upload(formState.readingPart7Pdfs)
		) {
			return createCopy.readingPart7BothPdfsRequired;
		}

		return null;
	}

	function goNext() {
		const validationError = validateCurrentStep();
		if (validationError) {
			toast.error(validationError);
			return;
		}
		const nextIndex = wizardStepIndex + 1;
		if (nextIndex < wizardSteps.length) {
			setWizardStep(wizardSteps[nextIndex]!);
		}
	}

	function goBack() {
		const prevIndex = wizardStepIndex - 1;
		if (prevIndex >= 0) {
			setWizardStep(wizardSteps[prevIndex]!);
		}
	}

	async function runCreatePipeline() {
		const validationError = validateCurrentStep();
		if (validationError) {
			toast.error(validationError);
			return;
		}

		const modules = uploadedModules;
		const moduleIds = modules.map((module) => module.id);

		setIsCreating(true);
		setIsRunFinished(false);
		setCreatedTestPath(null);
		setRunProgress(
			initialExamRunProgress(
				moduleIds,
				moduleTitles,
				formState.applyTranslationByModule,
				formState.applyVocabularyByModule,
			),
		);

		let progressState = initialExamRunProgress(
			moduleIds,
			moduleTitles,
			formState.applyTranslationByModule,
			formState.applyVocabularyByModule,
		);

		function skipVocabularyIfPending(moduleId: AdminInstructionId) {
			if (
				shouldApplyVocabularyForModule(
					moduleId,
					formState.applyVocabularyByModule,
				)
			) {
				progressState = patchModuleVocabulary(progressState, moduleId, {
					status: "skipped",
				});
			}
		}

		const syncProgress = () => {
			setRunProgress({ ...progressState });
		};

		try {
			let bookId = "";
			let testId = "";
			let testLabel = "";

			if (existingTest) {
				bookId = existingTest.bookId;
				testId = existingTest.testId;
				testLabel = existingTest.testLabel;
				setCreatedTestPath(adminExamsPath(bookId, testId));
				progressState = {
					...progressState,
					init: { status: "done", detail: "complete" },
				};
				syncProgress();
			} else {
				progressState = {
					...progressState,
					init: { status: "running", detail: "importing" },
				};
				syncProgress();
				await yieldProgressUi();
				const initResult = await createExamTestInit(
					buildInitFormData(formState),
				);
				if (!initResult.ok) {
					progressState = {
						...progressState,
						init: {
							status: "error",
							detail: "importing",
							error: initResult.error,
						},
					};
					syncProgress();
					toast.error(initResult.error);
					setIsCreating(false);
					setIsRunFinished(true);
					return;
				}

				bookId = initResult.data.bookId;
				testId = initResult.data.testId;
				testLabel = initResult.data.testLabel;
				setCreatedTestPath(adminExamsPath(bookId, testId));

				progressState = {
					...progressState,
					init: { status: "done", detail: "complete" },
				};
				syncProgress();
			}

			const rawJsonByModule = new Map<AdminInstructionId, string>();

			await runWithConcurrency(
				modules,
				GEMINI_EXTRACT_CONCURRENCY,
				async (module) => {
					if (module.id === "reading-part-7") {
						const { single, multi } = formState.readingPart7Pdfs;
						if (!single || !multi) {
							progressState = patchModuleGemini(
								progressState,
								module.id,
								{
									status: "error",
									detail: "sending",
									error: createCopy.readingPart7BothPdfsRequired,
								},
							);
							progressState = patchModuleImport(
								progressState,
								module.id,
								{ status: "skipped" },
							);
							progressState = patchModuleTranslation(
								progressState,
								module.id,
								{ status: "skipped" },
							);
							skipVocabularyIfPending(module.id);
							syncProgress();
							return;
						}

						const result = await runReadingPart7ExtractWithProgress(
							buildReadingPart7GeminiFormData(
								single,
								multi,
								bookId,
								testId,
							),
							(patch) => {
								progressState = patchModuleGemini(
									progressState,
									module.id,
									patch,
								);
								syncProgress();
							},
						);

						if (!result.ok) {
							progressState = patchModuleImport(
								progressState,
								module.id,
								{ status: "skipped" },
							);
							progressState = patchModuleTranslation(
								progressState,
								module.id,
								{ status: "skipped" },
							);
							skipVocabularyIfPending(module.id);
							syncProgress();
							return;
						}

						rawJsonByModule.set(module.id, result.rawJson);
						syncProgress();
						return;
					}

					const pdf = formState.modulePdfs[module.id];
					if (!pdf) {
						progressState = patchModuleGemini(
							progressState,
							module.id,
							{
								status: "error",
								detail: "sending",
								error: createCopy.pdfRequired,
							},
						);
						progressState = patchModuleImport(
							progressState,
							module.id,
							{
								status: "skipped",
							},
						);
						if (
							shouldRunModuleProcess(
								module.id,
								formState.applyTranslationByModule,
							)
						) {
							progressState = patchModuleTranslation(
								progressState,
								module.id,
								{
									status: "skipped",
								},
							);
						}
						skipVocabularyIfPending(module.id);
						syncProgress();
						return;
					}

					const result = await runGeminiExtractWithProgress(
						module.id,
						buildGeminiFormData(module.id, pdf, bookId, testId),
						(patch) => {
							progressState = patchModuleGemini(
								progressState,
								module.id,
								patch,
							);
							syncProgress();
						},
					);

					if (!result.ok) {
						progressState = patchModuleImport(
							progressState,
							module.id,
							{
								status: "skipped",
							},
						);
						if (
							shouldRunModuleProcess(
								module.id,
								formState.applyTranslationByModule,
							)
						) {
							progressState = patchModuleTranslation(
								progressState,
								module.id,
								{
									status: "skipped",
								},
							);
						}
						skipVocabularyIfPending(module.id);
						syncProgress();
						return;
					}

					rawJsonByModule.set(module.id, result.rawJson);
					syncProgress();
				},
			);

			for (const examModule of modules) {
				const rawJson = rawJsonByModule.get(examModule.id);
				if (!rawJson) {
					skipVocabularyIfPending(examModule.id);
					syncProgress();
					continue;
				}

				progressState = patchModuleImport(
					progressState,
					examModule.id,
					{
						status: "running",
						detail: "importing",
					},
				);
				syncProgress();
				await yieldProgressUi();

				const importResult = await importExamPartFromRaw(
					examModule.id,
					bookId,
					testId,
					testLabel,
					rawJson,
				);

				if (!importResult.ok) {
					progressState = patchModuleImport(
						progressState,
						examModule.id,
						{
							status: "error",
							detail: "importing",
							error: importResult.error,
						},
					);
					if (
						shouldRunModuleProcess(
							examModule.id,
							formState.applyTranslationByModule,
						)
					) {
						progressState = patchModuleTranslation(
							progressState,
							examModule.id,
							{
								status: "skipped",
							},
						);
					}
					skipVocabularyIfPending(examModule.id);
					syncProgress();
					continue;
				}

				progressState = patchModuleImport(
					progressState,
					examModule.id,
					{
						status: "done",
						detail: "complete",
					},
				);
				syncProgress();

				if (
					examModuleSupportsTranslation(examModule.id) &&
					shouldRunModuleProcess(
						examModule.id,
						formState.applyTranslationByModule,
					)
				) {
					const processResult = await runModuleProcessWithProgress(
						examModule.id,
						bookId,
						testId,
						(patch) => {
							progressState = patchModuleTranslation(
								progressState,
								examModule.id,
								patch,
							);
							syncProgress();
						},
					);

					if (!processResult.ok) {
						skipVocabularyIfPending(examModule.id);
						syncProgress();
						continue;
					}

					if (
						shouldApplyListeningTranscriptTranslation(
							examModule.id,
							formState.applyTranslationByModule,
						)
					) {
						const transcriptResult =
							await runListeningTranscriptTranslationWithProgress(
								3,
								bookId,
								testId,
								(patch) => {
									progressState = patchModuleTranslation(
										progressState,
										examModule.id,
										patch,
									);
									syncProgress();
								},
							);

						if (!transcriptResult.ok) {
							skipVocabularyIfPending(examModule.id);
							syncProgress();
							continue;
						}
					}
				}

				if (
					!shouldApplyVocabularyForModule(
						examModule.id,
						formState.applyVocabularyByModule,
					)
				) {
					syncProgress();
					continue;
				}

				const vocabResult = await runContentVocabularyWithProgress(
					examModule.id,
					bookId,
					testId,
					(patch) => {
						progressState = patchModuleVocabulary(
							progressState,
							examModule.id,
							patch,
						);
						syncProgress();
					},
				);

				if (!vocabResult.ok) {
					syncProgress();
					continue;
				}

				syncProgress();
			}

			progressState = {
				...progressState,
				finalize: { status: "running", detail: "importing" },
			};
			syncProgress();
			await yieldProgressUi();
			const finalized = await finalizeCreateExamTest(bookId, testId);
			if (!finalized.ok) {
				progressState = {
					...progressState,
					finalize: {
						status: "error",
						detail: "importing",
						error: finalized.error,
					},
				};
				syncProgress();
				toast.error(finalized.error);
			} else {
				progressState = {
					...progressState,
					finalize: { status: "done", detail: "complete" },
				};
				syncProgress();
			}

			const summary = summarizeExamRun(progressState.modules);
			if (finalized.ok) {
				if (
					summary.failed.length > 0 &&
					summary.succeeded.length === 0
				) {
					toast.error(wizardCopy.resultAllFailed);
				} else if (summary.failed.length > 0) {
					toast.warning(
						wizardCopy.resultPartial(
							summary.succeeded.length,
							summary.failed.length,
						),
					);
				} else {
					toast.success(
						wizardCopy.resultAllSuccess(summary.succeeded.length),
					);
				}
			}

			setIsRunFinished(true);
			setIsCreating(false);
			router.refresh();
		} catch (submitError) {
			const message =
				submitError instanceof Error
					? submitError.message
					: String(submitError);
			toast.error(
				/timeout|timed out|ETIMEDOUT|ECONNRESET|aborted|socket hang up/i.test(
					message,
				)
					? createCopy.requestTimeout
					: message || createCopy.submitFailed,
			);
			progressState = {
				...progressState,
				finalize: {
					status: "error",
					error: message || createCopy.submitFailed,
				},
			};
			syncProgress();
			setIsCreating(false);
			setIsRunFinished(true);
		}
	}

	const bookSelectValue =
		formState.bookMode === "new" ? NEW_BOOK_VALUE : formState.bookId;

	const wizardLabels = wizardSteps.map((id) => ({
		id,
		label:
			id === "info"
				? wizardCopy.stepInfo
				: id === "upload"
					? wizardCopy.stepUpload
					: wizardCopy.stepReview,
	}));

	const dialogTitle = isExistingUpload
		? createCopy.uploadAllTitle
		: createCopy.title;
	const reviewHeading = isExistingUpload
		? wizardCopy.reviewUploadHeading
		: wizardCopy.reviewHeading;
	const progressTitle = isExistingUpload
		? wizardCopy.progressUploadTitle
		: wizardCopy.progressTitle;
	const submitLabel = isExistingUpload
		? wizardCopy.uploadExisting
		: wizardCopy.create;

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				{isExistingUpload ? (
					<Button
						type="button"
						variant="outline"
						disabled={disabled}
						title={disabledReason}
					>
						<Upload className="size-4" />
						{copy.admin.exams.uploadAllTest}
					</Button>
				) : (
					<Button size="sm" disabled={disabled}>
						<Plus className="size-4" />
						{copy.admin.exams.addTest}
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="max-h-[90vh] max-w-4xl gap-0 overflow-hidden p-0">
				<DialogHeader className="space-y-4 border-b border-border px-6 py-4">
					<DialogTitle>{dialogTitle}</DialogTitle>
					{!isProgressView && (
						<WizardStepIndicator
							steps={wizardLabels}
							currentStep={wizardStep}
						/>
					)}
				</DialogHeader>

				<div className="flex max-h-[calc(90vh-9rem)] flex-col">
					<div className="space-y-4 overflow-y-auto px-6 py-4">
						{isProgressView && runProgress ? (
							<CreateExamModuleProgressPanel
								title={progressTitle}
								subtitle={wizardCopy.progressSubtitle}
								state={runProgress}
								labels={progressLabels}
								isFinished={isRunFinished}
								viewTestHref={createdTestPath ?? undefined}
							/>
						) : (
							<>
								{!isExistingUpload && (
									<div
										className={cn(
											wizardStep !== "info" && "hidden",
										)}
									>
										<div className="flex flex-col gap-4 sm:flex-row sm:items-start">
											{lockBook ? null : (
												<div className="flex min-w-0 flex-1 flex-col gap-4">
													<div className="space-y-2">
														<Label>
															{createCopy.book}
														</Label>
														<Select
															value={
																bookSelectValue
															}
															disabled={
																formDisabled
															}
															onValueChange={
																handleBookChange
															}
														>
															<SelectTrigger>
																<SelectValue
																	placeholder={
																		createCopy.book
																	}
																/>
															</SelectTrigger>
															<SelectContent>
																{books.map(
																	(book) => (
																		<SelectItem
																			key={
																				book.id
																			}
																			value={
																				book.id
																			}
																		>
																			{
																				book.name
																			}
																		</SelectItem>
																	),
																)}
																{books.length >
																	0 && (
																	<SelectSeparator />
																)}
																<SelectItem
																	value={
																		NEW_BOOK_VALUE
																	}
																>
																	{
																		createCopy.bookNew
																	}
																</SelectItem>
															</SelectContent>
														</Select>
													</div>
													{formState.bookMode ===
														"new" && (
														<div className="space-y-2">
															<Label htmlFor="bookName">
																{
																	createCopy.bookName
																}
															</Label>
															<Input
																id="bookName"
																required
																disabled={
																	formDisabled
																}
																value={
																	formState.bookName
																}
																onChange={(
																	event,
																) =>
																	patchFormState(
																		{
																			bookName:
																				event
																					.target
																					.value,
																		},
																	)
																}
															/>
														</div>
													)}
												</div>
											)}
											<div className="flex min-w-0 flex-1 flex-col gap-2">
												<Label htmlFor="testLabel">
													{createCopy.test}
												</Label>
												<Input
													id="testLabel"
													required
													disabled={formDisabled}
													value={formState.testLabel}
													onChange={(event) =>
														patchFormState({
															testLabel:
																event.target
																	.value,
														})
													}
													list={
														formState.bookMode ===
															"existing" &&
														selectedBook
															? "existing-tests"
															: undefined
													}
												/>
												{formState.bookMode ===
													"existing" &&
													selectedBook && (
														<datalist id="existing-tests">
															{selectedBook.tests.map(
																(test) => (
																	<option
																		key={
																			test.id
																		}
																		value={
																			test.label
																		}
																	/>
																),
															)}
														</datalist>
													)}
												{duplicateTestId &&
													formState.bookMode ===
														"existing" && (
														<p className="text-sm text-destructive">
															{createCopy.duplicateTest(
																formState.bookId,
																duplicateTestId,
															)}
														</p>
													)}
											</div>
										</div>
									</div>
								)}

								<div
									className={cn(
										wizardStep !== "upload" && "hidden",
									)}
								>
									<div className="space-y-3 rounded-[10px] border border-border bg-muted/30 p-4">
										<div className="flex flex-col gap-4 lg:flex-row lg:items-start">
											<div className="min-w-0 flex-1 space-y-3">
												<h3 className="text-sm font-semibold text-foreground">
													{
														copy.admin.exams
															.listeningSection
													}
												</h3>
												{examPartModulesForSection(
													"listening",
												).map((module) => (
													<ModuleUploadCard
														key={module.id}
														module={module}
														formState={formState}
														formDisabled={
															formDisabled
														}
														onPatch={patchFormState}
													/>
												))}
											</div>
											<div className="min-w-0 flex-1 space-y-3">
												<h3 className="text-sm font-semibold text-foreground">
													{
														copy.admin.exams
															.readingSection
													}
												</h3>
												{examPartModulesForSection(
													"reading",
												).map((module) => (
													<ModuleUploadCard
														key={module.id}
														module={module}
														formState={formState}
														formDisabled={
															formDisabled
														}
														onPatch={patchFormState}
													/>
												))}
											</div>
										</div>
									</div>
								</div>

								<div
									className={cn(
										wizardStep !== "review" && "hidden",
									)}
								>
									<div className="space-y-3">
										<h3 className="text-sm font-medium">
											{reviewHeading}
										</h3>
										<dl className="divide-y divide-border rounded-[10px] border border-border text-sm">
											<ReviewRow
												label={wizardCopy.reviewBook}
												value={resolvedBookLabel}
											/>
											<ReviewRow
												label={wizardCopy.reviewTest}
												value={
													existingTest?.testLabel ??
													formState.testLabel.trim()
												}
											/>
											{EXAM_PART_MODULES.map((module) => (
												<ReviewRow
													key={module.id}
													label={wizardCopy.reviewModulePdf(
														module.title,
													)}
													value={
														module.id ===
														"reading-part-7"
															? isReadingPart7Uploaded(
																	formState.readingPart7Pdfs,
																)
																? `${formState.readingPart7Pdfs.single?.name ?? ""} + ${formState.readingPart7Pdfs.multi?.name ?? ""}`
																: wizardCopy.reviewNone
															: (formState
																	.modulePdfs[
																	module.id
																]?.name ??
																wizardCopy.reviewNone)
													}
												/>
											))}
											{EXAM_PART_MODULES.filter(
												(module) =>
													examModuleSupportsTranslation(
														module.id,
													),
											).map((module) => {
												const hasPdf =
													module.id ===
													"reading-part-7"
														? isReadingPart7Uploaded(
																formState.readingPart7Pdfs,
															)
														: Boolean(
																formState
																	.modulePdfs[
																	module.id
																],
															);
												if (!hasPdf) return null;
												if (
													moduleRunsProcessAutomatically(
														module.id,
													)
												) {
													return (
														<div
															key={`${module.id}-review`}
														>
															<ReviewRow
																label={createCopy.applyProcessReviewLabel(
																	module.title,
																)}
																value={
																	createCopy.applyProcessReviewAlways
																}
															/>
															{module.id ===
															"listening-part-3" ? (
																<ReviewRow
																	label={createCopy.applyTranslationReviewLabel(
																		module.title,
																	)}
																	value={
																		formState
																			.applyTranslationByModule[
																			module
																				.id
																		] ===
																		true
																			? createCopy.applyTranslationReviewOn
																			: createCopy.applyTranslationReviewOff
																	}
																/>
															) : null}
															<ReviewRow
																label={createCopy.applyVocabularyReviewLabel(
																	module.title,
																)}
																value={
																	formState
																		.applyVocabularyByModule[
																		module
																			.id
																	] === true
																		? createCopy.applyVocabularyReviewOn
																		: createCopy.applyVocabularyReviewOff
																}
															/>
														</div>
													);
												}
												return (
													<div
														key={`${module.id}-review`}
													>
														<ReviewRow
															label={createCopy.applyTranslationReviewLabel(
																module.title,
															)}
															value={
																formState
																	.applyTranslationByModule[
																	module.id
																] === true
																	? createCopy.applyTranslationReviewOn
																	: createCopy.applyTranslationReviewOff
															}
														/>
														<ReviewRow
															label={createCopy.applyVocabularyReviewLabel(
																module.title,
															)}
															value={
																formState
																	.applyVocabularyByModule[
																	module.id
																] === true
																	? createCopy.applyVocabularyReviewOn
																	: createCopy.applyVocabularyReviewOff
															}
														/>
													</div>
												);
											})}
										</dl>
									</div>
								</div>
							</>
						)}

						{disabledReason && (
							<p className="text-sm text-muted-foreground">
								{disabledReason}
							</p>
						)}
					</div>

					<DialogFooter className="border-t border-border px-6 py-4">
						{isProgressView && isRunFinished && (
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
						{!isProgressView && wizardStepIndex > 0 && (
							<Button
								type="button"
								variant="outline"
								disabled={formDisabled}
								onClick={goBack}
							>
								{wizardCopy.back}
							</Button>
						)}
						{!isProgressView && wizardStep !== "review" && (
							<Button
								type="button"
								disabled={
									formDisabled || Boolean(duplicateTestId)
								}
								onClick={goNext}
								className="w-full sm:ml-auto sm:w-auto"
							>
								{wizardCopy.next}
							</Button>
						)}
						{!isProgressView && wizardStep === "review" && (
							<Button
								type="button"
								disabled={
									formDisabled || Boolean(duplicateTestId)
								}
								onClick={runCreatePipeline}
								className="w-full sm:ml-auto sm:w-auto"
							>
								{submitLabel}
							</Button>
						)}
					</DialogFooter>
				</div>
			</DialogContent>
		</Dialog>
	);
}
