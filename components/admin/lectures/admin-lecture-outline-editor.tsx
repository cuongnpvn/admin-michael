"use client";

import { AdminLectureOutlineDetail } from "@/components/admin/lectures/admin-lecture-outline-detail";
import { AdminLectureOutlineNav } from "@/components/admin/lectures/admin-lecture-outline-nav";
import { useLectureOutline } from "@/components/admin/lectures/use-lecture-outline";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/copy/vi";
import type { OutlineMode } from "@/components/admin/lectures/lecture-outline";
import type { LectureQuestionInsert } from "@/lib/lectures/options";

export function AdminLectureOutlineEditor({
	mode,
	questions,
	onChange,
	onPendingChange,
	onInsertLink,
}: {
	mode: OutlineMode;
	questions: LectureQuestionInsert[];
	onChange: (questions: LectureQuestionInsert[]) => void;
	onPendingChange?: (pending: boolean) => void;
	onInsertLink?: (section: number) => void;
}) {
	const outline = useLectureOutline({
		mode,
		questions,
		onChange,
		onPendingChange,
	});
	const fields = copy.admin.lectures.fields;
	const heading = mode === "test" ? fields.testSections : fields.exercise;
	const showNav =
		outline.sections.length > 0 || outline.open.mode === "draft-section";

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between gap-3">
				<h2 className="text-base font-semibold">{heading}</h2>
				<Button type="button" variant="outline" size="sm" onClick={outline.addSection}>
					{fields.addSection}
				</Button>
			</div>
			{showNav ? (
				<div className="flex flex-col gap-4 lg:flex-row lg:items-start">
					<AdminLectureOutlineNav mode={mode} outline={outline} />
					<AdminLectureOutlineDetail
						mode={mode}
						outline={outline}
						onInsertLink={onInsertLink}
					/>
				</div>
			) : (
				<AdminLectureOutlineDetail
					mode={mode}
					outline={outline}
					onInsertLink={onInsertLink}
				/>
			)}
		</div>
	);
}
