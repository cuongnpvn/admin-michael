"use client";

import {
	ListeningPart1ExplanationBody,
	shouldUseListeningPart1ExplanationBody,
} from "@/components/study/listening-part1-explanation-body";
import { QuestionExplanationMarkdown } from "@/components/study/question-explanation-markdown";
import {
	formatQuestionExplanation,
	hasQuestionExplanation,
	type QuestionExplanation,
} from "@/lib/content/resolve-question-hint";
import { copy } from "@/lib/copy/vi";

interface QuestionExplanationBodyProps {
	explanation?: QuestionExplanation | null;
	className?: string;
}

export function QuestionExplanationBody({
	explanation,
	className,
}: QuestionExplanationBodyProps) {
	if (!hasQuestionExplanation(explanation)) {
		return (
			<p
				className={
					className ?? "text-base leading-relaxed text-foreground"
				}
			>
				{copy.session.explanationFallback}
			</p>
		);
	}

	const formatted = formatQuestionExplanation(explanation!);

	if (shouldUseListeningPart1ExplanationBody(formatted.reasoning)) {
		return (
			<ListeningPart1ExplanationBody
				reasoning={formatted.reasoning}
				className={
					className ?? "text-base leading-relaxed text-foreground"
				}
			/>
		);
	}

	return (
		<QuestionExplanationMarkdown
			content={formatted.reasoning}
			className={
				className ?? "text-base leading-relaxed text-foreground"
			}
		/>
	);
}
