"use client";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { copy } from "@/lib/copy/vi";
import {
	LISTENING_PART12_TOPIC_TAGS,
	listeningPart12TagsForPart,
	validateListeningPart12QuestionTags,
} from "@/lib/content/listening-part-12-tags";
import { cn } from "@/lib/utils";

interface AdminListeningPart12TagsFieldProps {
	part: 1 | 2;
	tags: string[];
	onChange: (tags: string[]) => void;
}

function ChipRow({
	options,
	selected,
	onSelect,
}: {
	options: { value: string; chip_vi: string }[];
	selected: string;
	onSelect: (value: string) => void;
}) {
	return (
		<div className="flex flex-wrap gap-1.5">
			{options.map((tag) => {
				const active = selected === tag.value;
				return (
					<button
						key={tag.value}
						type="button"
						onClick={() => onSelect(tag.value)}
						className={cn(
							"rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
						)}
					>
						<Badge
							variant={active ? "default" : "outline"}
							className="cursor-pointer text-xs font-normal"
							title={tag.chip_vi}
						>
							{tag.chip_vi}
						</Badge>
					</button>
				);
			})}
		</div>
	);
}

export function AdminListeningPart12TagsField({
	part,
	tags,
	onChange,
}: AdminListeningPart12TagsFieldProps) {
	const parsed = validateListeningPart12QuestionTags(part, tags);
	const stored = parsed.ok ? parsed.tags : [];
	const topic = stored.find((slug) =>
		LISTENING_PART12_TOPIC_TAGS.some((entry) => entry.value === slug),
	);
	const classification =
		stored.find((slug) => slug !== topic) ?? "";

	function emit(nextClassification: string, nextTopic: string | undefined) {
		if (!nextClassification) return;
		onChange(nextTopic ? [nextTopic, nextClassification] : [nextClassification]);
	}

	return (
		<div className="grid gap-3 rounded-[14px] border border-border bg-muted/10 p-4">
			<Label>{copy.admin.cms.colTags}</Label>
			<div className="space-y-2">
				<p className="text-xs font-medium text-muted-foreground">
					{copy.admin.cms.tagGroupTopic}
				</p>
				<ChipRow
					options={LISTENING_PART12_TOPIC_TAGS}
					selected={topic ?? ""}
					onSelect={(value) =>
						emit(classification, topic === value ? undefined : value)
					}
				/>
			</div>
			<div className="space-y-2">
				<p className="text-xs font-medium text-muted-foreground">
					{copy.admin.cms.tagGroupClassification}
				</p>
				<ChipRow
					options={listeningPart12TagsForPart(part)}
					selected={classification}
					onSelect={(value) => emit(value, topic)}
				/>
			</div>
		</div>
	);
}
