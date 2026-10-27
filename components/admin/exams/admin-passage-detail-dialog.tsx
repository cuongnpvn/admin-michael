"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import { AdminPassageTranslationsEditor } from "@/components/admin/exams/admin-passage-translations-editor";
import {
	AdminQuestionDetailDialog,
	type QuestionDraft,
	type TranslationDraft,
} from "@/components/admin/exams/admin-question-detail-dialog";
import { PassageRenderer } from "@/components/reading/passage-templates/passage-renderer";
import { ContentVocabularyList } from "@/components/study/content-vocabulary-list";
import { splitTranslationsByPassages } from "@/lib/reading/passage-bilingual";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { copy } from "@/lib/copy/vi";
import type {
	AdminPartQuestionRow,
	AdminPassageSetRow,
} from "@/types/admin-part-editor";
import type { OptionLabelDb } from "@/types/content-db";
import { cn } from "@/lib/utils";

export type PassageDraft = {
	id: string;
	title: string;
	content: string;
	translationHtml?: string;
	translations?: TranslationDraft[];
};

export type PassageSetDraft = {
	topic: string;
	freeExplanation: boolean;
	passages: PassageDraft[];
	/** Part 6 flat translations on the anchor question. */
	translations: TranslationDraft[];
	/** Part 6 HTML passage translation on the anchor question. */
	translationHtml: string;
};

interface AdminPassageDetailDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	bookId: string;
	testId: string;
	passageSet: AdminPassageSetRow | null;
	questions: AdminPartQuestionRow[];
	partNum: number;
	optionLabels: OptionLabelDb[];
	isPending: boolean;
	onSavePassageSet: (setId: string, draft: PassageSetDraft) => void;
	onSaveQuestion: (questionId: string, draft: QuestionDraft) => void;
}

function buildPassageSetDraft(
	passageSet: AdminPassageSetRow,
	questions: AdminPartQuestionRow[],
	partNum: number,
): PassageSetDraft {
	const sortedQuestions = [...questions].sort(
		(a, b) => a.globalItemNumber - b.globalItemNumber,
	);
	const firstQuestion = sortedQuestions[0];
	const isPart7 = partNum === 7;

	return {
		topic: passageSet.topic ?? "",
		freeExplanation: Boolean(passageSet.freeExplanation),
		passages: passageSet.passages.map((passage) => ({
			id: passage.id,
			title: passage.title,
			content: passage.content,
			...(isPart7
				? {
						translationHtml: passage.translationHtml ?? "",
						translations: passage.translations.map((entry) => ({
							english: entry.english,
							vietnamese: entry.vietnamese,
						})),
					}
				: {}),
		})),
		translations: isPart7
			? []
			: (firstQuestion?.translations.map((entry) => ({
					english: entry.english,
					vietnamese: entry.vietnamese,
				})) ?? []),
		translationHtml: isPart7 ? "" : (firstQuestion?.translationHtml ?? ""),
	};
}

function mergePassageTranslationSlice(
	passages: Array<{ content: string }>,
	allTranslations: TranslationDraft[],
	passageIndex: number,
	nextSlice: TranslationDraft[],
): TranslationDraft[] {
	const slices = splitTranslationsByPassages(passages, allTranslations);
	const nextSlices = [...slices];
	nextSlices[passageIndex] = nextSlice;
	return nextSlices.flat();
}

function correctLabelForQuestion(
	question: AdminPartQuestionRow,
): OptionLabelDb | "" {
	const correct = question.options.find(
		(o) => o.id === question.correctOptionId,
	);
	return correct?.label ?? "";
}

function optionPreview(
	question: AdminPartQuestionRow,
	label: OptionLabelDb,
): string {
	return (
		question.options.find((option) => option.label === label)?.text ?? ""
	);
}

