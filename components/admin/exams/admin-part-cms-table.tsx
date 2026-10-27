"use client";

import { useRouter } from "next/navigation";
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	useTransition,
} from "react";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AlignAllListeningPart3TurnsButton } from "@/components/admin/exams/align-all-listening-part3-turns-button";
import {
	AdminListeningGroupDialog,
	type ListeningGroupDraft,
} from "@/components/admin/exams/admin-listening-group-dialog";
import { ExportListeningTranslationsButton } from "@/components/admin/export/export-listening-translations-button";
import { ExportReadingPart5TranslationsButton } from "@/components/admin/export/export-reading-part5-translations-button";
import { ImportContentVocabularyDialog } from "@/components/admin/import/import-content-vocabulary-dialog";
import { ImportPart5TagsDialog } from "@/components/admin/import/import-part5-tags-dialog";
import { ImportListeningPartTagsDialog } from "@/components/admin/import/import-listening-part-tags-dialog";
import { ImportPassageTranslationsDialog } from "@/components/admin/import/import-passage-translations-dialog";
import {
	AdminListeningGroupGrid,
	buildListeningGroupSummaries,
} from "@/components/admin/exams/admin-listening-group-grid";
import { DifficultyScaleBar } from "@/components/study/difficulty-scale-bar";
import {
	AdminQuestionDetailDialog,
	type QuestionDraft,
} from "@/components/admin/exams/admin-question-detail-dialog";
import {
	addAdminQuestion,
	deleteAdminQuestion,
	swapAdminQuestions,
	saveAdminListeningGroup,
	saveAdminQuestionRow,
} from "@/lib/admin/content/part-editor-actions";
import { draftFieldsToExplanation } from "@/lib/content/question-explanation";
import { copy } from "@/lib/copy/vi";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type {
	AdminPartEditorData,
	AdminPartQuestionRow,
} from "@/types/admin-part-editor";
import type { OptionLabelDb } from "@/types/content-db";
import { cn } from "@/lib/utils";
import { partDifficultyStatKey } from "@/lib/practice/feedback/stat-keys";
import type { PracticeDifficultyStatsMap } from "@/lib/practice/feedback/types";

interface AdminPartCmsTableProps {
	initialData: AdminPartEditorData;
	difficultyStats?: PracticeDifficultyStatsMap;
}

const ALL_LABELS: OptionLabelDb[] = ["A", "B", "C", "D"];
const REORDER_LOG_PREFIX = "[admin-reorder]";

function logReorderClient(message: string, details?: Record<string, unknown>) {
	if (details) {
		console.info(REORDER_LOG_PREFIX, message, details);
		return;
	}
	console.info(REORDER_LOG_PREFIX, message);
}

function sortByGlobalItemNumber(
	questions: AdminPartQuestionRow[],
): AdminPartQuestionRow[] {
	return [...questions].sort(
		(a, b) => a.globalItemNumber - b.globalItemNumber,
	);
}

function correctLabelForQuestion(
	question: AdminPartQuestionRow,
): OptionLabelDb | "" {
	const correct = question.options.find(
		(o) => o.id === question.correctOptionId,
	);
	return correct?.label ?? "";
}

function displayPrompt(question: AdminPartQuestionRow): string {
	return question.prompt;
}

function optionText(
	question: AdminPartQuestionRow,
	label: OptionLabelDb,
): string {
	return question.options.find((o) => o.label === label)?.text ?? "";
}

function CellText({
	value,
	placeholder = "—",
	className,
}: {
	value: string;
	placeholder?: string;
	className?: string;
}) {
	const empty = !value.trim();
	const display = empty ? placeholder : value.trim();

	return (
		<span
			className={cn(
				"block truncate text-sm",
				empty && "text-muted-foreground",
				className,
			)}
		>
			{display}
		</span>
	);
}

