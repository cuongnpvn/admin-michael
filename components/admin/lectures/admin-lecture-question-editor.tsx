"use client";

import { AdminLectureOutlineEditor } from "@/components/admin/lectures/admin-lecture-outline-editor";
import type { LectureQuestionInsert } from "@/lib/lectures/options";

export function AdminLectureQuestionEditor({
	questions,
	onChange,
	onInsertLink,
	onPendingChange,
}: {
	questions: LectureQuestionInsert[];
	onChange: (questions: LectureQuestionInsert[]) => void;
	onInsertLink: (section: number) => void;
	onPendingChange?: (pending: boolean) => void;
}) {
	return (
		<AdminLectureOutlineEditor
			mode="lesson"
			questions={questions}
			onChange={onChange}
			onPendingChange={onPendingChange}
			onInsertLink={onInsertLink}
		/>
	);
}
