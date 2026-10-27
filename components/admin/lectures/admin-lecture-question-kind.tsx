"use client";

import type { ReactNode } from "react";
import { AdminQuestionExplanationFields } from "@/components/admin/exams/admin-question-explanation-fields";
import {
	FillFields,
	HighlightFields,
	RewriteFields,
} from "@/components/admin/lectures/admin-lecture-question-prompts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { copy } from "@/lib/copy/vi";
import type { LectureQuestionInsert } from "@/lib/lectures/options";

export function AdminLectureQuestionKind({
	question,
	index,
	onChange,
	lockKind = false,
	collapseExplanation = lockKind,
}: {
	question: LectureQuestionInsert;
	index: number;
	onChange: (patch: Partial<LectureQuestionInsert>) => void;
	lockKind?: boolean;
	collapseExplanation?: boolean;
}) {
	return (
		<div className="space-y-3">
			{lockKind ? null : <Label>{copy.admin.lectures.fields.kind}</Label>}
			{lockKind ? null : (
				<select
					className="h-9 rounded-md border bg-background px-3 text-sm"
					value={question.kind}
					onChange={(event) =>
						onChange({
							kind: event.target
								.value as LectureQuestionInsert["kind"],
						})
					}
				>
					{(
						[
							"multiple_choice",
							"highlight",
							"rewrite",
							"fill_blank",
						] as const
					).map((kind) => (
						<option key={kind} value={kind}>
							{copy.admin.lectures.fields.kinds[kind]}
						</option>
					))}
				</select>
			)}
			{question.kind === "multiple_choice" ? (
				<ChoiceFields
					question={question}
					index={index}
					onChange={onChange}
				/>
			) : null}
			{question.kind === "highlight" ? (
				<HighlightFields question={question} onChange={onChange} />
			) : null}
			{question.kind === "rewrite" ? (
				<RewriteFields question={question} onChange={onChange} />
			) : null}
			{question.kind === "fill_blank" ? (
				<FillFields question={question} onChange={onChange} />
			) : null}
			<ExplanationDetails collapsed={collapseExplanation}>
				<AdminQuestionExplanationFields
					reasoning={question.explanation.reasoning}
					references={question.explanation.reference}
					reasoningId={`lecture-explanation-${index}`}
					onReasoningChange={(reasoning) =>
						onChange({
							explanation: { ...question.explanation, reasoning },
						})
					}
					onReferencesChange={(reference) =>
						onChange({
							explanation: { ...question.explanation, reference },
						})
					}
				/>
			</ExplanationDetails>
		</div>
	);
}

function ExplanationDetails({
	collapsed,
	children,
}: {
	collapsed: boolean;
	children: ReactNode;
}) {
	if (!collapsed) return children;
	return (
		<details className="rounded-[12px] border border-border px-3 py-2">
			<summary className="cursor-pointer text-sm font-medium">
				{copy.admin.lectures.fields.explanationDetails}
			</summary>
			<div className="mt-3">{children}</div>
		</details>
	);
}

function ChoiceFields({
	question,
	index,
	onChange,
}: {
	question: LectureQuestionInsert;
	index: number;
	onChange: (patch: Partial<LectureQuestionInsert>) => void;
}) {
	return (
		<div className="space-y-2">
			<Input
				value={question.stem}
				onChange={(event) => onChange({ stem: event.target.value })}
			/>
			{question.options.map((option, optionIndex) => (
				<label
					key={option.id}
					className="flex items-center gap-2 text-sm"
				>
					<input
						type="radio"
						name={`correct-${index}`}
						checked={question.correctOptionId === option.id}
						onChange={() =>
							onChange({ correctOptionId: option.id })
						}
					/>
					<span className="w-6 font-medium">{option.label}</span>
					<Input
						value={option.text}
						onChange={(event) => {
							const options = question.options.map(
								(entry, current) =>
									current === optionIndex
										? { ...entry, text: event.target.value }
										: entry,
							);
							onChange({ options });
						}}
					/>
				</label>
			))}
		</div>
	);
}
