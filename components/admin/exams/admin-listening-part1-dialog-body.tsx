"use client";

import { AdminListeningAudioField } from "@/components/admin/exams/admin-listening-audio-field";
import { AdminListeningImageField } from "@/components/admin/exams/admin-listening-image-field";
import { AdminListeningPart12TagsField } from "@/components/admin/exams/admin-listening-part12-tags-field";
import type { QuestionDraft } from "@/components/admin/exams/admin-question-detail-dialog";
import { Label } from "@/components/ui/label";
import {
	buildPublicAssetUrlForBucket,
	IMAGES_BUCKET,
} from "@/lib/content/media-storage-paths";
import { isEntranceTestBook } from "@/lib/content/catalog-ids";
import { copy } from "@/lib/copy/vi";
import {
	parseListeningPart1OptionTranslationDraft,
	serializeListeningPart1OptionTranslationLines,
	type ListeningPart1ExplanationLine,
} from "@/lib/listening/part1-explanation-format";
import type { OptionLabelDb } from "@/types/content-db";
import { cn } from "@/lib/utils";

const PART1_OPTION_LABELS = ["A", "B", "C", "D"] as const;

type Part1Label = (typeof PART1_OPTION_LABELS)[number];

interface AdminListeningPart1DialogBodyProps {
	draft: QuestionDraft;
	questionId: string;
	bookId: string;
	testId: string;
	optionLabels: OptionLabelDb[];
	imageStoragePath?: string | null;
	disabled?: boolean;
	onPatchDraft: (patch: Partial<QuestionDraft>) => void;
	onPatchOption: (label: OptionLabelDb, patch: { text?: string }) => void;
}

function isPart1Label(label: OptionLabelDb): label is Part1Label {
	return PART1_OPTION_LABELS.includes(label as Part1Label);
}

function buildTranslationLines(
	draft: QuestionDraft,
	translationByLabel: Map<Part1Label, string>,
	override?: { label: OptionLabelDb; text?: string; vietnamese?: string },
): Array<{
	label: ListeningPart1ExplanationLine["label"];
	english: string;
	vietnamese: string;
}> {
	return PART1_OPTION_LABELS.map((optionLabel) => {
		const english =
			override?.label === optionLabel && override.text !== undefined
				? override.text
				: (draft.options[optionLabel]?.text ?? "");
		const vietnamese =
			override?.label === optionLabel && override.vietnamese !== undefined
				? override.vietnamese
				: (translationByLabel.get(optionLabel) ?? "");

		return { label: optionLabel, english, vietnamese };
	});
}

function Part1OptionCard({
	label,
	option,
	isCorrect,
	vietnamese,
	onSelectCorrect,
	onTextChange,
	onVietnameseChange,
}: {
	label: OptionLabelDb;
	option: QuestionDraft["options"][OptionLabelDb];
	isCorrect: boolean;
	vietnamese: string;
	onSelectCorrect: () => void;
	onTextChange: (value: string) => void;
	onVietnameseChange: (value: string) => void;
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

			<div className="min-w-0 flex-1 space-y-2">
				<textarea
					value={option?.text ?? ""}
					rows={2}
					placeholder={copy.admin.cms.emptyAnswer}
					onChange={(event) => onTextChange(event.target.value)}
					className="min-h-[52px] w-full resize-y rounded-[10px] border border-border bg-surface px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				/>
				<textarea
					value={vietnamese}
					rows={2}
					placeholder={
						copy.admin.cms.part1OptionTranslationPlaceholder
					}
					onChange={(event) => onVietnameseChange(event.target.value)}
					className="min-h-[48px] w-full resize-y rounded-[10px] border border-border bg-surface px-3 py-2 text-sm text-muted-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				/>
			</div>
		</div>
	);
}

