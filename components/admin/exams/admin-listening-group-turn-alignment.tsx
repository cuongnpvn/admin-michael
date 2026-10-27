"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AdminListeningGroupTurnSegmentRow } from "@/components/admin/exams/admin-listening-group-turn-segment-row";
import {
	alignListeningGroupTurns,
	updateListeningGroupTurnSegments,
} from "@/lib/admin/content/listening-group-turn-alignment-actions";
import { copy } from "@/lib/copy/vi";
import type { TranscriptSegment } from "@/lib/listening/transcript-segments";
import { Button } from "@/components/ui/button";

interface AdminListeningGroupTurnAlignmentProps {
	bookId: string;
	testId: string;
	groupId: string;
	hasAudio: boolean;
	turnCount: number;
	initialSegments: TranscriptSegment[];
	disabled?: boolean;
}

export function AdminListeningGroupTurnAlignment({
	bookId,
	testId,
	groupId,
	hasAudio,
	turnCount,
	initialSegments,
	disabled,
}: AdminListeningGroupTurnAlignmentProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [isSaving, setIsSaving] = useState(false);
	const [segments, setSegments] = useState(initialSegments);
	const segmentsRef = useRef(segments);
	segmentsRef.current = segments;

	const busy = disabled || isPending || isSaving;
	const canGenerate = hasAudio && turnCount > 0 && !busy;
	const labels = copy.admin.cms.turnAlignment;

	function handleGenerate() {
		startTransition(async () => {
			const result = await alignListeningGroupTurns(
				bookId,
				testId,
				groupId,
			);
			if (!result.ok) {
				toast.error(result.error);
				return;
			}
			setSegments(result.segments);
			toast.success(labels.success(result.segments.length));
			router.refresh();
		});
	}

	async function saveSegmentPatch(
		index: number,
		patch: Partial<Pick<TranscriptSegment, "english" | "startSec" | "endSec">>,
	): Promise<boolean> {
		const next = segmentsRef.current.map((segment) =>
			segment.index === index ? { ...segment, ...patch } : segment,
		);
		setIsSaving(true);
		try {
			const result = await updateListeningGroupTurnSegments(
				bookId,
				testId,
				groupId,
				next,
			);
			if (!result.ok) {
				toast.error(result.error);
				return false;
			}
			setSegments(result.segments);
			toast.success(labels.saved);
			router.refresh();
			return true;
		} finally {
			setIsSaving(false);
		}
	}

	return (
		<div className="space-y-3 border-t border-border pt-4">
			<div className="flex flex-wrap items-start justify-between gap-2">
				<div className="min-w-0">
					<p className="text-sm font-medium">{labels.title}</p>
				</div>
				<Button
					type="button"
					size="sm"
					variant="outline"
					disabled={!canGenerate}
					onClick={handleGenerate}
				>
					<Sparkles className="size-4" />
					{isPending ? labels.generating : labels.generate}
				</Button>
			</div>

			{segments.length === 0 ? (
				<p className="text-sm text-muted-foreground">{labels.empty}</p>
			) : (
				<ol className="space-y-2">
					{segments.map((segment) => (
						<AdminListeningGroupTurnSegmentRow
							key={segment.index}
							segment={segment}
							disabled={busy}
							onSave={(patch) =>
								saveSegmentPatch(segment.index, patch)
							}
						/>
					))}
				</ol>
			)}
		</div>
	);
}
