"use client";

import { useEffect, useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { copy } from "@/lib/copy/vi";
import {
	formatTurnTimeRange,
	type TranscriptSegment,
} from "@/lib/listening/transcript-segments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type TurnSegmentPatch = Pick<
	TranscriptSegment,
	"english" | "startSec" | "endSec"
>;

interface AdminListeningGroupTurnSegmentRowProps {
	segment: TranscriptSegment;
	disabled?: boolean;
	onSave: (patch: Partial<TurnSegmentPatch>) => Promise<boolean>;
}

function parseSeconds(value: string): number | null {
	const parsed = Number(value.trim().replace(",", "."));
	if (!Number.isFinite(parsed)) return null;
	return parsed;
}

export function AdminListeningGroupTurnSegmentRow({
	segment,
	disabled,
	onSave,
}: AdminListeningGroupTurnSegmentRowProps) {
	const labels = copy.admin.cms.turnAlignment;
	const [english, setEnglish] = useState(segment.english);
	const [editingTimes, setEditingTimes] = useState(false);
	const [startValue, setStartValue] = useState(segment.startSec.toFixed(2));
	const [endValue, setEndValue] = useState(segment.endSec.toFixed(2));
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		setEnglish(segment.english);
		setStartValue(segment.startSec.toFixed(2));
		setEndValue(segment.endSec.toFixed(2));
	}, [segment.english, segment.endSec, segment.startSec]);

	const busy = disabled || isSaving;

	async function commit(patch: Partial<TurnSegmentPatch>): Promise<boolean> {
		setIsSaving(true);
		try {
			return await onSave(patch);
		} finally {
			setIsSaving(false);
		}
	}

	async function handleEnglishBlur() {
		const next = english.trim();
		if (next === segment.english) {
			setEnglish(segment.english);
			return;
		}
		if (!next) {
			setEnglish(segment.english);
			return;
		}
		const ok = await commit({ english: next });
		if (!ok) setEnglish(segment.english);
	}

	async function handleSaveTimes() {
		const startSec = parseSeconds(startValue);
		const endSec = parseSeconds(endValue);
		if (startSec === null || endSec === null) return;

		const ok = await commit({ startSec, endSec });
		if (ok) setEditingTimes(false);
	}

	function handleCancelTimes() {
		setStartValue(segment.startSec.toFixed(2));
		setEndValue(segment.endSec.toFixed(2));
		setEditingTimes(false);
	}

	return (
		<li className="rounded-[10px] border border-border bg-background/70 px-3 py-2">
			{editingTimes ? (
				<div className="flex flex-wrap items-end gap-2">
					<div className="min-w-[7rem] flex-1 space-y-1">
						<Label htmlFor={`turn-start-${segment.index}`}>
							{labels.startSec}
						</Label>
						<Input
							id={`turn-start-${segment.index}`}
							type="number"
							inputMode="decimal"
							step="0.01"
							min="0"
							value={startValue}
							disabled={busy}
							onChange={(event) =>
								setStartValue(event.target.value)
							}
						/>
					</div>
					<div className="min-w-[7rem] flex-1 space-y-1">
						<Label htmlFor={`turn-end-${segment.index}`}>
							{labels.endSec}
						</Label>
						<Input
							id={`turn-end-${segment.index}`}
							type="number"
							inputMode="decimal"
							step="0.01"
							min="0"
							value={endValue}
							disabled={busy}
							onChange={(event) =>
								setEndValue(event.target.value)
							}
						/>
					</div>
					<div className="ml-auto flex shrink-0 gap-1">
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="size-8"
							disabled={busy}
							aria-label={labels.saveTimes}
							onClick={() => void handleSaveTimes()}
						>
							<Check className="size-4" />
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="size-8 text-muted-foreground"
							disabled={busy}
							aria-label={labels.cancelTimes}
							onClick={handleCancelTimes}
						>
							<X className="size-4" />
						</Button>
					</div>
				</div>
			) : (
				<div className="flex items-center gap-2">
					<span className="font-mono text-sm font-medium">
						{formatTurnTimeRange(segment.startSec, segment.endSec)}
					</span>
					<span className="text-xs text-muted-foreground">
						{labels.rawSeconds(segment.startSec, segment.endSec)}
					</span>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="ml-auto size-8 shrink-0 text-muted-foreground"
						disabled={busy}
						aria-label={labels.editTimes}
						onClick={() => setEditingTimes(true)}
					>
						<Pencil className="size-4" />
					</Button>
				</div>
			)}
			<textarea
				value={english}
				rows={2}
				disabled={busy}
				placeholder={labels.transcriptPlaceholder}
				onChange={(event) => setEnglish(event.target.value)}
				onBlur={() => void handleEnglishBlur()}
				className="mt-2 min-h-[56px] w-full resize-y rounded-[10px] border border-border bg-surface px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
			/>
		</li>
	);
}
