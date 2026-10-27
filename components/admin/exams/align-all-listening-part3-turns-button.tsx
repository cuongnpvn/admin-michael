"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Split } from "lucide-react";
import { toast } from "sonner";
import { alignListeningGroupTurns } from "@/lib/admin/content/listening-group-turn-alignment-actions";
import { GEMINI_EXTRACT_CONCURRENCY } from "@/lib/admin/gemini/constants";
import { runWithConcurrency } from "@/lib/admin/gemini/run-with-concurrency";
import { copy } from "@/lib/copy/vi";
import { Button } from "@/components/ui/button";

interface AlignAllListeningPart3TurnsButtonProps {
	bookId: string;
	testId: string;
	groups: Array<{ id: string; from: number; to: number }>;
	disabled?: boolean;
}

export function AlignAllListeningPart3TurnsButton({
	bookId,
	testId,
	groups,
	disabled,
}: AlignAllListeningPart3TurnsButtonProps) {
	const router = useRouter();
	const labels = copy.admin.cms.turnAlignment;
	const [isRunning, setIsRunning] = useState(false);
	const [doneCount, setDoneCount] = useState(0);

	async function handleAlignAll() {
		if (groups.length === 0) {
			toast.error(labels.alignAllEmpty);
			return;
		}

		setIsRunning(true);
		setDoneCount(0);

		try {
			const results = await runWithConcurrency(
				groups,
				GEMINI_EXTRACT_CONCURRENCY,
				async (group) => {
					const result = await alignListeningGroupTurns(
						bookId,
						testId,
						group.id,
					);
					setDoneCount((current) => current + 1);
					return { group, result };
				},
			);

			const failures = results.flatMap((entry) =>
				entry.result.ok
					? []
					: [
							{
								group: entry.group,
								error: entry.result.error,
							},
						],
			);
			const succeeded = results.length - failures.length;

			if (failures.length === 0) {
				toast.success(labels.alignAllSuccess(succeeded));
			} else {
				const details = failures
					.slice(0, 3)
					.map((entry) => {
						const title = copy.admin.cms.groupDetailTitle(
							entry.group.from,
							entry.group.to,
						);
						return `${title}: ${entry.error}`;
					})
					.join(" ");
				const extra =
					failures.length > 3 ? ` (+${failures.length - 3})` : "";
				toast.error(
					`${labels.alignAllPartial(succeeded, results.length)} ${details}${extra}`,
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
					? labels.alignAllGenerating(doneCount, groups.length)
					: labels.alignAll}
			</Button>
		</div>
	);
}
