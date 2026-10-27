"use client";

import { AdminLectureOutlineChips } from "@/components/admin/lectures/admin-lecture-outline-chips";
import {
	outlineDraftKey,
	type LectureOutlineController,
} from "@/components/admin/lectures/use-lecture-outline";
import { copy } from "@/lib/copy/vi";
import type { OutlineMode } from "@/components/admin/lectures/lecture-outline";
import { cn } from "@/lib/utils";

export function AdminLectureOutlineNav({
	mode,
	outline,
}: {
	mode: OutlineMode;
	outline: LectureOutlineController;
}) {
	const fields = copy.admin.lectures.fields;
	const draftOpen = outline.open.mode === "draft-section";
	const draftIndex = outline.sections.length;

	return (
		<nav className="flex gap-2 overflow-x-auto pb-1 lg:sticky lg:top-4 lg:block lg:w-64 lg:shrink-0 lg:space-y-2 lg:overflow-visible lg:pb-0">
			{outline.sections.map((section, index) => {
				const key = outline.keys[index];
				if (!key) return null;
				const active = outline.activeKey === key;
				return (
					<div key={key} className="shrink-0 lg:w-full">
						<SectionButton
							label={fields.outlineSection(index + 1, section.title)}
							hint={groupHint(mode, section.part, section.kind)}
							active={active}
							onClick={() => outline.selectSection(key)}
						/>
						<div className="mt-2 hidden lg:block">
							<AdminLectureOutlineChips
								sections={outline.sections}
								sectionIndex={index}
								active={active}
								questionIndex={
									outline.open.mode === "section"
										? outline.open.questionIndex
										: null
								}
								questionIsNew={
									active &&
									outline.open.mode === "section" &&
									outline.open.questionIsNew
								}
								onSelect={(questionIndex) =>
									outline.selectQuestion(key, questionIndex)
								}
								onAdd={() => outline.addQuestion(key)}
							/>
						</div>
					</div>
				);
			})}
			{draftOpen ? (
				<div className="shrink-0 lg:w-full">
					<SectionButton
						label={fields.outlineSection(
							draftIndex + 1,
							outline.open.mode === "draft-section" ? outline.open.meta.title : "",
						)}
						hint={
							outline.open.mode === "draft-section"
								? groupHint(mode, outline.open.meta.part, outline.open.meta.kind)
								: ""
						}
						active
						onClick={() => {}}
					/>
					<div className="mt-2 hidden lg:block">
						<AdminLectureOutlineChips
							sections={outline.sections}
							sectionIndex={draftIndex}
							active
							questionIndex={null}
							questionIsNew={false}
							onSelect={() => {}}
							onAdd={() => outline.addQuestion(outlineDraftKey)}
						/>
					</div>
				</div>
			) : null}
		</nav>
	);
}

function SectionButton({
	label,
	hint,
	active,
	onClick,
}: {
	label: string;
	hint: string;
	active: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			aria-current={active ? "true" : undefined}
			className={cn(
				"w-full rounded-[12px] px-3 py-2 text-left",
				active ? "bg-muted" : "hover:bg-muted/60",
			)}
			onClick={onClick}
		>
			<span className="block text-sm font-medium">{label}</span>
			<span className="block text-xs text-muted-foreground">{hint}</span>
		</button>
	);
}

function groupHint(
	mode: OutlineMode,
	part: "1" | "5" | undefined,
	kind: LectureOutlineController["sections"][number]["kind"],
): string {
	const fields = copy.admin.lectures.fields;
	if (mode === "test") {
		return part === "1" ? fields.testSectionKindPart1 : fields.testSectionKindMcq;
	}
	return fields.kinds[kind];
}
