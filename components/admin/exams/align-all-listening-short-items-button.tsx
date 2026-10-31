"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Split } from "lucide-react";
import { toast } from "sonner";
import { alignListeningShortItem } from "@/lib/admin/content/listening-short-item-alignment-actions";
import { GEMINI_EXTRACT_CONCURRENCY } from "@/lib/admin/gemini/constants";
import { runWithConcurrency } from "@/lib/admin/gemini/run-with-concurrency";
import { copy } from "@/lib/copy/vi";
import { Button } from "@/components/ui/button";

interface AlignAllListeningShortItemsButtonProps {
	bookId: string;
	testId: string;
	questions: Array<{ id: string; globalItemNumber: number }>;
	disabled?: boolean;
}

export function AlignAllListeningShortItemsButton({
	bookId,
	testId,
	questions,
	disabled,
}: AlignAllListeningShortItemsButtonProps) {
	const router = useRouter();
	const labels = copy.admin.cms.turnAlignment;
	const [isRunning, setIsRunning] = useState(false);
	const [doneCount, setDoneCount] = useState(0);

	async function handleAlignAll() {
		if (questions.length === 0) {
			toast.error(labels.alignAllQuestionsEmpty);
			return;
		}

		setIsRunning(true);
		setDoneCount(0);

		try {
			const results = await runWithConcurrency(
				questions,
				GEMINI_EXTRACT_CONCURRENCY,
				async (question) => {
					const result = await alignListeningShortItem(
						bookId,
						testId,
						question.id,
					);
					setDoneCount((current) => current + 1);
					return { question, result };
				},
			);

			const failures = results.flatMap((entry) =>
				entry.result.ok
					? []
					: [
							{
								question: entry.question,
								error: entry.result.error,
							},
						],
			);
			const succeeded = results.length - failures.length;

			if (failures.length === 0) {
				toast.success(labels.alignAllQuestionsSuccess(succeeded));
			} else {
				const details = failures
					.slice(0, 3)
					.map((entry) => {
						const title = copy.admin.cms.questionDetailTitle(
							entry.question.globalItemNumber,
						);
						return `${title}: ${entry.error}`;
					})
					.join(" ");
				const extra =
					failures.length > 3 ? ` (+${failures.length - 3})` : "";
				toast.error(
					`${labels.alignAllQuestionsPartial(succeeded, results.length)} ${details}${extra}`,
				);
			}

			router.refresh();
		} finally {
			setIsRunning(false);
		}
	}

	return (
		<div>
			<Button
				type="button"
				variant="outline"
				size="sm"
				disabled={disabled || isRunning}
				onClick={() => void handleAlignAll()}
				aria-label={labels.alignAll}
				title={labels.alignAll}
			>
				<Split className="size-4" />
				{isRunning
					? labels.alignAllGenerating(doneCount, questions.length)
					: labels.alignAll}
			</Button>
		</div>
	);
}
