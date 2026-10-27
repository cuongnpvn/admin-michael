"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import { AdminListeningAudioField } from "@/components/admin/exams/admin-listening-audio-field";
import { AdminListeningGroupTurnAlignment } from "@/components/admin/exams/admin-listening-group-turn-alignment";
import { AdminPassageTranslationsEditor } from "@/components/admin/exams/admin-passage-translations-editor";
import type { TranslationDraft } from "@/components/admin/exams/admin-question-detail-dialog";
import { ContentVocabularyList } from "@/components/study/content-vocabulary-list";
import { copy } from "@/lib/copy/vi";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
	AdminQuestionDetailDialog,
	buildQuestionDraft,
	type QuestionDraft,
} from "@/components/admin/exams/admin-question-detail-dialog";
import type { AdminPartQuestionRow } from "@/types/admin-part-editor";
import type { OptionLabelDb } from "@/types/content-db";
import { resolveSpeechSentences } from "@/lib/listening/speech-sentences";
import { resolveSpeakerTurns } from "@/lib/listening/speaker-turns";
import { cn } from "@/lib/utils";

export type GroupQuestionDraft = {
	questionId: string;
	globalItemNumber: number;
	prompt: string;
	correctLabel: OptionLabelDb | "";
	options: QuestionDraft["options"];
	hint: string;
	explanationReasoning: string;
	explanationReferences: string[];
	tags: string[];
};

export type ListeningGroupDraft = {
	topic: string;
	freeExplanation: boolean;
	transcriptText: string;
	translations: TranslationDraft[];
	questions: GroupQuestionDraft[];
};

function questionToGroupDraft(
	question: AdminPartQuestionRow,
	labels: OptionLabelDb[],
	partNum: number,
): GroupQuestionDraft {
	const base = buildQuestionDraft(question, labels, partNum);
	return {
		questionId: question.id,
		globalItemNumber: question.globalItemNumber,
		prompt: base.prompt,
		correctLabel: base.correctLabel,
		options: base.options,
		hint: base.hint,
		explanationReasoning: base.explanationReasoning,
		explanationReferences: base.explanationReferences,
		tags: base.tags,
	};
}

export function buildListeningGroupDraft(
	questions: AdminPartQuestionRow[],
	optionLabels: OptionLabelDb[],
	partNum: number,
): ListeningGroupDraft {
	const sorted = [...questions].sort(
		(a, b) => a.globalItemNumber - b.globalItemNumber,
	);
	const first = sorted[0];
	return {
		topic: first?.groupTopic ?? "",
		freeExplanation: Boolean(first?.groupFreeExplanation),
		transcriptText: first?.groupTranscript ?? "",
		translations: (first?.translations ?? []).map((entry) => ({
			english: entry.english,
			vietnamese: entry.vietnamese,
		})),
		questions: sorted.map((q) =>
			questionToGroupDraft(q, optionLabels, partNum),
		),
	};
}

function optionPreviewText(
	draft: GroupQuestionDraft,
	label: OptionLabelDb,
): string {
	return draft.options[label]?.text ?? "";
}

