"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { copy } from "@/lib/copy/vi";
import { AdminQuestionTagsField } from "@/components/admin/exams/admin-question-tags-field";
import { isEntranceTestBook } from "@/lib/content/catalog-ids";
import { questionDraftTags } from "@/lib/content/question-draft-tags";
import { validateQuestionTags } from "@/lib/content/toeic-tags";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AdminListeningImageField } from "@/components/admin/exams/admin-listening-image-field";
import { AdminListeningQuestionDialogBody } from "@/components/admin/exams/admin-listening-question-dialog-body";
import { AdminQuestionExplanationFields } from "@/components/admin/exams/admin-question-explanation-fields";
import { explanationToDraftFields } from "@/lib/content/question-explanation";
import type { AdminPartQuestionRow } from "@/types/admin-part-editor";
import type { OptionLabelDb } from "@/types/content-db";
import { cn } from "@/lib/utils";

type OptionDraft = {
	id: string;
	text: string;
};

export type TranslationDraft = {
	english: string;
	vietnamese: string;
};

export type QuestionDraft = {
	globalItemNumber: number;
	prompt: string;
	transcriptText: string;
	options: Partial<Record<OptionLabelDb, OptionDraft>>;
	correctLabel: OptionLabelDb | "";
	hint: string;
	explanationReasoning: string;
	explanationReferences: string[];
	freeExplanation: boolean;
	tags: string[];
	translations: TranslationDraft[];
};

interface AdminQuestionDetailDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	question: AdminPartQuestionRow | null;
	bookId?: string;
	testId?: string;
	partNum: number;
	optionLabels: OptionLabelDb[];
	showReadingMetadata: boolean;
	showTranslations: boolean;
	promptLabel: string;
	contextTopic?: string | null;
	isPending: boolean;
	onSave: (questionId: string, draft: QuestionDraft) => void;
}

function listeningGroupImagePart(partNum: number): 3 | 4 | null {
	if (partNum === 3 || partNum === 4) return partNum;
	return null;
}

function correctLabelForQuestion(
	question: AdminPartQuestionRow,
): OptionLabelDb | "" {
	const correct = question.options.find(
		(o) => o.id === question.correctOptionId,
	);
	return correct?.label ?? "";
}

function optionByLabel(
	question: AdminPartQuestionRow,
	label: OptionLabelDb,
): OptionDraft | undefined {
	const option = question.options.find((entry) => entry.label === label);
	if (!option) return undefined;
	return {
		id: option.id,
		text: option.text,
	};
}

export function buildQuestionDraft(
	question: AdminPartQuestionRow,
	labels: OptionLabelDb[],
	partNum: number,
): QuestionDraft {
	const options: Partial<Record<OptionLabelDb, OptionDraft>> = {};
	for (const label of labels) {
		const option = optionByLabel(question, label);
		if (option) options[label] = option;
	}

	const transcriptText =
		partNum === 2
			? (question.transcript ?? "")
			: partNum === 3 || partNum === 4
				? (question.groupTranscript ?? "")
				: "";

	const explanationFields = explanationToDraftFields(question.explanation);

	return {
		globalItemNumber: question.globalItemNumber,
		prompt:
			partNum === 1
				? ""
				: (question.prompt || question.transcript || ""),
		transcriptText,
		options,
		correctLabel: correctLabelForQuestion(question),
		hint: question.hint ?? "",
		explanationReasoning: explanationFields.reasoning,
		explanationReferences: explanationFields.references,
		freeExplanation: Boolean(question.freeExplanation),
		tags: questionDraftTags(partNum, question.tags),
		translations: question.translations.map((entry) => ({
			english: entry.english,
			vietnamese: entry.vietnamese,
		})),
	};
}

