"use client";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { copy } from "@/lib/copy/vi";
import {
	TOEIC_TOPIC_TAGS,
	formatTagCustomerTooltip,
	formatTagEnglishValue,
	focusesForPart,
	skillsForPart,
	validateQuestionTagsComplete,
	type ToeicTagOption,
} from "@/lib/content/toeic-tags";
import { cn } from "@/lib/utils";

interface AdminQuestionTagsFieldProps {
	selectedTags: string[];
	onChange: (tags: string[]) => void;
	part?: number;
}

function toggleTag(selected: string[], value: string): string[] {
	if (selected.includes(value)) {
		return selected.filter((tag) => tag !== value);
	}
	return [...selected, value];
}

function TagChipGroup({
	title,
	tags,
	selectedTags,
	onToggle,
}: {
	title: string;
	tags: ToeicTagOption[];
	selectedTags: string[];
	onToggle: (value: string) => void;
}) {
	if (tags.length === 0) return null;

	return (
		<div className="space-y-2">
			<p className="text-xs font-medium text-muted-foreground">{title}</p>
			<div className="flex flex-wrap gap-1.5">
				{tags.map((tag) => {
					const active = selectedTags.includes(tag.value);
					return (
						<button
							key={tag.value}
							type="button"
							onClick={() => onToggle(tag.value)}
							className={cn(
								"rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
							)}
						>
							<Badge
								variant={active ? "default" : "outline"}
								className="cursor-pointer font-mono text-xs font-normal tracking-tight"
								title={formatTagCustomerTooltip(tag.value)}
							>
								{formatTagEnglishValue(tag.value)}
							</Badge>
						</button>
					);
				})}
			</div>
		</div>
	);
}

export function AdminQuestionTagsField({
	selectedTags,
	onChange,
	part,
}: AdminQuestionTagsFieldProps) {
	const tagCheck = validateQuestionTagsComplete(selectedTags);

	const skillTags =
		part !== undefined && skillsForPart(part).length > 0
			? skillsForPart(part)
			: skillsForPart(5).concat(skillsForPart(7));

	const focusTags =
		part !== undefined && focusesForPart(part).length > 0
			? focusesForPart(part)
			: focusesForPart(5).concat(focusesForPart(7));

	return (
		<div className="grid gap-2">
			<Label>{copy.admin.cms.colTags}</Label>
			<TagChipGroup
				title={copy.admin.cms.tagGroupTopic}
				tags={TOEIC_TOPIC_TAGS}
				selectedTags={selectedTags}
				onToggle={(value) => onChange(toggleTag(selectedTags, value))}
			/>
			<TagChipGroup
				title={copy.admin.cms.tagGroupSkill}
				tags={skillTags}
				selectedTags={selectedTags}
				onToggle={(value) => onChange(toggleTag(selectedTags, value))}
			/>
			<TagChipGroup
				title={copy.admin.cms.tagGroupFocus}
				tags={focusTags}
				selectedTags={selectedTags}
				onToggle={(value) => onChange(toggleTag(selectedTags, value))}
			/>
			{selectedTags.length > 0 ? (
				<p className="text-xs text-muted-foreground">
					{selectedTags
						.map((tag) => formatTagEnglishValue(tag))
						.join(" · ")}
				</p>
			) : null}
			<p
				className={cn(
					"text-xs",
					tagCheck.ok ? "text-muted-foreground" : "text-destructive",
				)}
			>
				{tagCheck.ok ? copy.admin.cms.tagsHint : tagCheck.error}
			</p>
		</div>
	);
}