function GroupQuestionPreview({
	draft,
	optionLabels,
	onOpenDetail,
}: {
	draft: GroupQuestionDraft;
	optionLabels: OptionLabelDb[];
	onOpenDetail: () => void;
}) {
	return (
		<div className="my-4 py-4 first:pt-0 last:pb-0">
			<div className="flex items-start gap-3">
				<span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-xs font-semibold">
					{draft.globalItemNumber}
				</span>
				<div className="min-w-0 flex-1">
					<div className="flex items-start justify-between gap-2">
						<p className="text-sm font-medium leading-snug">
							{draft.prompt.trim() || copy.admin.cms.emptyAnswer}
						</p>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="size-8 shrink-0 text-muted-foreground"
							aria-label={copy.admin.cms.editQuestion}
							onClick={onOpenDetail}
						>
							<Pencil className="size-4" />
						</Button>
					</div>
					<div className="grid gap-1.5 text-sm text-muted-foreground">
						{optionLabels.map((label) => {
							const text = optionPreviewText(draft, label);
							const isCorrect = draft.correctLabel === label;

							return (
								<p
									key={label}
									className={cn(
										"truncate",
										isCorrect &&
											"font-medium text-foreground",
									)}
								>
									<span className="mr-1.5 font-semibold">
										{label}.
									</span>
									{text.trim() || copy.admin.cms.emptyAnswer}
								</p>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
}

interface AdminListeningGroupDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	bookId: string;
	testId: string;
	groupId: string | null;
	questions: AdminPartQuestionRow[];
	partNum: number;
	optionLabels: OptionLabelDb[];
	isPending: boolean;
	onSave: (groupId: string, draft: ListeningGroupDraft) => void;
	onSaveQuestion: (questionId: string, draft: QuestionDraft) => void;
}

export function AdminListeningGroupDialog({
	open,
	onOpenChange,
	bookId,
	testId,
	groupId,
	questions,
	partNum,
	optionLabels,
	isPending,
	onSave,
	onSaveQuestion,
}: AdminListeningGroupDialogProps) {
	const [draft, setDraft] = useState<ListeningGroupDraft | null>(null);
	const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
		null,
	);

	const questionById = useMemo(
		() => new Map(questions.map((question) => [question.id, question])),
		[questions],
	);

	const selectedQuestion = selectedQuestionId
		? (questionById.get(selectedQuestionId) ?? null)
		: null;

	useEffect(() => {
		if (!open || questions.length === 0) {
			setDraft(null);
			setSelectedQuestionId(null);
			return;
		}
		setDraft(buildListeningGroupDraft(questions, optionLabels, partNum));
	}, [open, questions, optionLabels, partNum]);

	function patchQuestion(
		questionId: string,
		patch: Partial<GroupQuestionDraft>,
	) {
		setDraft((prev) => {
			if (!prev) return prev;
			return {
				...prev,
				questions: prev.questions.map((q) =>
					q.questionId === questionId ? { ...q, ...patch } : q,
				),
			};
		});
	}

	function syncQuestionDraft(
		questionId: string,
		questionDraft: QuestionDraft,
	) {
		patchQuestion(questionId, {
			prompt: questionDraft.prompt,
			correctLabel: questionDraft.correctLabel,
			options: questionDraft.options,
			hint: questionDraft.hint,
			explanationReasoning: questionDraft.explanationReasoning,
			explanationReferences: questionDraft.explanationReferences,
			tags: questionDraft.tags,
		});
	}

	const rangeLabel =
		draft && draft.questions.length > 0
			? draft.questions.length === 1
				? copy.admin.cms.questionDetailTitle(
						draft.questions[0].globalItemNumber,
					)
				: copy.admin.cms.groupDetailTitle(
						draft.questions[0].globalItemNumber,
						draft.questions[draft.questions.length - 1]
							.globalItemNumber,
					)
			: copy.admin.cms.colTranscript;

	const groupTopic = draft?.topic.trim() || null;
	const groupVocabulary = questions[0]?.groupVocabulary ?? [];

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
					{groupId && draft && (
						<>
							<DialogHeader>
								<DialogTitle>{rangeLabel}</DialogTitle>
							</DialogHeader>

							<div className="grid gap-6 py-1 lg:grid-cols-2">
								<div className="space-y-4 rounded-[14px] border border-border bg-muted/10 p-4">
									{partNum === 3 || partNum === 4 ? (
										<AdminListeningAudioField
											bookId={bookId}
											testId={testId}
											part={partNum}
											groupId={groupId}
											groupGlobalNumbers={draft.questions.map(
												(question) =>
													question.globalItemNumber,
											)}
											disabled={isPending}
										/>
									) : null}
									<div className="grid gap-2">
										<Label htmlFor="listening-group-topic">
											{
												copy.admin.cms
													.passageSetTopicLabel
											}
										</Label>
										<Input
											id="listening-group-topic"
											value={draft.topic}
											placeholder={
												copy.admin.cms
													.passageSetTopicPlaceholder
											}
											onChange={(event) =>
												setDraft((prev) =>
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
									</div>
									<div className="flex items-center justify-between gap-3 rounded-[12px] border border-border bg-background/60 px-3 py-2.5">
										<div className="min-w-0">
											<Label htmlFor="listening-group-free-explanation">
												{
													copy.admin.exams
														.freeExplanation.label
												}
											</Label>
											<p className="mt-0.5 text-xs text-muted-foreground">
												{
													copy.admin.exams
														.freeExplanation.hint
												}
											</p>
										</div>
										<Switch
											id="listening-group-free-explanation"
											checked={draft.freeExplanation}
											onCheckedChange={(checked) =>
												setDraft((prev) =>
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
									<p className="text-sm font-medium">
										{copy.admin.cms.colTranscript}
									</p>
									<textarea
										value={draft.transcriptText}
										rows={14}
										onChange={(event) =>
											setDraft((prev) =>
												prev
													? {
															...prev,
															transcriptText:
																event.target
																	.value,
														}
													: prev,
											)
										}
										className="min-h-[280px] w-full resize-y rounded-[10px] border border-border bg-surface px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
									/>

									{(partNum === 3 || partNum === 4) &&
									groupId ? (
										<AdminListeningGroupTurnAlignment
											key={groupId}
											bookId={bookId}
											testId={testId}
											groupId={groupId}
											hasAudio={questions.length > 0}
											turnCount={
												partNum === 4
													? resolveSpeechSentences(
															questions[0]
																?.groupTranscript ??
																"",
														).length
													: resolveSpeakerTurns(
															questions[0]
																?.groupTranscript ??
																"",
														).length
											}
											initialSegments={
												questions[0]
													?.groupTranscriptSegments ??
												[]
											}
											disabled={isPending}
										/>
									) : null}

									<AdminPassageTranslationsEditor
										translations={draft.translations}
										onChange={(translations) =>
											setDraft((prev) =>
												prev
													? { ...prev, translations }
													: prev,
											)
										}
									/>

									<ContentVocabularyList
										words={groupVocabulary}
										className="border-t border-border pt-4"
									/>
								</div>

								<div className="max-h-[min(70vh,640px)] overflow-y-auto rounded-[14px] border border-border bg-muted/10 px-4 pr-1">
									<div className="divide-y divide-border">
										{draft.questions.map(
											(questionDraft) => (
												<GroupQuestionPreview
													key={
														questionDraft.questionId
													}
													draft={questionDraft}
													optionLabels={optionLabels}
													onOpenDetail={() =>
														setSelectedQuestionId(
															questionDraft.questionId,
														)
													}
												/>
											),
										)}
									</div>
								</div>
							</div>

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
									onClick={() => onSave(groupId, draft)}
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
				bookId={bookId}
				testId={testId}
				partNum={partNum}
				optionLabels={optionLabels}
				showReadingMetadata
				showTranslations={false}
				promptLabel={copy.admin.cms.colQuestion}
				contextTopic={groupTopic}
				isPending={isPending}
				onSave={(questionId, questionDraft) => {
					syncQuestionDraft(questionId, questionDraft);
					onSaveQuestion(questionId, questionDraft);
					setSelectedQuestionId(null);
				}}
			/>
		</>
	);
}
