"use client";

import { Check, Circle, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type VocabularyImportProgressStatus =
	| "pending"
	| "running"
	| "done"
	| "error";

export interface VocabularyImportProgressStep {
	id: string;
	label: string;
	status: VocabularyImportProgressStatus;
}

interface VocabularyImportProgressPanelProps {
	title: string;
	steps: VocabularyImportProgressStep[];
	percent: number;
	processedLabel?: string;
	isComplete: boolean;
	completeLabel: string;
}

function StepIcon({ status }: { status: VocabularyImportProgressStatus }) {
	if (status === "running") {
		return <Loader2 className="size-4 animate-spin text-primary" />;
	}
	if (status === "done") {
		return <Check className="size-4 text-primary" />;
	}
	if (status === "error") {
		return <Circle className="size-4 text-destructive" />;
	}
	return <Circle className="size-4 text-muted-foreground/40" />;
}

export function VocabularyImportProgressPanel({
	title,
	steps,
	percent,
	processedLabel,
	isComplete,
	completeLabel,
}: VocabularyImportProgressPanelProps) {
	return (
		<div className="space-y-5 py-2">
			<div className="space-y-2">
				<h3 className="text-base font-medium">{title}</h3>
				<Progress value={percent} className="h-2" />
				<div className="flex items-center justify-between text-xs text-muted-foreground">
					<span>{Math.round(percent)}%</span>
					{processedLabel ? <span>{processedLabel}</span> : null}
				</div>
			</div>

			<ul className="space-y-2">
				{steps.map((step) => (
					<li
						key={step.id}
						className={cn(
							"flex items-center gap-3 rounded-[10px] border px-3 py-2.5 text-sm",
							step.status === "running" &&
								"border-primary/40 bg-primary/5",
							step.status === "done" &&
								"border-border bg-muted/20",
							step.status === "error" &&
								"border-destructive/40 bg-destructive/5",
							step.status === "pending" && "border-border",
						)}
					>
						<StepIcon status={step.status} />
						<span
							className={cn(
								"min-w-0 flex-1",
								step.status === "pending" &&
									"text-muted-foreground",
							)}
						>
							{step.label}
						</span>
					</li>
				))}
			</ul>

			{isComplete ? (
				<p className="text-sm font-medium text-primary">
					{completeLabel}
				</p>
			) : null}
		</div>
	);
}

export function vocabularyImportPercent(
	processed: number,
	total: number,
	stepWeight = 0,
): number {
	if (total <= 0) return stepWeight;
	return Math.min(100, stepWeight + (processed / total) * (100 - stepWeight));
}