export function AdminPartCmsTable({
	initialData,
	difficultyStats,
}: AdminPartCmsTableProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
		null,
	);
	const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
	const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
	const [isReorderMode, setIsReorderMode] = useState(false);
	const [orderedQuestions, setOrderedQuestions] = useState(
		initialData.questions,
	);
	const [draggingQuestionId, setDraggingQuestionId] = useState<string | null>(
		null,
	);
	const [dropTargetQuestionId, setDropTargetQuestionId] = useState<
		string | null
	>(null);
	const [isReorderSaving, setIsReorderSaving] = useState(false);
	const reorderWorkerRef = useRef<Promise<boolean> | null>(null);

	const partNum = Number.parseInt(initialData.part, 10);
	const supportsReorder = partNum === 1 || partNum === 2;
	const isGroupListeningPart = partNum === 3 || partNum === 4;
	const showPartDifficulty = partNum === 1 || partNum === 2 || partNum === 5;
	const partDifficultyStat = difficultyStats?.get(
		partDifficultyStatKey(partNum),
	);
	const optionLabels = partNum === 2 ? ALL_LABELS.slice(0, 3) : ALL_LABELS;
	const showPromptColumn = partNum !== 1;
	const isReadingPart = partNum >= 5 && partNum <= 7;
	const isListeningShortAnswerPart = partNum === 1 || partNum === 2;
	const showQuestionMetadata = isReadingPart || isGroupListeningPart;
	const showListeningPart12Metadata = isListeningShortAnswerPart;
	const showHintExplanationEditor =
		showQuestionMetadata || isListeningShortAnswerPart;
	const showTranslationsEditor =
		partNum === 5 || partNum === 6 || partNum === 7;
	const promptLabel = copy.admin.cms.colQuestion;

	const questionById = useMemo(
		() => new Map(initialData.questions.map((q) => [q.id, q])),
		[initialData.questions],
	);

	const listeningGroups = useMemo(
		() => buildListeningGroupSummaries(initialData.questions),
		[initialData.questions],
	);

	const questionsByGroupId = useMemo(() => {
		const map = new Map<string, AdminPartQuestionRow[]>();
		for (const group of listeningGroups) {
			map.set(group.groupId, group.questions);
		}
		return map;
	}, [listeningGroups]);

	const selectedQuestion = selectedQuestionId
		? (questionById.get(selectedQuestionId) ?? null)
		: null;

	const selectedGroupQuestions = selectedGroupId
		? (questionsByGroupId.get(selectedGroupId) ?? [])
		: [];

	const deleteTarget = deleteTargetId
		? (questionById.get(deleteTargetId) ?? null)
		: null;

	const colSpan =
		2 +
		(showPromptColumn ? 1 : 0) +
		optionLabels.length +
		(showQuestionMetadata ? 1 : 0) +
		2 +
		(supportsReorder && isReorderMode ? 1 : 0);

	const tableQuestions =
		supportsReorder && isReorderMode
			? orderedQuestions
			: initialData.questions;

	useEffect(() => {
		if (!isReorderMode) {
			setOrderedQuestions(initialData.questions);
		}
	}, [initialData.questions, isReorderMode]);

	const persistQuestionSwap = useCallback(
		(sourceId: string, targetId: string): Promise<boolean> => {
			logReorderClient("persistQuestionSwap:start", {
				bookId: initialData.bookId,
				testId: initialData.testId,
				part: partNum,
				sourceId,
				targetId,
			});
			setIsReorderSaving(true);

			const previous = reorderWorkerRef.current ?? Promise.resolve(true);
			const work = previous
				.catch(() => true)
				.then(async () => {
					const result = await swapAdminQuestions(
						initialData.bookId,
						initialData.testId,
						partNum,
						sourceId,
						targetId,
					);

					logReorderClient("persistQuestionSwap:result", {
						ok: result.ok,
						error: result.ok ? undefined : result.error,
					});

					if (!result.ok) {
						toast.error(
							result.error ?? copy.admin.cms.errors.generic,
						);
						setOrderedQuestions(initialData.questions);
						return false;
					}

					router.refresh();
					return true;
				})
				.finally(() => {
					if (reorderWorkerRef.current === work) {
						reorderWorkerRef.current = null;
						setIsReorderSaving(false);
					}
				});

			reorderWorkerRef.current = work;
			return work;
		},
		[
			initialData.bookId,
			initialData.testId,
			initialData.questions,
			partNum,
			router,
		],
	);

	async function toggleReorderMode() {
		if (isReorderMode) {
			logReorderClient("toggleReorderMode:exit");
			if (reorderWorkerRef.current) {
				await reorderWorkerRef.current;
			}
			setDraggingQuestionId(null);
			setDropTargetQuestionId(null);
			setIsReorderMode(false);
			return;
		}

		logReorderClient("toggleReorderMode:enter", {
			questionCount: initialData.questions.length,
		});

		setOrderedQuestions(initialData.questions);
		setDraggingQuestionId(null);
		setDropTargetQuestionId(null);
		setIsReorderMode(true);
	}

	function swapQuestionsInOrder(sourceId: string, targetId: string) {
		if (sourceId === targetId) return;

		setOrderedQuestions((current) => {
			const fromIndex = current.findIndex(
				(question) => question.id === sourceId,
			);
			const toIndex = current.findIndex(
				(question) => question.id === targetId,
			);
			logReorderClient("swapQuestionsInOrder", {
				sourceId,
				targetId,
				fromIndex,
				toIndex,
			});
			if (fromIndex === -1 || toIndex === -1) return current;

			const next = [...current];
			[next[fromIndex], next[toIndex]] = [next[toIndex], next[fromIndex]];
			return sortByGlobalItemNumber(next);
		});
		void persistQuestionSwap(sourceId, targetId);
	}

	function runAction(
		action: () => Promise<{ ok: boolean; error?: string }>,
		onSuccess?: () => void,
	) {
		startTransition(async () => {
			const result = await action();
			if (!result.ok) {
				toast.error(result.error ?? copy.admin.cms.errors.generic);
				return;
			}
			toast.success(copy.admin.cms.saved);
			onSuccess?.();
			router.refresh();
		});
	}

	function saveQuestionRow(questionId: string, draft: QuestionDraft) {
		const source = questionById.get(questionId);
		if (!source) return;

		const options = optionLabels
			.map((label) => draft.options[label])
			.filter((option): option is NonNullable<typeof option> =>
				Boolean(option),
			)
			.map((option) => ({
				id: option.id,
				text: option.text,
			}));

		const correctOption = draft.correctLabel
			? source.options.find((o) => o.label === draft.correctLabel)
			: null;

		runAction(
			() =>
				saveAdminQuestionRow(
					initialData.bookId,
					initialData.testId,
					partNum,
					questionId,
					{
						globalItemNumber: draft.globalItemNumber,
						prompt: partNum === 1 ? "" : draft.prompt,
						...(partNum === 2 ? { transcript: draft.prompt } : {}),
						correctOptionId: correctOption?.id ?? null,
						options,
						...(showHintExplanationEditor
							? {
									hint: draft.hint.trim()
										? draft.hint.trim()
										: null,
									explanation: draftFieldsToExplanation(
										draft.explanationReasoning,
										draft.explanationReferences,
									),
									freeExplanation: draft.freeExplanation,
									...(showQuestionMetadata ||
									showListeningPart12Metadata
										? {
												tags: draft.tags,
												...(showTranslationsEditor ||
												showListeningPart12Metadata
													? {
															translations:
																draft.translations.filter(
																	(row) =>
																		row.english.trim() ||
																		row.vietnamese.trim(),
																),
														}
													: {}),
											}
										: {}),
								}
							: {}),
					},
				),
			() => setSelectedQuestionId(null),
		);
	}

	function saveListeningGroup(groupId: string, draft: ListeningGroupDraft) {
		const questionRows = draft.questions.map((entry) => {
			const source = questionById.get(entry.questionId);
			if (!source) return null;

			const options = optionLabels
				.map((label) => entry.options[label])
				.filter((option): option is NonNullable<typeof option> =>
					Boolean(option),
				)
				.map((option) => ({
					id: option.id,
					text: option.text,
				}));

			const correctOption = entry.correctLabel
				? source.options.find((o) => o.label === entry.correctLabel)
				: null;

			return {
				questionId: entry.questionId,
				globalItemNumber: entry.globalItemNumber,
				prompt: entry.prompt,
				correctOptionId: correctOption?.id ?? null,
				options,
				hint: entry.hint.trim() ? entry.hint.trim() : null,
				explanation: draftFieldsToExplanation(
					entry.explanationReasoning,
					entry.explanationReferences,
				),
				tags: entry.tags,
			};
		});

		if (questionRows.some((row) => row === null)) {
			toast.error(copy.admin.cms.errors.generic);
			return;
		}

		runAction(
			() =>
				saveAdminListeningGroup(
					initialData.bookId,
					initialData.testId,
					partNum,
					groupId,
					{
						transcript: draft.transcriptText,
						groupTopic: draft.topic.trim() || null,
						freeExplanation: draft.freeExplanation,
						anchorTranslations: draft.translations
							.filter(
								(row) =>
									row.english.trim().length > 0 ||
									row.vietnamese.trim().length > 0,
							)
							.map((row) => ({
								english: row.english,
								vietnamese: row.vietnamese,
							})),
						questions: questionRows.filter(
							(row): row is NonNullable<typeof row> =>
								row !== null,
						),
					},
				),
			() => setSelectedGroupId(null),
		);
	}

	function confirmDelete() {
		if (!deleteTargetId) return;
		runAction(
			() =>
				deleteAdminQuestion(
					initialData.bookId,
					initialData.testId,
					partNum,
					deleteTargetId,
				),
			() => setDeleteTargetId(null),
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="space-y-3">
					<p className="text-sm text-muted-foreground">
						{isGroupListeningPart
							? `(${copy.admin.cms.groupGridHint(
									listeningGroups.length,
									initialData.questions.length,
								)} / ${initialData.targetCount} câu)`
							: `(${initialData.questions.length} / ${initialData.targetCount})`}
					</p>
					{showPartDifficulty ? (
						<DifficultyScaleBar
							score={partDifficultyStat?.median ?? 0}
							className="max-w-xs"
						/>
					) : null}
				</div>
				<div className="flex flex-wrap gap-2">
					{isGroupListeningPart ? (
						<>
							{partNum === 3 || partNum === 4 ? (
								<AlignAllListeningPart3TurnsButton
									bookId={initialData.bookId}
									testId={initialData.testId}
									groups={listeningGroups.map((group) => ({
										id: group.groupId,
										from: group.from,
										to: group.to,
									}))}
									disabled={isPending || isReorderMode}
								/>
							) : null}
							{partNum === 4 ? (
								<ExportListeningTranslationsButton
									bookId={initialData.bookId}
									testId={initialData.testId}
									part={4}
									disabled={isPending || isReorderMode}
								/>
							) : null}
							<ImportPassageTranslationsDialog
								bookId={initialData.bookId}
								testId={initialData.testId}
								part={partNum as 3 | 4}
								disabled={isPending || isReorderMode}
							/>
							<ImportContentVocabularyDialog
								bookId={initialData.bookId}
								testId={initialData.testId}
								part={partNum as 3 | 4}
								disabled={isPending || isReorderMode}
							/>
						</>
					) : partNum === 5 ? (
						<>
							<ExportReadingPart5TranslationsButton
								bookId={initialData.bookId}
								testId={initialData.testId}
								disabled={isPending || isReorderMode}
							/>
							<ImportPassageTranslationsDialog
								bookId={initialData.bookId}
								testId={initialData.testId}
								part={5}
								disabled={isPending || isReorderMode}
							/>
							<ImportContentVocabularyDialog
								bookId={initialData.bookId}
								testId={initialData.testId}
								part={5}
								disabled={isPending || isReorderMode}
							/>
							<ImportPart5TagsDialog
								bookId={initialData.bookId}
								testId={initialData.testId}
								disabled={isPending || isReorderMode}
							/>
						</>
					) : partNum === 1 || partNum === 2 ? (
						<>
							<ImportContentVocabularyDialog
								bookId={initialData.bookId}
								testId={initialData.testId}
								part={partNum}
								disabled={isPending || isReorderMode}
							/>
							<ImportListeningPartTagsDialog
								bookId={initialData.bookId}
								testId={initialData.testId}
								part={partNum === 1 ? 1 : 2}
								disabled={isPending || isReorderMode}
							/>
						</>
					) : null}
					{supportsReorder && (
						<Button
							type="button"
							variant={isReorderMode ? "default" : "outline"}
							size="sm"
							disabled={
								isPending || initialData.questions.length < 2
							}
							onClick={() => void toggleReorderMode()}
						>
							<GripVertical className="size-4" />
							{isReorderMode
								? copy.admin.cms.reorderQuestionsActive
								: copy.admin.cms.reorderQuestions}
						</Button>
					)}
					<Button
						type="button"
						variant="secondary"
						size="sm"
						disabled={isPending || isReorderMode}
						onClick={() =>
							runAction(() =>
								addAdminQuestion(
									initialData.bookId,
									initialData.testId,
									partNum,
								).then((r) => (r.ok ? { ok: true } : r)),
							)
						}
					>
						<Plus className="size-4" />
						{copy.admin.cms.addQuestion}
					</Button>
				</div>
			</div>

			{supportsReorder && isReorderMode && (
				<p className="text-sm text-muted-foreground">
					{copy.admin.cms.reorderQuestionsHint}
					{isReorderSaving
						? ` ${copy.admin.cms.reorderQuestionsSaving}`
						: ""}
				</p>
			)}

			{isGroupListeningPart ? (
				<AdminListeningGroupGrid
					questions={initialData.questions}
					difficultyStats={difficultyStats}
					onSelectGroup={setSelectedGroupId}
					showTurnAlignmentStatus={partNum === 3 || partNum === 4}
				/>
			) : (
				<div className="overflow-x-auto rounded-[14px] border border-border">
					<Table>
						<TableHeader>
							<TableRow>
								{supportsReorder && isReorderMode && (
									<TableHead
										className="w-10"
										aria-label={
											copy.admin.cms.reorderQuestions
										}
									/>
								)}
								<TableHead className="w-14">
									{isReadingPart
										? copy.admin.cms.colGlobalToeic
										: copy.admin.cms.colOrder}
								</TableHead>
								{showPromptColumn && (
									<TableHead className="min-w-50 max-w-70">
										{promptLabel}
									</TableHead>
								)}
								{optionLabels.map((label) => (
									<TableHead
										key={label}
										className="min-w-30 max-w-45 text-center"
									>
										{label}
									</TableHead>
								))}

								<TableHead className="w-16 text-center">
									{copy.admin.cms.colCorrect}
								</TableHead>
								<TableHead className="w-12" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{initialData.questions.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={colSpan}
										className="h-24 text-center text-muted-foreground"
									>
										{copy.admin.exams.noQuestions}
									</TableCell>
								</TableRow>
							) : (
								tableQuestions.map((question) => {
									const correctLabel =
										correctLabelForQuestion(question);
									const isDragging =
										draggingQuestionId === question.id;
									const isDropTarget =
										dropTargetQuestionId === question.id &&
										draggingQuestionId !== null &&
										draggingQuestionId !== question.id;

									return (
										<TableRow
											key={question.id}
											className={cn(
												"transition-calm",
												isReorderMode
													? "hover:bg-muted/30"
													: "cursor-pointer hover:bg-muted/40",
												isDragging && "opacity-50",
												isDropTarget &&
													"bg-primary/5 ring-1 ring-inset ring-primary/30",
											)}
											onClick={
												isReorderMode
													? undefined
													: () =>
															setSelectedQuestionId(
																question.id,
															)
											}
											onDragOver={
												isReorderMode
													? (event) => {
															event.preventDefault();
															event.dataTransfer.dropEffect =
																"move";
															setDropTargetQuestionId(
																question.id,
															);
														}
													: undefined
											}
											onDragLeave={
												isReorderMode
													? () => {
															setDropTargetQuestionId(
																(current) =>
																	current ===
																	question.id
																		? null
																		: current,
															);
														}
													: undefined
											}
											onDrop={
												isReorderMode
													? (event) => {
															event.preventDefault();
															const sourceId =
																event.dataTransfer.getData(
																	"text/plain",
																) ||
																draggingQuestionId;
															if (sourceId) {
																swapQuestionsInOrder(
																	sourceId,
																	question.id,
																);
															}
															setDraggingQuestionId(
																null,
															);
															setDropTargetQuestionId(
																null,
															);
														}
													: undefined
											}
										>
											{supportsReorder &&
												isReorderMode && (
													<TableCell
														className="w-10 px-2"
														onClick={(event) =>
															event.stopPropagation()
														}
													>
														<button
															type="button"
															draggable
															aria-label={
																copy.admin.cms
																	.reorderQuestions
															}
															className="inline-flex size-8 cursor-grab items-center justify-center rounded-[8px] text-muted-foreground transition-calm hover:bg-muted/60 active:cursor-grabbing"
															onDragStart={(
																event,
															) => {
																event.dataTransfer.effectAllowed =
																	"move";
																event.dataTransfer.setData(
																	"text/plain",
																	question.id,
																);
																setDraggingQuestionId(
																	question.id,
																);
															}}
															onDragEnd={() => {
																setDraggingQuestionId(
																	null,
																);
																setDropTargetQuestionId(
																	null,
																);
															}}
														>
															<GripVertical className="size-4" />
														</button>
													</TableCell>
												)}
											<TableCell className="max-w-[56px]">
												<CellText
													value={
														isReadingPart
															? String(
																	question.globalItemNumber,
																)
															: String(
																	question.globalItemNumber,
																)
													}
												/>
											</TableCell>

											{showPromptColumn && (
												<TableCell className="max-w-[280px]">
													<CellText
														value={displayPrompt(
															question,
														)}
														placeholder={
															copy.admin.cms
																.emptyAnswer
														}
													/>
												</TableCell>
											)}

											{optionLabels.map((label) => (
												<TableCell
													key={label}
													className="max-w-[180px]"
												>
													<CellText
														value={optionText(
															question,
															label,
														)}
														placeholder={
															copy.admin.cms
																.emptyAnswer
														}
														className="text-center"
													/>
												</TableCell>
											))}

											<TableCell className="text-center">
												<span className="inline-flex size-7 items-center justify-center rounded-full border border-border bg-surface text-xs font-semibold">
													{correctLabel || "—"}
												</span>
											</TableCell>

											<TableCell
												className="text-right"
												onClick={(event) =>
													event.stopPropagation()
												}
											>
												<Button
													type="button"
													size="icon"
													variant="ghost"
													disabled={
														isPending ||
														isReorderMode
													}
													className="text-muted-foreground hover:text-destructive"
													aria-label={
														copy.admin.cms
															.deleteQuestion
													}
													onClick={() =>
														setDeleteTargetId(
															question.id,
														)
													}
												>
													<Trash2 className="size-4" />
												</Button>
											</TableCell>
										</TableRow>
									);
								})
							)}
						</TableBody>
					</Table>
				</div>
			)}

			{!isGroupListeningPart && !isReorderMode && (
				<AdminQuestionDetailDialog
					open={selectedQuestionId !== null}
					onOpenChange={(open) => {
						if (!open) setSelectedQuestionId(null);
					}}
					question={selectedQuestion}
					bookId={initialData.bookId}
					testId={initialData.testId}
					partNum={partNum}
					optionLabels={optionLabels}
					showReadingMetadata={showQuestionMetadata}
					showTranslations={showTranslationsEditor}
					promptLabel={promptLabel}
					isPending={isPending}
					onSave={saveQuestionRow}
				/>
			)}

			{isGroupListeningPart && (
				<AdminListeningGroupDialog
					open={selectedGroupId !== null}
					onOpenChange={(open) => {
						if (!open) setSelectedGroupId(null);
					}}
					bookId={initialData.bookId}
					testId={initialData.testId}
					groupId={selectedGroupId}
					questions={selectedGroupQuestions}
					partNum={partNum}
					optionLabels={optionLabels}
					isPending={isPending}
					onSave={saveListeningGroup}
					onSaveQuestion={saveQuestionRow}
				/>
			)}

			<Dialog
				open={deleteTargetId !== null}
				onOpenChange={(open) => {
					if (!open) setDeleteTargetId(null);
				}}
			>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle>
							{copy.admin.cms.deleteConfirmTitle}
						</DialogTitle>
						<DialogDescription>
							{copy.admin.cms.deleteConfirmBody}
						</DialogDescription>
					</DialogHeader>
					{deleteTarget && (
						<p className="text-sm text-muted-foreground">
							{copy.admin.cms.questionDetailTitle(
								deleteTarget.globalItemNumber,
							)}{" "}
							—{" "}
							{displayPrompt(deleteTarget).slice(0, 80) ||
								copy.admin.cms.emptyAnswer}
						</p>
					)}
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							disabled={isPending}
							onClick={() => setDeleteTargetId(null)}
						>
							{copy.admin.cms.cancel}
						</Button>
						<Button
							type="button"
							variant="destructive"
							disabled={isPending}
							onClick={confirmDelete}
						>
							{copy.admin.cms.deleteQuestion}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