export function AdminPassageDetailDialog({
	open,
	onOpenChange,
	bookId,
	testId,
	passageSet,
	questions,
	partNum,
	optionLabels,
	isPending,
	onSavePassageSet,
	onSaveQuestion,
}: AdminPassageDetailDialogProps) {
	const [draft, setDraft] = useState<PassageSetDraft | null>(null);
	const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
		null,
	);

	const sortedQuestions = useMemo(
		() =>
			[...questions].sort(
				(a, b) => a.globalItemNumber - b.globalItemNumber,
			),
		[questions],
	);

	const questionById = useMemo(
		() =>
			new Map(sortedQuestions.map((question) => [question.id, question])),
		[sortedQuestions],
	);

	const selectedQuestion = selectedQuestionId
		? (questionById.get(selectedQuestionId) ?? null)
		: null;

	const isPart7 = partNum === 7;

	const perPassageTranslations = useMemo(() => {
		if (!draft) return [];

		if (isPart7) {
			return draft.passages.map((passage) => passage.translations ?? []);
		}

		return splitTranslationsByPassages(draft.passages, draft.translations);
	}, [draft, isPart7]);

	useEffect(() => {
		if (!passageSet || !open) {
			setDraft(null);
			setSelectedQuestionId(null);
			return;
		}
		setDraft(buildPassageSetDraft(passageSet, sortedQuestions, partNum));
	}, [passageSet, open, sortedQuestions, partNum]);

	function patchPassage(index: number, patch: Partial<PassageDraft>) {
		setDraft((prev) => {
			if (!prev) return prev;
			return {
				...prev,
				passages: prev.passages.map((passage, i) =>
					i === index ? { ...passage, ...patch } : passage,
				),
			};
		});
	}

	const displayTitle =
		draft?.passages[0]?.title.trim() ||
		draft?.topic.trim() ||
		copy.admin.cms.emptyAnswer;

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="flex max-h-[92vh] max-w-6xl flex-col gap-0 overflow-hidden p-0">
					{passageSet && draft && (
						<>
							<DialogHeader className="shrink-0 border-b border-border px-6 py-4">
								<DialogTitle>{displayTitle}</DialogTitle>
								<DialogDescription></DialogDescription>
							</DialogHeader>

							<div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
								<div className="min-h-0 overflow-y-auto border-b border-border px-6 py-5 lg:border-b-0 lg:border-r">
									<div className="space-y-6">
										{draft.passages.map(
											(passage, index) => (
												<div
													key={passage.id}
													className={cn(
														"space-y-4",
														index > 0 &&
															"border-t border-border pt-6",
													)}
												>
													<div className="grid gap-2">
														<Label
															htmlFor={`passage-title-${passage.id}`}
														>
															{
																copy.admin.cms
																	.passageTitleLabel
															}
															{draft.passages
																.length > 1
																? ` ${index + 1}`
																: ""}
														</Label>
														<Input
															id={`passage-title-${passage.id}`}
															value={
																passage.title
															}
															onChange={(event) =>
																patchPassage(
																	index,
																	{
																		title: event
																			.target
																			.value,
																	},
																)
															}
														/>
													</div>

													{index === 0 ? (
														<div className="grid gap-2">
															<Label htmlFor="passage-set-topic">
																{
																	copy.admin
																		.cms
																		.passageSetTopicLabel
																}
															</Label>
															<Input
																id="passage-set-topic"
																value={
																	draft.topic
																}
																placeholder={
																	copy.admin
																		.cms
																		.passageSetTopicPlaceholder
																}
																onChange={(
																	event,
																) =>
																	setDraft(
																		(
																			prev,
																		) =>
																			prev
																				? {
																						...prev,
																						topic: event
																							.target
																							.value,
																					}
																				: prev,
																	)
																}
															/>
															<div className="flex items-center justify-between gap-3 rounded-[12px] border border-border bg-muted/20 px-3 py-2.5">
																<div className="min-w-0">
																	<Label htmlFor="passage-set-free-explanation">
																		{
																			copy
																				.admin
																				.exams
																				.freeExplanation
																				.label
																		}
																	</Label>
																	<p className="mt-0.5 text-xs text-muted-foreground">
																		{
																			copy
																				.admin
																				.exams
																				.freeExplanation
																				.hint
																		}
																	</p>
																</div>
																<Switch
																	id="passage-set-free-explanation"
																	checked={
																		draft.freeExplanation
																	}
																	onCheckedChange={(
																		checked,
																	) =>
																		setDraft(
																			(
																				prev,
																			) =>
																				prev
																					? {
																							...prev,
																							freeExplanation:
																								checked,
																						}
																					: prev,
																		)
																	}
																/>
															</div>
														</div>
													) : null}

													<div className="space-y-2">
														<Label>
															{
																copy.admin.cms
																	.passagePreviewLabel
															}
														</Label>
														<PassageRenderer
															content={
																passage.content
															}
														/>
													</div>

													<div className="grid gap-2">
														<Label
															htmlFor={`passage-content-${passage.id}`}
														>
															{
																copy.admin.cms
																	.passageContentLabel
															}
														</Label>
														<textarea
															id={`passage-content-${passage.id}`}
															value={
																passage.content
															}
															rows={12}
															className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
															onChange={(
																event: React.ChangeEvent<HTMLTextAreaElement>,
															) =>
																patchPassage(
																	index,
																	{
																		content:
																			event
																				.target
																				.value,
																	},
																)
															}
														/>
													</div>

													{isPart7 ? (
														<div className="space-y-3 rounded-[12px] border border-border bg-muted/20 p-4">
															<div className="space-y-1">
																<Label
																	htmlFor={`passage-translation-html-${passage.id}`}
																>
																	{
																		copy
																			.admin
																			.cms
																			.passageTranslationHtmlTitle
																	}
																</Label>
																<p className="text-xs text-muted-foreground">
																	{
																		copy
																			.admin
																			.cms
																			.part7PassageTranslationHtmlHint
																	}
																</p>
															</div>
															{passage.translationHtml?.trim() ? (
																<div className="space-y-2">
																	<Label>
																		{
																			copy
																				.admin
																				.cms
																				.passageTranslationHtmlPreviewLabel
																		}
																	</Label>
																	<PassageRenderer
																		content={
																			passage.translationHtml
																		}
																	/>
																</div>
															) : null}
															<textarea
																id={`passage-translation-html-${passage.id}`}
																value={
																	passage.translationHtml ??
																	""
																}
																rows={8}
																placeholder={
																	copy.admin
																		.cms
																		.passageTranslationHtmlPlaceholder
																}
																className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
																onChange={(
																	event: React.ChangeEvent<HTMLTextAreaElement>,
																) =>
																	patchPassage(
																		index,
																		{
																			translationHtml:
																				event
																					.target
																					.value,
																		},
																	)
																}
															/>
														</div>
													) : index === 0 ? (
														<div className="space-y-3 rounded-[12px] border border-border bg-muted/20 p-4">
															<div className="space-y-1">
																<Label htmlFor="passage-set-translation-html">
																	{
																		copy
																			.admin
																			.cms
																			.passageTranslationHtmlTitle
																	}
																</Label>
															</div>
															{draft.translationHtml.trim() ? (
																<div className="space-y-2">
																	<Label>
																		{
																			copy
																				.admin
																				.cms
																				.passageTranslationHtmlPreviewLabel
																		}
																	</Label>
																	<PassageRenderer
																		content={
																			draft.translationHtml
																		}
																	/>
																</div>
															) : null}
															<textarea
																id="passage-set-translation-html"
																value={
																	draft.translationHtml
																}
																rows={8}
																placeholder={
																	copy.admin
																		.cms
																		.passageTranslationHtmlPlaceholder
																}
																className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
																onChange={(
																	event: React.ChangeEvent<HTMLTextAreaElement>,
																) =>
																	setDraft(
																		(
																			prev,
																		) =>
																			prev
																				? {
																						...prev,
																						translationHtml:
																							event
																								.target
																								.value,
																					}
																				: prev,
																	)
																}
															/>
														</div>
													) : null}

													<AdminPassageTranslationsEditor
														partNum={partNum}
														translations={
															perPassageTranslations[
																index
															] ?? []
														}
														passageNumber={
															draft.passages
																.length > 1
																? index + 1
																: undefined
														}
														onChange={(
															translations,
														) =>
															setDraft((prev) =>
																prev
																	? isPart7
																		? {
																				...prev,
																				passages:
																					prev.passages.map(
																						(
																							passage,
																							i,
																						) =>
																							i ===
																							index
																								? {
																										...passage,
																										translations,
																									}
																								: passage,
																					),
																			}
																		: {
																				...prev,
																				translations:
																					mergePassageTranslationSlice(
																						prev.passages,
																						prev.translations,
																						index,
																						translations,
																					),
																			}
																	: prev,
															)
														}
													/>
												</div>
											),
										)}
									</div>
									<ContentVocabularyList
										words={passageSet.vocabulary}
										className="mt-2 border-t border-border pt-4"
									/>
								</div>

								<div className="min-h-0 overflow-y-auto px-6 py-5">
									<div className="space-y-3">
										{sortedQuestions.length === 0 ? (
											<p className="py-6 text-sm text-muted-foreground">
												{
													copy.admin.cms
														.noPassageQuestions
												}
											</p>
										) : (
											<div className="divide-y divide-border">
												{sortedQuestions.map(
													(question) => (
														<div
															key={question.id}
															className="py-4 first:pt-0 last:pb-0"
														>
															<div className="flex items-start gap-3">
																<span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-xs font-semibold">
																	{
																		question.globalItemNumber
																	}
																</span>
																<div className="min-w-0 flex-1 space-y-3">
																	<div className="flex items-start justify-between gap-2">
																		<p className="text-sm font-medium leading-snug">
																			{question.prompt.trim() ||
																				copy
																					.admin
																					.cms
																					.emptyAnswer}
																		</p>
																		<Button
																			type="button"
																			variant="ghost"
																			size="icon"
																			className="size-8 shrink-0 text-muted-foreground"
																			aria-label={
																				copy
																					.admin
																					.cms
																					.editQuestion
																			}
																			onClick={() =>
																				setSelectedQuestionId(
																					question.id,
																				)
																			}
																		>
																			<Pencil className="size-4" />
																		</Button>
																	</div>
																	<div className="grid gap-1.5 text-sm text-muted-foreground">
																		{optionLabels.map(
																			(
																				label,
																			) => {
																				const text =
																					optionPreview(
																						question,
																						label,
																					);
																				const isCorrect =
																					correctLabelForQuestion(
																						question,
																					) ===
																					label;
																				return (
																					<p
																						key={
																							label
																						}
																						className={cn(
																							"truncate",
																							isCorrect &&
																								"font-medium text-foreground",
																						)}
																					>
																						<span className="mr-1.5 font-semibold">
																							{
																								label
																							}

																							.
																						</span>
																						{text.trim() ||
																							"—"}
																					</p>
																				);
																			},
																		)}
																	</div>
																</div>
															</div>
														</div>
													),
												)}
											</div>
										)}
									</div>
								</div>
							</div>

							<DialogFooter className="shrink-0 border-t border-border px-6 py-4">
								<Button
									type="button"
									variant="outline"
									disabled={isPending}
									onClick={() => onOpenChange(false)}
								>
									{copy.admin.cms.cancel}
								</Button>
								<Button
									type="button"
									disabled={isPending}
									onClick={() =>
										onSavePassageSet(passageSet.id, draft)
									}
								>
									{copy.admin.cms.saveChanges}
								</Button>
							</DialogFooter>
						</>
					)}
				</DialogContent>
			</Dialog>

			<AdminQuestionDetailDialog
				open={selectedQuestionId !== null}
				onOpenChange={(nextOpen) => {
					if (!nextOpen) setSelectedQuestionId(null);
				}}
				question={selectedQuestion}
				partNum={partNum}
				optionLabels={optionLabels}
				showReadingMetadata
				showTranslations={false}
				promptLabel={copy.admin.cms.colQuestion}
				isPending={isPending}
				onSave={(questionId, questionDraft) => {
					onSaveQuestion(questionId, questionDraft);
					setSelectedQuestionId(null);
				}}
			/>
		</>
	);
}
