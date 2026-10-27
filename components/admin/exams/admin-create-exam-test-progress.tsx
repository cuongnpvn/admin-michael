"use client";

import { Check, Circle, Download, Loader2, Minus, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { AdminInstructionId } from "@/lib/admin/instructions/catalog";
import {
	shouldApplyVocabularyForModule,
	shouldRunModuleProcess,
} from "@/components/admin/exams/create-exam-test-form";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export type CreateExamWizardStepId = "info" | "upload" | "review";

export type CreateExamProgressStatus =
	| "pending"
	| "running"
	| "done"
	| "skipped"
	| "error";

/** Granular in-flight detail for a running phase (drives sub-step UI). */
export type ExamPhaseDetail =
	| "sending"
	| "waiting"
	| "parsing"
	| "importing"
	| "exporting"
	| "translating"
	| "retrying"
	| "complete";

export interface ExamModulePhaseStatus {
	status: CreateExamProgressStatus;
	detail?: ExamPhaseDetail;
	error?: string;
	/** Gemini response JSON for admin download when QA/parse fails. */
	debugJson?: string;
	/** 1-based Gemini attempt when Part 5 validation retries are active. */
	retryAttempt?: number;
	maxAttempts?: number;
}

export interface ExamProgressSubStep {
	id: string;
	label: string;
	status: CreateExamProgressStatus;
	statusLabel: string;
	error?: string;
	debugJson?: string;
}

export interface ExamModuleProgressItem {
	moduleId: AdminInstructionId;
	title: string;
	gemini: ExamModulePhaseStatus;
	import: ExamModulePhaseStatus;
	translation: ExamModulePhaseStatus;
	vocabulary: ExamModulePhaseStatus;
}

export interface ExamRunProgressState {
	init: ExamModulePhaseStatus;
	finalize: ExamModulePhaseStatus;
	modules: ExamModuleProgressItem[];
}

export type CreateExamProgressStepId =
	| "init"
	| "finalize"
	| `gemini-${AdminInstructionId}`
	| `import-${AdminInstructionId}`
	| `translation-${AdminInstructionId}`;

export interface CreateExamProgressStep {
	id: CreateExamProgressStepId;
	label: string;
	status: CreateExamProgressStatus;
	error?: string;
}

export function geminiProgressStepId(
	moduleId: AdminInstructionId,
): `gemini-${AdminInstructionId}` {
	return `gemini-${moduleId}`;
}

export function importProgressStepId(
	moduleId: AdminInstructionId,
): `import-${AdminInstructionId}` {
	return `import-${moduleId}`;
}

export function translationProgressStepId(
	moduleId: AdminInstructionId,
): `translation-${AdminInstructionId}` {
	return `translation-${moduleId}`;
}

export function initialExamRunProgress(
	moduleIds: AdminInstructionId[],
	moduleTitles: Record<AdminInstructionId, string>,
	applyTranslationByModule: Partial<Record<AdminInstructionId, boolean>> = {},
	applyVocabularyByModule: Partial<Record<AdminInstructionId, boolean>> = {},
): ExamRunProgressState {
	return {
		init: { status: "pending" },
		finalize: { status: "pending" },
		modules: moduleIds.map((moduleId) => ({
			moduleId,
			title: moduleTitles[moduleId] ?? moduleId,
			gemini: { status: "pending" },
			import: { status: "pending" },
			translation: {
				status: shouldRunModuleProcess(moduleId, applyTranslationByModule)
					? "pending"
					: "skipped",
			},
			vocabulary: {
				status: shouldApplyVocabularyForModule(
					moduleId,
					applyVocabularyByModule,
				)
					? "pending"
					: "skipped",
			},
		})),
	};
}

export function patchModuleGemini(
	state: ExamRunProgressState,
	moduleId: AdminInstructionId,
	patch: Partial<ExamModulePhaseStatus>,
): ExamRunProgressState {
	return {
		...state,
		modules: state.modules.map((module) =>
			module.moduleId === moduleId
				? { ...module, gemini: { ...module.gemini, ...patch } }
				: module,
		),
	};
}

export function patchModuleImport(
	state: ExamRunProgressState,
	moduleId: AdminInstructionId,
	patch: Partial<ExamModulePhaseStatus>,
): ExamRunProgressState {
	return {
		...state,
		modules: state.modules.map((module) =>
			module.moduleId === moduleId
				? { ...module, import: { ...module.import, ...patch } }
				: module,
		),
	};
}

export function patchModuleTranslation(
	state: ExamRunProgressState,
	moduleId: AdminInstructionId,
	patch: Partial<ExamModulePhaseStatus>,
): ExamRunProgressState {
	return {
		...state,
		modules: state.modules.map((module) =>
			module.moduleId === moduleId
				? {
						...module,
						translation: { ...module.translation, ...patch },
					}
				: module,
		),
	};
}

export function patchModuleVocabulary(
	state: ExamRunProgressState,
	moduleId: AdminInstructionId,
	patch: Partial<ExamModulePhaseStatus>,
): ExamRunProgressState {
	return {
		...state,
		modules: state.modules.map((module) =>
			module.moduleId === moduleId
				? {
						...module,
						vocabulary: { ...module.vocabulary, ...patch },
					}
				: module,
		),
	};
}

export function isModuleFullySucceeded(
	module: ExamModuleProgressItem,
): boolean {
	let ok =
		module.gemini.status === "done" && module.import.status === "done";
	if (module.translation.status !== "skipped") {
		ok = ok && module.translation.status === "done";
	}
	if (module.vocabulary.status !== "skipped") {
		ok = ok && module.vocabulary.status === "done";
	}
	return ok;
}

export function isModuleFailed(module: ExamModuleProgressItem): boolean {
	return (
		module.gemini.status === "error" ||
		module.import.status === "error" ||
		module.translation.status === "error" ||
		module.vocabulary.status === "error"
	);
}

export interface ExamRunSummary {
	succeeded: ExamModuleProgressItem[];
	failed: ExamModuleProgressItem[];
	skipped: ExamModuleProgressItem[];
}

export function summarizeExamRun(
	modules: ExamModuleProgressItem[],
): ExamRunSummary {
	const succeeded: ExamModuleProgressItem[] = [];
	const failed: ExamModuleProgressItem[] = [];
	const skipped: ExamModuleProgressItem[] = [];

	for (const examModule of modules) {
		if (isModuleFullySucceeded(examModule)) {
			succeeded.push(examModule);
		} else if (isModuleFailed(examModule)) {
			failed.push(examModule);
		} else if (
			examModule.gemini.status === "skipped" ||
			examModule.import.status === "skipped"
		) {
			skipped.push(examModule);
		}
	}

	return { succeeded, failed, skipped };
}

export function examRunProgressPercent(state: ExamRunProgressState): number {
	const units: CreateExamProgressStatus[] = [
		state.init.status,
		state.finalize.status,
		...state.modules.flatMap((module) => [
			module.gemini.status,
			module.import.status,
			module.translation.status,
			module.vocabulary.status,
		]),
	];

	if (units.length === 0) return 0;

	const weighted = units.reduce((sum, status) => {
		if (status === "done" || status === "skipped") return sum + 1;
		if (status === "running") return sum + 0.5;
		if (status === "error") return sum + 1;
		return sum;
	}, 0);

	return Math.min(100, (weighted / units.length) * 100);
}

export function activeModuleId(
	state: ExamRunProgressState,
): AdminInstructionId | null {
	const running = state.modules.find(
		(module) =>
			module.gemini.status === "running" ||
			module.import.status === "running" ||
			module.translation.status === "running" ||
			module.vocabulary.status === "running",
	);
	return running?.moduleId ?? null;
}

/** Yields one frame so progress UI can paint before a long server action. */
export async function yieldProgressUi(): Promise<void> {
	await new Promise<void>((resolve) => {
		requestAnimationFrame(() => resolve());
	});
}

interface WizardStepIndicatorProps {
	steps: Array<{ id: CreateExamWizardStepId; label: string }>;
	currentStep: CreateExamWizardStepId;
}

export function WizardStepIndicator({
	steps,
	currentStep,
}: WizardStepIndicatorProps) {
	const currentIndex = steps.findIndex((step) => step.id === currentStep);

	return (
		<ol className="flex items-center gap-2">
			{steps.map((step, index) => {
				const isComplete = index < currentIndex;
				const isCurrent = step.id === currentStep;

				return (
					<li
						key={step.id}
						className="flex min-w-0 flex-1 items-center gap-2"
					>
						<div
							className={cn(
								"flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
								isComplete &&
									"border-primary bg-primary text-primary-foreground",
								isCurrent && "border-primary text-primary",
								!isComplete &&
									!isCurrent &&
									"border-border text-muted-foreground",
							)}
						>
							{isComplete ? (
								<Check className="size-3.5" />
							) : (
								index + 1
							)}
						</div>
						<span
							className={cn(
								"hidden truncate text-xs sm:block",
								isCurrent
									? "font-medium text-foreground"
									: "text-muted-foreground",
							)}
						>
							{step.label}
						</span>
						{index < steps.length - 1 && (
							<div
								className={cn(
									"hidden h-px flex-1 sm:block",
									isComplete ? "bg-primary" : "bg-border",
								)}
							/>
						)}
					</li>
				);
			})}
		</ol>
	);
}

export interface ExamProgressLabels {
	init: string;
	finalize: string;
	gemini: string;
	import: string;
	translation: string;
	vocabulary: string;
	done: string;
	skipped: string;
	failed: string;
	pending: string;
	running: string;
	waiting: string;
	sending: string;
	importing: string;
	exporting: string;
	translating: string;
	validationRetry: (attempt: number, maxAttempts: number) => string;
	tabSystem: string;
	stepGeminiSend: string;
	stepGeminiWait: string;
	stepGeminiParse: string;
	downloadGeminiJson: string;
	stepImportSupabase: string;
	stepTranslationExport: string;
	stepTranslationGeminiSend: string;
	stepTranslationGeminiWait: string;
	stepTranslationImport: string;
	stepInitRecord: string;
	stepFinalizeCache: string;
	moduleTabLabel: (moduleId: AdminInstructionId, title: string) => string;
	resultAllSuccess: (count: number) => string;
	resultPartial: (success: number, failed: number) => string;
	resultAllFailed: string;
	retryHint: string;
	viewTest: string;
}

function subStepStatusLabel(
	status: CreateExamProgressStatus,
	detail: ExamPhaseDetail | undefined,
	labels: ExamProgressLabels,
	phase?: Pick<ExamModulePhaseStatus, "retryAttempt" | "maxAttempts">,
): string {
	if (status === "pending") return labels.pending;
	if (status === "done") return labels.done;
	if (status === "skipped") return labels.skipped;
	if (status === "error") return labels.failed;
	if (detail === "retrying" && phase?.retryAttempt && phase?.maxAttempts) {
		return labels.validationRetry(phase.retryAttempt, phase.maxAttempts);
	}
	if (detail === "sending") return labels.sending;
	if (detail === "waiting") return labels.waiting;
	if (detail === "parsing") return labels.running;
	if (detail === "importing") return labels.importing;
	if (detail === "exporting") return labels.exporting;
	if (detail === "translating") return labels.translating;
	return labels.running;
}

function deriveSequentialSteps(
	steps: Array<{ id: string; label: string }>,
	phase: ExamModulePhaseStatus,
	labels: ExamProgressLabels,
): ExamProgressSubStep[] {
	if (phase.status === "skipped") {
		return steps.map((step) => ({
			...step,
			status: "skipped" as const,
			statusLabel: labels.skipped,
		}));
	}

	if (phase.status === "pending") {
		return steps.map((step) => ({
			...step,
			status: "pending" as const,
			statusLabel: labels.pending,
		}));
	}

	if (phase.status === "error") {
		const failedIndex = (() => {
			switch (phase.detail) {
				case "sending":
					return 0;
				case "waiting":
					return 1;
				case "parsing":
					return steps.length - 1;
				case "importing":
				case "exporting":
				case "translating":
					return steps.findIndex((step) =>
						["import", "export", "translate-import"].includes(
							step.id,
						),
					);
				default:
					return steps.length - 1;
			}
		})();

		return steps.map((step, index) => {
			if (index < failedIndex) {
				return {
					...step,
					status: "done" as const,
					statusLabel: labels.done,
				};
			}
			if (index === failedIndex) {
				return {
					...step,
					status: "error" as const,
					statusLabel: labels.failed,
					error: phase.error,
					debugJson: phase.debugJson,
				};
			}
			return {
				...step,
				status: "skipped" as const,
				statusLabel: labels.skipped,
			};
		});
	}

	if (phase.status === "done") {
		return steps.map((step) => ({
			...step,
			status: "done" as const,
			statusLabel: labels.done,
		}));
	}

	const activeIndex = (() => {
		switch (phase.detail) {
			case "retrying":
				return 0;
			case "sending":
				return 0;
			case "waiting":
				return 1;
			case "parsing":
				return steps.length - 1;
			case "importing":
				return steps.findIndex(
					(step) =>
						step.id === "import" || step.id === "translate-import",
				);
			case "exporting":
				return steps.findIndex((step) => step.id === "export");
			default:
				return 0;
		}
	})();

	return steps.map((step, index) => {
		if (index < activeIndex) {
			return {
				...step,
				status: "done" as const,
				statusLabel: labels.done,
			};
		}
		if (index === activeIndex) {
			return {
				...step,
				status: "running" as const,
				statusLabel: subStepStatusLabel(
					"running",
					phase.detail,
					labels,
					phase,
				),
			};
		}
		return {
			...step,
			status: "pending" as const,
			statusLabel: labels.pending,
		};
	});
}

export function buildModuleProgressSteps(
	module: ExamModuleProgressItem,
	labels: ExamProgressLabels,
): ExamProgressSubStep[] {
	const geminiSteps = deriveSequentialSteps(
		[
			{ id: "gemini-send", label: labels.stepGeminiSend },
			{ id: "gemini-wait", label: labels.stepGeminiWait },
			{ id: "gemini-parse", label: labels.stepGeminiParse },
		],
		module.gemini,
		labels,
	);

	const importSteps = deriveSequentialSteps(
		[{ id: "import", label: labels.stepImportSupabase }],
		module.import,
		labels,
	);

	const translationSteps =
		module.translation.status === "skipped"
			? []
			: deriveSequentialSteps(
					[
						{ id: "export", label: labels.stepTranslationExport },
						{
							id: "translate-send",
							label: labels.stepTranslationGeminiSend,
						},
						{
							id: "translate-wait",
							label: labels.stepTranslationGeminiWait,
						},
						{
							id: "translate-import",
							label: labels.stepTranslationImport,
						},
					],
					module.translation,
					labels,
				);

	const vocabularySteps =
		module.vocabulary.status === "skipped"
			? []
			: deriveSequentialSteps(
					[
						{
							id: "vocab-export",
							label: labels.stepTranslationExport,
						},
						{
							id: "vocab-send",
							label: labels.stepTranslationGeminiSend,
						},
						{
							id: "vocab-wait",
							label: labels.stepTranslationGeminiWait,
						},
						{
							id: "vocab-import",
							label: labels.stepTranslationImport,
						},
					],
					module.vocabulary,
					labels,
				);

	return [
		...geminiSteps,
		...importSteps,
		...translationSteps,
		...vocabularySteps,
	];
}

export function buildSystemProgressSteps(
	init: ExamModulePhaseStatus,
	finalize: ExamModulePhaseStatus,
	labels: ExamProgressLabels,
): ExamProgressSubStep[] {
	return [
		...deriveSequentialSteps(
			[{ id: "init", label: labels.stepInitRecord }],
			init,
			labels,
		),
		...deriveSequentialSteps(
			[{ id: "finalize", label: labels.stepFinalizeCache }],
			finalize,
			labels,
		),
	];
}

function moduleTabStatusIcon(module: ExamModuleProgressItem) {
	if (isModuleFailed(module)) {
		return <X className="size-3 shrink-0 text-destructive" />;
	}
	if (isModuleFullySucceeded(module)) {
		return <Check className="size-3 shrink-0 text-primary" />;
	}
	if (
		module.gemini.status === "running" ||
		module.import.status === "running" ||
		module.translation.status === "running" ||
		module.vocabulary.status === "running"
	) {
		return (
			<Loader2 className="size-3 shrink-0 animate-spin text-primary" />
		);
	}
	return <Circle className="size-3 shrink-0 text-muted-foreground/50" />;
}

interface CreateExamModuleProgressPanelProps {
	title: string;
	subtitle: string;
	state: ExamRunProgressState;
	labels: ExamProgressLabels;
	isFinished: boolean;
	viewTestHref?: string;
}

function PhaseStatusIcon({ status }: { status: CreateExamProgressStatus }) {
	if (status === "running") {
		return (
			<Loader2 className="size-4 shrink-0 animate-spin text-primary" />
		);
	}
	if (status === "done") {
		return <Check className="size-4 shrink-0 text-primary" />;
	}
	if (status === "skipped") {
		return <Minus className="size-4 shrink-0 text-muted-foreground" />;
	}
	if (status === "error") {
		return <X className="size-4 shrink-0 text-destructive" />;
	}
	return <Circle className="size-4 shrink-0 text-muted-foreground/40" />;
}

function downloadJsonFile(json: string, filename: string) {
	const blob = new Blob([json], { type: "application/json" });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = filename;
	anchor.click();
	URL.revokeObjectURL(url);
}

function SubStepTimeline({
	steps,
	labels,
}: {
	steps: ExamProgressSubStep[];
	labels: ExamProgressLabels;
}) {
	if (steps.length === 0) {
		return (
			<p className="text-sm text-muted-foreground">{labels.pending}</p>
		);
	}

	return (
		<ul className="space-y-2">
			{steps.map((step) => (
				<li
					key={step.id}
					className={cn(
						"flex gap-2.5 rounded-[8px] border px-3 py-2.5",
						step.status === "running" &&
							"border-primary/30 bg-background",
						step.status === "error" &&
							"border-destructive/30 bg-background",
						step.status !== "running" &&
							step.status !== "error" &&
							"border-border/80 bg-muted/20",
					)}
				>
					<div className="mt-0.5 shrink-0">
						<PhaseStatusIcon status={step.status} />
					</div>
					<div className="min-w-0 flex-1">
						<div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
							<p
								className={cn(
									"text-sm font-medium leading-snug",
									step.status === "pending" &&
										"text-muted-foreground",
									step.status === "error" &&
										"text-destructive",
								)}
							>
								{step.label}
							</p>
							<span
								className={cn(
									"text-xs",
									step.status === "running" && "text-primary",
									step.status === "done" &&
										"text-muted-foreground",
									step.status === "error" &&
										"text-destructive",
									step.status === "pending" &&
										"text-muted-foreground/70",
									step.status === "skipped" &&
										"text-muted-foreground/70",
								)}
							>
								{step.statusLabel}
							</span>
						</div>
						{step.error && (
							<p className="mt-1 text-xs leading-relaxed text-destructive">
								{step.error}
							</p>
						)}
						{step.debugJson ? (
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="mt-2 h-7 gap-1.5 text-xs"
								onClick={() =>
									downloadJsonFile(
										step.debugJson!,
										"reading-part-7-gemini-qa-failed.json",
									)
								}
							>
								<Download className="size-3.5" />
								{labels.downloadGeminiJson}
							</Button>
						) : null}
					</div>
				</li>
			))}
		</ul>
	);
}

function modulePhaseSubtitle(
	module: ExamModuleProgressItem,
	labels: ExamProgressLabels,
	steps: ExamProgressSubStep[],
): string {
	const { gemini } = module;
	const moduleDone = isModuleFullySucceeded(module);
	const moduleFailed = isModuleFailed(module);

	if (moduleDone) return labels.done;
	if (moduleFailed) return labels.failed;

	if (
		gemini.status === "running" &&
		gemini.detail === "retrying" &&
		gemini.retryAttempt &&
		gemini.maxAttempts
	) {
		return labels.validationRetry(gemini.retryAttempt, gemini.maxAttempts);
	}

	return (
		steps.find((step) => step.status === "running")?.statusLabel ??
		labels.pending
	);
}

function ModuleProgressDetail({
	module,
	labels,
}: {
	module: ExamModuleProgressItem;
	labels: ExamProgressLabels;
}) {
	const steps = buildModuleProgressSteps(module, labels);
	const moduleFailed = isModuleFailed(module);
	const moduleDone = isModuleFullySucceeded(module);
	const showRetryBanner =
		module.gemini.status === "running" &&
		module.gemini.detail === "retrying" &&
		module.gemini.retryAttempt &&
		module.gemini.maxAttempts;

	return (
		<div className="space-y-4">
			<header className="flex items-start justify-between gap-2">
				<div>
					<h4 className="text-sm font-semibold">{module.title}</h4>
					<p className="mt-0.5 text-xs text-muted-foreground">
						{modulePhaseSubtitle(module, labels, steps)}
					</p>
				</div>
				{moduleDone && (
					<span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
						{labels.done}
					</span>
				)}
				{moduleFailed && (
					<span className="shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
						{labels.failed}
					</span>
				)}
			</header>
			{showRetryBanner && (
				<div className="rounded-[8px] border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-950 dark:text-amber-100">
					<p className="font-medium">
						{labels.validationRetry(
							module.gemini.retryAttempt!,
							module.gemini.maxAttempts!,
						)}
					</p>
					{module.gemini.error ? (
						<p className="mt-1 text-muted-foreground">
							{module.gemini.error}
						</p>
					) : null}
				</div>
			)}
			<SubStepTimeline steps={steps} labels={labels} />
		</div>
	);
}

function SystemProgressDetail({
	init,
	finalize,
	labels,
}: {
	init: ExamModulePhaseStatus;
	finalize: ExamModulePhaseStatus;
	labels: ExamProgressLabels;
}) {
	const steps = buildSystemProgressSteps(init, finalize, labels);

	return (
		<div className="space-y-4">
			<header>
				<h4 className="text-sm font-semibold">{labels.tabSystem}</h4>
				<p className="mt-0.5 text-xs text-muted-foreground">
					{steps.find((step) => step.status === "running")
						?.statusLabel ?? labels.pending}
				</p>
			</header>
			<SubStepTimeline steps={steps} labels={labels} />
		</div>
	);
}

function RunSummaryBanner({
	summary,
	labels,
}: {
	summary: ExamRunSummary;
	labels: ExamProgressLabels;
}) {
	const { succeeded, failed } = summary;

	let message: string;
	let tone: "success" | "warning" | "error";

	if (failed.length === 0 && succeeded.length > 0) {
		message = labels.resultAllSuccess(succeeded.length);
		tone = "success";
	} else if (succeeded.length > 0 && failed.length > 0) {
		message = labels.resultPartial(succeeded.length, failed.length);
		tone = "warning";
	} else if (failed.length > 0) {
		message = labels.resultAllFailed;
		tone = "error";
	} else {
		return null;
	}

	return (
		<div
			className={cn(
				"space-y-2 rounded-[10px] border px-4 py-3 text-sm",
				tone === "success" && "border-primary/30 bg-primary/5",
				tone === "warning" && "border-amber-500/30 bg-amber-500/5",
				tone === "error" && "border-destructive/30 bg-destructive/5",
			)}
		>
			<p className="font-medium">{message}</p>
			{failed.length > 0 && (
				<ul className="space-y-1 text-xs text-muted-foreground">
					{failed.map((module) => (
						<li key={module.moduleId}>
							<span className="font-medium text-foreground">
								{module.title}:
							</span>{" "}
							{module.gemini.error ??
								module.import.error ??
								module.translation.error ??
								module.vocabulary.error ??
								labels.failed}
						</li>
					))}
				</ul>
			)}
			{failed.length > 0 && succeeded.length > 0 && (
				<p className="text-xs text-muted-foreground">
					{labels.retryHint}
				</p>
			)}
		</div>
	);
}

export function CreateExamModuleProgressPanel({
	title,
	subtitle,
	state,
	labels,
	isFinished,
	viewTestHref,
}: CreateExamModuleProgressPanelProps) {
	const percent = examRunProgressPercent(state);
	const summary = summarizeExamRun(state.modules);
	const runningModuleId = activeModuleId(state);
	const [selectedTab, setSelectedTab] = useState("system");
	const [userPickedTab, setUserPickedTab] = useState(false);

	useEffect(() => {
		if (userPickedTab) return;
		if (runningModuleId) {
			setSelectedTab(runningModuleId);
			return;
		}
		if (
			state.init.status === "running" ||
			state.finalize.status === "running"
		) {
			setSelectedTab("system");
		}
	}, [
		runningModuleId,
		state.init.status,
		state.finalize.status,
		userPickedTab,
	]);

	return (
		<div className="space-y-5 py-2">
			<div className="space-y-2">
				<h3 className="text-base font-medium">{title}</h3>
				<p className="text-sm text-muted-foreground">{subtitle}</p>
				<Progress value={percent} className="h-2" />
				<p className="text-xs text-muted-foreground">
					{Math.round(percent)}%
				</p>
			</div>

			<Tabs
				value={selectedTab}
				onValueChange={(value) => {
					setSelectedTab(value);
					setUserPickedTab(true);
				}}
				className="gap-3"
			>
				<TabsList className="h-auto w-full flex-wrap justify-start gap-1 p-1">
					<TabsTrigger
						value="system"
						className="gap-1.5 text-xs sm:text-sm"
					>
						{state.init.status === "running" ||
						state.finalize.status === "running" ? (
							<Loader2 className="size-3 shrink-0 animate-spin" />
						) : state.init.status === "error" ||
						  state.finalize.status === "error" ? (
							<X className="size-3 shrink-0 text-destructive" />
						) : state.init.status === "done" &&
						  (state.finalize.status === "done" ||
								state.finalize.status === "pending") ? (
							<Check className="size-3 shrink-0" />
						) : (
							<Circle className="size-3 shrink-0 opacity-40" />
						)}
						{labels.tabSystem}
					</TabsTrigger>
					{state.modules.map((module) => (
						<TabsTrigger
							key={module.moduleId}
							value={module.moduleId}
							className="gap-1.5 text-xs sm:text-sm"
						>
							{moduleTabStatusIcon(module)}
							{labels.moduleTabLabel(
								module.moduleId,
								module.title,
							)}
						</TabsTrigger>
					))}
				</TabsList>

				<TabsContent
					value="system"
					className="rounded-[12px] border border-border bg-muted/20 p-4"
				>
					<SystemProgressDetail
						init={state.init}
						finalize={state.finalize}
						labels={labels}
					/>
				</TabsContent>

				{state.modules.map((module) => (
					<TabsContent
						key={module.moduleId}
						value={module.moduleId}
						className="rounded-[12px] border border-border bg-muted/20 p-4"
					>
						<ModuleProgressDetail module={module} labels={labels} />
					</TabsContent>
				))}
			</Tabs>

			{isFinished && (
				<RunSummaryBanner summary={summary} labels={labels} />
			)}

			{isFinished && viewTestHref && summary.succeeded.length > 0 && (
				<Link
					href={viewTestHref}
					className="inline-flex text-sm font-medium text-primary hover:underline"
				>
					{labels.viewTest}
				</Link>
			)}
		</div>
	);
}

export function buildTranslationOnlyProgressSteps(
	translation: ExamModulePhaseStatus,
	labels: ExamProgressLabels,
): ExamProgressSubStep[] {
	return deriveSequentialSteps(
		[
			{ id: "export", label: labels.stepTranslationExport },
			{ id: "translate-send", label: labels.stepTranslationGeminiSend },
			{ id: "translate-wait", label: labels.stepTranslationGeminiWait },
			{ id: "translate-import", label: labels.stepTranslationImport },
		],
		translation,
		labels,
	);
}

export function PassageTranslationProgressPanel({
	translation,
	labels,
	isFinished,
}: {
	translation: ExamModulePhaseStatus;
	labels: ExamProgressLabels;
	isFinished?: boolean;
}) {
	const steps = buildTranslationOnlyProgressSteps(translation, labels);

	return (
		<div className="space-y-3 rounded-[10px] border border-border bg-muted/20 p-4">
			<h4 className="text-sm font-semibold">{labels.translation}</h4>
			<SubStepTimeline steps={steps} labels={labels} />
			{isFinished && translation.status === "done" ? (
				<p className="text-sm text-success">{labels.done}</p>
			) : null}
			{isFinished &&
			translation.status === "error" &&
			translation.error ? (
				<p className="text-sm text-destructive">{translation.error}</p>
			) : null}
		</div>
	);
}

export function SingleModuleProgressPanel({
	module,
	labels,
	isFinished,
}: {
	module: ExamModuleProgressItem;
	labels: ExamProgressLabels;
	isFinished: boolean;
	isActive?: boolean;
}) {
	const summary = summarizeExamRun([module]);

	return (
		<div className="space-y-4 py-2">
			<div className="rounded-[12px] border border-border bg-muted/20 p-4">
				<ModuleProgressDetail module={module} labels={labels} />
			</div>
			{isFinished && (
				<RunSummaryBanner summary={summary} labels={labels} />
			)}
		</div>
	);
}

export function updateProgressStep(
	steps: CreateExamProgressStep[],
	id: CreateExamProgressStepId,
	status: CreateExamProgressStatus,
	error?: string,
): CreateExamProgressStep[] {
	return steps.map((step) =>
		step.id === id ? { ...step, status, error } : step,
	);
}

export function progressPercent(steps: CreateExamProgressStep[]): number {
	if (steps.length === 0) return 0;
	const weighted = steps.reduce((sum, step) => {
		if (step.status === "done" || step.status === "skipped") return sum + 1;
		if (step.status === "running") return sum + 0.5;
		if (step.status === "error") return sum + 1;
		return sum;
	}, 0);
	return Math.min(100, (weighted / steps.length) * 100);
}