export function AdminListeningPart1DialogBody({
	draft,
	questionId,
	bookId,
	testId,
	optionLabels,
	imageStoragePath,
	disabled,
	onPatchDraft,
	onPatchOption,
}: AdminListeningPart1DialogBodyProps) {
	const imageUrl = imageStoragePath
		? buildPublicAssetUrlForBucket(IMAGES_BUCKET, imageStoragePath)
		: null;

	const translationByLabel = new Map(
		parseListeningPart1OptionTranslationDraft(
			draft.explanationReasoning,
		).map((line) => [line.label, line.vietnamese] as const),
	);

	const reference = draft.explanationReferences[0] ?? "";

	function syncExplanation(override?: {
		label: OptionLabelDb;
		text?: string;
		vietnamese?: string;
	}) {
		onPatchDraft({
			explanationReasoning: serializeListeningPart1OptionTranslationLines(
				buildTranslationLines(draft, translationByLabel, override),
			),
		});
	}

	return (
		<div className="grid gap-6 py-1 lg:grid-cols-2">
			<div className="space-y-4">
				<div className="space-y-2">
					{isEntranceTestBook(bookId) ? (
						<AdminListeningImageField
							bookId={bookId}
							testId={testId}
							part={1}
							questionId={questionId}
							globalItemNumber={draft.globalItemNumber}
							disabled={disabled}
						/>
					) : imageUrl ? (
						<div className="overflow-hidden rounded-[14px] border border-border bg-muted/20">
							<img
								src={imageUrl}
								alt={copy.admin.cms.part1ImageLabel}
								className="max-h-[min(52vh,420px)] w-full object-contain"
							/>
						</div>
					) : (
						<p className="rounded-[14px] border border-dashed border-border px-3 py-10 text-center text-sm text-muted-foreground">
							{copy.admin.cms.part1ImageMissing}
						</p>
					)}
				</div>

				<AdminListeningAudioField
					bookId={bookId}
					testId={testId}
					part={1}
					questionId={questionId}
					globalItemNumber={draft.globalItemNumber}
					disabled={disabled}
				/>

				<AdminListeningPart12TagsField
					part={1}
					tags={draft.tags}
					onChange={(tags) => onPatchDraft({ tags })}
				/>

				<div className="grid gap-2 rounded-[14px] border border-border bg-muted/10 p-4">
					<Label htmlFor="listening-question-hint">
						{copy.admin.cms.colTutorHint}
					</Label>
					<textarea
						id="listening-question-hint"
						value={draft.hint}
						rows={3}
						placeholder={
							copy.admin.cms.tutorHintPlaceholderListening
						}
						onChange={(event) =>
							onPatchDraft({ hint: event.target.value })
						}
						className="min-h-[72px] w-full resize-y rounded-[10px] border border-border bg-surface px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					/>
				</div>
			</div>

			<div className="max-h-[min(70vh,720px)] space-y-4 overflow-y-auto lg:sticky lg:top-0 lg:self-start">
				<div className="flex flex-col gap-2">
					{optionLabels.map((label) => (
						<Part1OptionCard
							key={label}
							label={label}
							option={draft.options[label]}
							isCorrect={draft.correctLabel === label}
							vietnamese={
								isPart1Label(label)
									? (translationByLabel.get(label) ?? "")
									: ""
							}
							onSelectCorrect={() =>
								onPatchDraft({ correctLabel: label })
							}
							onTextChange={(text) => {
								onPatchOption(label, { text });
								syncExplanation({ label, text });
							}}
							onVietnameseChange={(vietnamese) =>
								syncExplanation({ label, vietnamese })
							}
						/>
					))}
				</div>

				<div className="grid gap-2">
					<Label htmlFor="listening-part1-reference">
						{copy.admin.cms.colExplanationReference}
					</Label>
					<textarea
						id="listening-part1-reference"
						value={reference}
						rows={2}
						placeholder={
							copy.admin.cms.part1OptionReferencePlaceholder
						}
						onChange={(event) => {
							const value = event.target.value;
							onPatchDraft({
								explanationReferences: value.trim()
									? [value]
									: [],
							});
						}}
						className="min-h-[56px] w-full resize-y rounded-[10px] border border-border bg-surface px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					/>
				</div>
			</div>
		</div>
	);
}