export function AdminQuestionDetailDialog({
	open,
	onOpenChange,
	question,
	bookId,
	testId,
	partNum,
	optionLabels,
	showReadingMetadata,
	showTranslations,
	promptLabel,
	contextTopic,
	isPending,
	onSave,
}: AdminQuestionDetailDialogProps) {
	const [draft, setDraft] = useState<QuestionDraft | null>(null);

	useEffect(() => {
		if (!question || !open) {
			setDraft(null);
			return;
		}
		setDraft(buildQuestionDraft(question, optionLabels, partNum));
	}, [question, open, optionLabels, partNum]);

	function patchDraft(patch: Partial<QuestionDraft>) {
		setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
	}

	function patchOption(label: OptionLabelDb, patch: Partial<OptionDraft>) {
		setDraft((prev) => {
			if (!prev) return prev;
			const option = prev.options[label];
			if (!option) return prev;
			return {
				...prev,
				options: {
					...prev.options,
					[label]: { ...option, ...patch },
				},
			};
		});
	}

	function patchTranslation(index: number, patch: Partial<TranslationDraft>) {
		setDraft((prev) => {
			if (!prev) return prev;
			const translations = prev.translations.map((row, i) =>
				i === index ? { ...row, ...patch } : row,
			);
			return { ...prev, translations };
		});
	}

	function addTranslation() {
		setDraft((prev) =>
			prev
				? {
						...prev,
						translations: [
							...prev.translations,
							{ english: "", vietnamese: "" },
						],
					}
				: prev,
		);
	}

	function removeTranslation(index: number) {
		setDraft((prev) =>
			prev
				? {
						...prev,
						translations: prev.translations.filter(
							(_, i) => i !== index,
						),
					}
				: prev,
		);
	}

	const isListeningShortAnswerPart = partNum === 1 || partNum === 2;
	const groupImagePart = listeningGroupImagePart(partNum);

	const answerOptionsPanel = !isListeningShortAnswerPart ? (
		<div className="space-y-3">
			<Label>{copy.admin.cms.colCorrect}</Label>
			<div className="space-y-3">
				{optionLabels.map((label) => {
					const option = draft?.options[label];
					const isCorrect = draft?.correctLabel === label;

					return (
						<div
							key={label}
							className={cn(
								"rounded-[12px] border p-3 transition-calm",
								isCorrect
									? "border-primary/40 bg-primary/5"
									: "border-border bg-muted/20",
							)}
						>
							<div className="mb-2 flex items-center gap-2">
								<button
									type="button"
									onClick={() =>
										patchDraft({ correctLabel: label })
									}
									className={cn(
										"flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-calm",
										isCorrect
											? "border-primary bg-primary text-primary-foreground"
											: "border-border bg-surface text-muted-foreground hover:border-primary/40",
									)}
								>
									{label}
								</button>
								{isCorrect && (
									<span className="text-xs font-medium text-primary">
										{copy.admin.cms.colCorrect}
									</span>
								)}
							</div>
							<textarea
								value={option?.text ?? ""}
								rows={2}
								placeholder={copy.admin.cms.emptyAnswer}
								onChange={(event) =>
									patchOption(label, {
										text: event.target.value,
									})
								}
								className="mb-2 min-h-[56px] w-full resize-y rounded-[10px] border border-border bg-surface px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							/>
						</div>
					);
				})}
			</div>
		</div>
	) : null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className={cn(
					"max-h-[90vh] overflow-y-auto",
					partNum === 1 ? "max-w-6xl" : "max-w-5xl",
				)}
			>
				{question && draft && (
					<>
						<DialogHeader>
							<DialogTitle>
								{copy.admin.cms.questionDetailTitle(
									draft.globalItemNumber,
								)}
							</DialogTitle>
							{contextTopic ? (
								<DialogDescription className="text-left">
									<span className="font-medium text-foreground">
										{copy.admin.cms.passageSetTopicLabel}:
									</span>{" "}
									{contextTopic}
								</DialogDescription>
							) : (
								<DialogDescription />
							)}
						</DialogHeader>

						{isListeningShortAnswerPart ? (
							<div className="py-1">
								<AdminListeningQuestionDialogBody
									draft={draft}
									questionId={question.id}
									bookId={bookId ?? ""}
									testId={testId ?? ""}
									partNum={partNum}
									optionLabels={optionLabels}
									imageStoragePath={question.imageStoragePath}
									disabled={isPending}
									onPatchDraft={patchDraft}
									onPatchOption={patchOption}
								/>
							</div>
						) : (
							<div className="grid gap-6 py-1 lg:grid-cols-2">
								<div className="space-y-5">
									{bookId &&
									testId &&
									groupImagePart &&
									question.isFirstInGroup &&
									question.imageStoragePath &&
									isEntranceTestBook(bookId) ? (
										<AdminListeningImageField
											bookId={bookId}
											testId={testId}
											part={groupImagePart}
											questionId={question.id}
											groupStartGlobalItemNumber={
												draft.globalItemNumber
											}
											disabled={isPending}
										/>
									) : null}
									<div className="grid gap-2">
										<Label htmlFor="question-prompt">
											{promptLabel}
										</Label>
										<textarea
											id="question-prompt"
											value={draft.prompt}
											rows={4}
											onChange={(event) =>
												patchDraft({
													prompt: event.target.value,
												})
											}
											className="min-h-[96px] w-full resize-y rounded-[10px] border border-border bg-surface px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
										/>
									</div>

									{showReadingMetadata && (
										<>
											<div className="grid gap-2">
												<Label htmlFor="question-hint">
													{
														copy.admin.cms
															.colTutorHint
													}
												</Label>
												<textarea
													id="question-hint"
													value={draft.hint}
													rows={3}
													placeholder={
														copy.admin.cms
															.tutorHintPlaceholder
													}
													onChange={(event) =>
														patchDraft({
															hint: event.target
																.value,
														})
													}
													className="min-h-[72px] w-full resize-y rounded-[10px] border border-border bg-surface px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
												/>
											</div>

											<AdminQuestionExplanationFields
												reasoningId="question-explanation-reasoning"
												reasoning={
													draft.explanationReasoning
												}
												references={
													draft.explanationReferences
												}
												onReasoningChange={(value) =>
													patchDraft({
														explanationReasoning:
															value,
													})
												}
												onReferencesChange={(value) =>
													patchDraft({
														explanationReferences:
															value,
													})
												}
											/>

											<div className="flex items-center justify-between gap-3 rounded-[12px] border border-border bg-muted/20 px-3 py-2.5">
												<div className="min-w-0">
													<Label htmlFor="question-free-explanation">
														{
															copy.admin.exams
																.freeExplanation
																.label
														}
													</Label>
													<p className="mt-0.5 text-xs text-muted-foreground">
														{
															copy.admin.exams
																.freeExplanation
																.hint
														}
													</p>
												</div>
												<Switch
													id="question-free-explanation"
													checked={
														draft.freeExplanation
													}
													onCheckedChange={(
														checked,
													) =>
														patchDraft({
															freeExplanation:
																checked,
														})
													}
												/>
											</div>
										</>
									)}

									{showTranslations && (
										<div className="space-y-3">
											<div className="flex items-center justify-between gap-2">
												<Label>
													{
														copy.admin.cms
															.translationsTitle
													}
												</Label>
												<Button
													type="button"
													variant="outline"
													size="sm"
													onClick={addTranslation}
												>
													<Plus className="size-4" />
													{
														copy.admin.cms
															.addTranslation
													}
												</Button>
											</div>
											{draft.translations.length === 0 ? (
												<p className="rounded-[10px] border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
													{
														copy.admin.cms
															.noTranslations
													}
												</p>
											) : (
												<div className="space-y-3">
													{draft.translations.map(
														(row, index) => (
															<div
																key={index}
																className="space-y-2 rounded-[12px] border border-border bg-muted/20 p-3"
															>
																<div className="flex items-center justify-between gap-2">
																	<span className="text-xs font-medium text-muted-foreground">
																		{copy.admin.cms.translationRow(
																			index +
																				1,
																		)}
																	</span>
																	<Button
																		type="button"
																		variant="ghost"
																		size="icon"
																		className="size-8 text-muted-foreground hover:text-destructive"
																		aria-label={
																			copy
																				.admin
																				.cms
																				.removeTranslation
																		}
																		onClick={() =>
																			removeTranslation(
																				index,
																			)
																		}
																	>
																		<Trash2 className="size-4" />
																	</Button>
																</div>
																<div className="grid gap-2">
																	<Label
																		htmlFor={`translation-en-${index}`}
																	>
																		{
																			copy
																				.admin
																				.cms
																				.translationEnglish
																		}
																	</Label>
																	<textarea
																		id={`translation-en-${index}`}
																		value={
																			row.english
																		}
																		rows={2}
																		onChange={(
																			event,
																		) =>
																			patchTranslation(
																				index,
																				{
																					english:
																						event
																							.target
																							.value,
																				},
																			)
																		}
																		className="min-h-[56px] w-full resize-y rounded-[10px] border border-border bg-surface px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
																	/>
																</div>
																<div className="grid gap-2">
																	<Label
																		htmlFor={`translation-vi-${index}`}
																	>
																		{
																			copy
																				.admin
																				.cms
																				.translationVietnamese
																		}
																	</Label>
																	<textarea
																		id={`translation-vi-${index}`}
																		value={
																			row.vietnamese
																		}
																		rows={2}
																		onChange={(
																			event,
																		) =>
																			patchTranslation(
																				index,
																				{
																					vietnamese:
																						event
																							.target
																							.value,
																				},
																			)
																		}
																		className="min-h-[56px] w-full resize-y rounded-[10px] border border-border bg-surface px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
																	/>
																</div>
															</div>
														),
													)}
												</div>
											)}
										</div>
									)}

								</div>

								<div className="max-h-[min(70vh,640px)] space-y-5 overflow-y-auto rounded-[14px] border border-border bg-muted/10 p-4 lg:sticky lg:top-0 lg:self-start">
									{showReadingMetadata && (
										<AdminQuestionTagsField
											part={partNum}
											selectedTags={draft.tags}
											onChange={(tags) =>
												patchDraft({
													tags: validateQuestionTags(
														tags,
													),
												})
											}
										/>
									)}
									{answerOptionsPanel}
								</div>
							</div>
						)}

						<DialogFooter>
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
								onClick={() => onSave(question.id, draft)}
							>
								{copy.admin.cms.saveChanges}
							</Button>
						</DialogFooter>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
