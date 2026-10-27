"use client";

import { AdminLectureOutlineEditor } from "@/components/admin/lectures/admin-lecture-outline-editor";
import type { LectureQuestionInsert } from "@/lib/lectures/options";

export function AdminLectureTestEditor({
	questions,
	onChange,
	onPendingChange,
}: {
	questions: LectureQuestionInsert[];
	onChange: (questions: LectureQuestionInsert[]) => void;
	onPendingChange?: (pending: boolean) => void;
}) {
	return (
		<AdminLectureOutlineEditor
			mode="test"
			questions={questions}
			onChange={onChange}
			onPendingChange={onPendingChange}
		/>
	);
}
