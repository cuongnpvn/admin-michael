"use client";

import { AdminLectureQuestionKind } from "@/components/admin/lectures/admin-lecture-question-kind";
import { questionIsSavable, questionsEqual } from "@/components/admin/lectures/lecture-outline";
import type { MidQuestionDraft } from "@/components/admin/lectures/use-mid-lectures";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { copy } from "@/lib/copy/vi";
import type { LectureQuestionInsert } from "@/lib/lectures/options";

export function AdminLectureMidQuestionDialog({
	draft,
	number,
	notice,
	onOpenChange,
	onChange,
	onSave,
	onDiscard,
	onDelete,
}: {
	draft: MidQuestionDraft | null;
	number: number;
	notice: string | null;
	onOpenChange: (open: boolean) => void;
	onChange: (patch: Partial<LectureQuestionInsert>) => void;
	onSave: () => void;
	onDiscard: () => void;
	onDelete: () => void;
}) {
	const fields = copy.admin.lectures.fields;
	const dirty = draft ? !questionsEqual(draft.question, draft.snapshot) : false;
	const savable = draft ? questionIsSavable(draft.question) : false;
	const saveDisabled = !savable || (draft?.index != null && !dirty);

	return (
		<Dialog open={draft != null} onOpenChange={onOpenChange}>
			<DialogContent className="z-[80] max-h-[85vh] overflow-y-auto sm:max-w-2xl">
				{draft ? (
					<>
						<DialogHeader>
							<DialogTitle>{fields.questionNumber(number)}</DialogTitle>
						</DialogHeader>
						<AdminLectureQuestionKind
							question={draft.question}
							index={number}
							lockKind
							collapseExplanation={false}
							onChange={onChange}
						/>
						{notice || (dirty && !savable) ? (
							<p className="text-sm text-destructive">
								{notice || fields.questionIncomplete}
							</p>
						) : null}
						<DialogFooter className="gap-2 sm:justify-between">
							{draft.index != null ? (
								<Button type="button" variant="outline" size="sm" onClick={onDelete}>
									{fields.deleteQuestion}
								</Button>
							) : (
								<span />
							)}
							<div className="flex flex-wrap justify-end gap-2">
								{dirty ? (
									<Button type="button" variant="outline" size="sm" onClick={onDiscard}>
										{fields.discardChanges}
									</Button>
								) : null}
								<Button type="button" size="sm" disabled={saveDisabled} onClick={onSave}>
									{fields.saveQuestion}
								</Button>
							</div>
						</DialogFooter>
					</>
				) : null}
			</DialogContent>
		</Dialog>
	);
}
