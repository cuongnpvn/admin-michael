"use client";

import { Button } from "@/components/ui/button";
import { copy } from "@/lib/copy/vi";
import type { OutlineSectionData } from "@/components/admin/lectures/lecture-outline";
import { cn } from "@/lib/utils";

export function questionOffset(
	sections: OutlineSectionData[],
	sectionIndex: number,
): number {
	return sections
		.slice(0, sectionIndex)
		.reduce((count, section) => count + section.questions.length, 0);
}

export function AdminLectureOutlineChips({
	sections,
	sectionIndex,
	active,
	questionIndex,
	questionIsNew,
	onSelect,
	onAdd,
}: {
	sections: OutlineSectionData[];
	sectionIndex: number;
	active: boolean;
	questionIndex: number | null;
	questionIsNew: boolean;
	onSelect: (questionIndex: number) => void;
	onAdd: () => void;
}) {
	const fields = copy.admin.lectures.fields;
	const offset = questionOffset(sections, sectionIndex);
	const questions = sections[sectionIndex]?.questions ?? [];
	const draftNumber = offset + questions.length + 1;

	return (
		<div className="flex flex-wrap items-center gap-1.5">
			{questions.map((_, index) => {
				const selected = active && !questionIsNew && questionIndex === index;
				const number = offset + index + 1;
				return (
					<button
						key={`${sectionIndex}-${index}`}
						type="button"
						aria-label={fields.questionNumber(number)}
						aria-pressed={selected}
						className={chipClass(selected)}
						onClick={() => onSelect(index)}
					>
						{number}
					</button>
				);
			})}
			{active && questionIsNew ? (
				<span className={chipClass(true)} aria-current="true">
					{draftNumber}
				</span>
			) : null}
			<Button
				type="button"
				variant="outline"
				size="icon"
				aria-label={fields.addQuestion}
				onClick={onAdd}
			>
				+
			</Button>
		</div>
	);
}

function chipClass(selected: boolean): string {
	return cn(
		"inline-flex size-8 items-center justify-center rounded-full border text-sm",
		selected
			? "border-primary bg-primary text-primary-foreground"
			: "border-border bg-surface text-foreground",
	);
}
