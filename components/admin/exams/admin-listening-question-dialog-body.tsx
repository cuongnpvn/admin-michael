"use client";

import { AdminListeningAudioField } from "@/components/admin/exams/admin-listening-audio-field";
import { AdminListeningGroupTurnAlignment } from "@/components/admin/exams/admin-listening-group-turn-alignment";
import { AdminListeningImageField } from "@/components/admin/exams/admin-listening-image-field";
import { AdminListeningPart1DialogBody } from "@/components/admin/exams/admin-listening-part1-dialog-body";
import { AdminListeningPart12TagsField } from "@/components/admin/exams/admin-listening-part12-tags-field";
import { AdminPassageTranslationsEditor } from "@/components/admin/exams/admin-passage-translations-editor";
import { AdminQuestionExplanationFields } from "@/components/admin/exams/admin-question-explanation-fields";
import type { QuestionDraft } from "@/components/admin/exams/admin-question-detail-dialog";
import { Label } from "@/components/ui/label";
import { isEntranceTestBook } from "@/lib/content/catalog-ids";
import { copy } from "@/lib/copy/vi";
import type { TranscriptSegment } from "@/lib/listening/transcript-segments";
import type { OptionLabelDb } from "@/types/content-db";
import { cn } from "@/lib/utils";

interface AdminListeningQuestionDialogBodyProps {
	draft: QuestionDraft;
	questionId: string;
	bookId: string;
	testId: string;
	partNum: number;
	optionLabels: OptionLabelDb[];
	imageStoragePath?: string | null;
	transcriptSegments?: TranscriptSegment[];
	spokenLineCount?: number;
	hasAudio?: boolean;
	disabled?: boolean;
	onPatchDraft: (patch: Partial<QuestionDraft>) => void;
	onPatchOption: (label: OptionLabelDb, patch: { text?: string }) => void;
}

function listeningGroupImagePart(partNum: number): 3 | 4 | null {
	if (partNum === 3 || partNum === 4) return partNum;
	return null;
}

function OptionCard({
	label,
	option,
	isCorrect,
	onSelectCorrect,
	onPatchOption,
}: {
	label: OptionLabelDb;
	option: QuestionDraft["options"][OptionLabelDb];
	isCorrect: boolean;
	onSelectCorrect: () => void;
	onPatchOption: (patch: { text?: string }) => void;
}) {
	return (
		<div
			className={cn(
				"flex items-start gap-2 rounded-[12px] border p-2 transition-calm",
				isCorrect
					? "border-primary/40 bg-primary/5"
					: "border-border bg-muted/20",
			)}
		>
			<div className="flex w-10 shrink-0 flex-col items-center gap-1 pt-1">
				<button
					type="button"
					onClick={onSelectCorrect}
					className={cn(
						"flex size-7 items-center justify-center rounded-full border text-xs font-semibold transition-calm",
						isCorrect
							? "border-primary bg-primary text-primary-foreground"
							: "border-border bg-surface text-muted-foreground hover:border-primary/40",
					)}
				>
					{label}
				</button>
				{isCorrect && (
					<span className="text-[10px] font-medium leading-none text-primary">
						{copy.admin.cms.colCorrect}
					</span>
				)}
			</div>

			<div className="min-w-0 flex-1">
				<textarea
					value={option?.text ?? ""}
					rows={2}
					placeholder={copy.admin.cms.emptyAnswer}
					onChange={(event) =>
						onPatchOption({ text: event.target.value })
					}
					className="min-h-[52px] w-full resize-y rounded-[10px] border border-border bg-surface px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				/>
			</div>
		</div>
	);
}

