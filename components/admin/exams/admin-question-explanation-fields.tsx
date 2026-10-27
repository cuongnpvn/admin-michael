"use client";

import { Plus, Trash2 } from "lucide-react";
import { QuestionExplanationBody } from "@/components/study/question-explanation-body";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { copy } from "@/lib/copy/vi";
import { normalizeExplanationReferences } from "@/lib/content/question-explanation";

interface AdminQuestionExplanationFieldsProps {
	reasoning: string;
	references: string[];
	reasoningId: string;
	onReasoningChange: (value: string) => void;
	onReferencesChange: (value: string[]) => void;
	reasoningPlaceholder?: string;
	referencePlaceholder?: string;
	noReferencesText?: string;
}

export function AdminQuestionExplanationFields({
	reasoning,
	references,
	reasoningId,
	onReasoningChange,
	onReferencesChange,
	reasoningPlaceholder,
	referencePlaceholder,
	noReferencesText,
}: AdminQuestionExplanationFieldsProps) {
	const reasoningTrimmed = reasoning.trim();
	const normalizedReferences = normalizeExplanationReferences(references);

	const patchReference = (index: number, value: string) => {
		onReferencesChange(
			normalizedReferences.map((entry, entryIndex) =>
				entryIndex === index ? value : entry,
			),
		);
	};

	const addReference = () => {
		onReferencesChange([...normalizedReferences, ""]);
	};

	const removeReference = (index: number) => {
		onReferencesChange(
			normalizedReferences.filter(
				(_, entryIndex) => entryIndex !== index,
			),
		);
	};

	return (
		<div className="space-y-4">
			<div className="grid gap-2">
				<Label htmlFor={reasoningId}>
					{copy.admin.cms.colExplanation}
				</Label>
				<textarea
					id={reasoningId}
					value={reasoning}
					rows={8}
					placeholder={
						reasoningPlaceholder ??
						copy.admin.cms.explanationReasoningPlaceholder
					}
					onChange={(event) => onReasoningChange(event.target.value)}
					className="min-h-[144px] w-full resize-y rounded-[10px] border border-border bg-surface px-3 py-2 font-mono text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				/>
				{reasoningTrimmed ? (
					<div className="space-y-2">
						<div className="rounded-[10px] border border-border bg-muted/30 p-3">
							<QuestionExplanationBody
								explanation={{
									reasoning,
									reference: normalizedReferences,
								}}
								className="text-base leading-relaxed text-foreground"
							/>
						</div>
					</div>
				) : null}
			</div>

			<div className="space-y-3">
				<div className="flex items-center justify-between gap-2">
					<Label>{copy.admin.cms.colExplanationReference}</Label>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={addReference}
					>
						<Plus className="size-4" />
						{copy.admin.cms.addReference}
					</Button>
				</div>
				{normalizedReferences.length === 0 ? (
					<p className="rounded-[10px] border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
						{noReferencesText ?? copy.admin.cms.noReferences}
					</p>
				) : (
					<div className="space-y-3">
						{normalizedReferences.map((reference, index) => (
							<div
								key={index}
								className="space-y-2 rounded-[12px] border border-border bg-muted/20 p-3"
							>
								<div className="flex items-center justify-between gap-2">
									<span className="text-xs font-medium text-muted-foreground">
										{copy.admin.cms.referenceRow(index + 1)}
									</span>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
										aria-label={
											copy.admin.cms.removeReference
										}
										onClick={() => removeReference(index)}
									>
										<Trash2 className="size-4" />
									</Button>
								</div>
								<textarea
									value={reference}
									rows={2}
									placeholder={
										referencePlaceholder ??
										copy.admin.cms
											.explanationReferencePlaceholder
									}
									onChange={(event) =>
										patchReference(
											index,
											event.target.value,
										)
									}
									className="min-h-[56px] w-full resize-y rounded-[10px] border border-border bg-surface px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
								/>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