export function AdminListeningQuestionDialogBody({
	draft,
	questionId,
	bookId,
	testId,
	partNum,
	optionLabels,
	imageStoragePath,
	transcriptSegments = [],
	spokenLineCount = 0,
	hasAudio = false,
	disabled,
	onPatchDraft,
	onPatchOption,
}: AdminListeningQuestionDialogBodyProps) {
	if (partNum === 1) {
		return (
			<AdminListeningPart1DialogBody
				draft={draft}
				questionId={questionId}
				bookId={bookId}
				testId={testId}
				optionLabels={optionLabels}
				imageStoragePath={imageStoragePath}
				transcriptSegments={transcriptSegments}
				spokenLineCount={spokenLineCount}
				hasAudio={hasAudio}
				disabled={disabled}
				onPatchDraft={onPatchDraft}
				onPatchOption={onPatchOption}
			/>
		);
	}

	const groupImagePart = listeningGroupImagePart(partNum);
	const showGroupImage =
		isEntranceTestBook(bookId) &&
		groupImagePart !== null &&
		Boolean(imageStoragePath);

	return (
		<div className="space-y-6">
			{showGroupImage && groupImagePart ? (
				<AdminListeningImageField
					bookId={bookId}
					testId={testId}
					part={groupImagePart}
					questionId={questionId}
					groupStartGlobalItemNumber={draft.globalItemNumber}
					disabled={disabled}
				/>
			) : null}
			{partNum === 2 ? (
				<>
					<AdminListeningAudioField
						bookId={bookId}
						testId={testId}
						part={2}
						questionId={questionId}
						globalItemNumber={draft.globalItemNumber}
						disabled={disabled}
					/>
					<AdminListeningGroupTurnAlignment
						bookId={bookId}
						testId={testId}
						questionId={questionId}
						hasAudio={hasAudio}
						turnCount={spokenLineCount}
						initialSegments={transcriptSegments}
						disabled={disabled}
						emptyLabel={copy.admin.cms.turnAlignment.emptyQuestion}
					/>
				</>
			) : null}
			<div className="grid gap-6">
				<div className="space-y-4">
					<div className="grid gap-2">
						<Label htmlFor="question-prompt">
							{copy.admin.cms.colQuestion}
						</Label>
						<textarea
							id="question-prompt"
							value={draft.prompt}
							rows={3}
							onChange={(event) =>
								onPatchDraft({
									prompt: event.target.value,
								})
							}
							className="min-h-[80px] w-full resize-y rounded-[10px] border border-border bg-surface px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						/>
					</div>

					<div className="space-y-2">
						<Label>{copy.admin.cms.colCorrect}</Label>
						<div className="flex flex-col gap-2">
							{optionLabels.map((label) => {
								const draftOption = draft.options[label];

								return (
									<OptionCard
										key={label}
										label={label}
										option={draftOption}
										isCorrect={draft.correctLabel === label}
										onSelectCorrect={() =>
											onPatchDraft({
												correctLabel: label,
											})
										}
										onPatchOption={(patch) =>
											onPatchOption(label, patch)
										}
									/>
								);
							})}
						</div>
					</div>
				</div>
			</div>

			<AdminListeningPart12TagsField
				part={2}
				tags={draft.tags}
				onChange={(tags) => onPatchDraft({ tags })}
			/>

			<AdminPassageTranslationsEditor
				translations={draft.translations}
				onChange={(translations) => onPatchDraft({ translations })}
			/>

			<div className="space-y-4 rounded-[14px] border border-border bg-muted/10 p-4">
				<div className="grid gap-2">
					<Label htmlFor="listening-question-hint">
						{copy.admin.cms.colTutorHint}
					</Label>
					<textarea
						id="listening-question-hint"
						value={draft.hint}
						rows={2}
						placeholder={copy.admin.cms.tutorHintPlaceholderListening}
						onChange={(event) =>
							onPatchDraft({ hint: event.target.value })
						}
						className="min-h-[56px] w-full resize-y rounded-[10px] border border-border bg-surface px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					/>
				</div>

				<AdminQuestionExplanationFields
					reasoningId="listening-question-explanation-reasoning"
					reasoning={draft.explanationReasoning}
					references={draft.explanationReferences}
					reasoningPlaceholder={
						copy.admin.cms
							.explanationReasoningPlaceholderListeningPart2
					}
					onReasoningChange={(value) =>
						onPatchDraft({ explanationReasoning: value })
					}
					onReferencesChange={(value) =>
						onPatchDraft({ explanationReferences: value })
					}
				/>
			</div>
		</div>
	);
}
