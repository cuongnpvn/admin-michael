"use client";

import { AdminLectureMidDrawer, MidLectureButton } from "@/components/admin/lectures/admin-lecture-mid-drawer";
import { AdminLectureMidQuestionDialog } from "@/components/admin/lectures/admin-lecture-mid-question-dialog";
import { useMidLectures } from "@/components/admin/lectures/use-mid-lectures";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/copy/vi";
import type { LectureQuestionInsert } from "@/lib/lectures/options";

export function AdminLectureMidEditor({
	questions,
	onChange,
	onPendingChange,
}: {
	questions: LectureQuestionInsert[];
	onChange: (questions: LectureQuestionInsert[]) => void;
	onPendingChange?: (pending: boolean) => void;
}) {
	const mid = useMidLectures({ questions, onChange, onPendingChange });
	const fields = copy.admin.lectures.fields;
	const drawerIndex = mid.drawerKey ? mid.keys.indexOf(mid.drawerKey) : -1;
	const drawerSection = drawerIndex >= 0 ? mid.sections[drawerIndex] : null;
	const questionNumber =
		mid.draft == null
			? 1
			: (mid.draft.index ?? drawerSection?.questions.length ?? 0) + 1;

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between gap-3">
				<h2 className="text-base font-semibold">{fields.midLecture}</h2>
				<Button type="button" variant="outline" size="sm" onClick={mid.addSection}>
					{fields.addMidLecture}
				</Button>
			</div>
			{mid.sections.length === 0 ? (
				<p className="rounded-[12px] border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
					{fields.midLectureEmpty}
				</p>
			) : (
				<div className="space-y-2">
					{mid.sections.map((section, index) => {
						const key = mid.keys[index];
						if (!key) return null;
						return (
							<MidLectureButton
								key={key}
								label={fields.midLectureItem(index + 1, section.title)}
								kind={fields.kinds[section.kind]}
								count={section.questions.length}
								active={mid.drawerKey === key}
								onClick={() => mid.openDrawer(key)}
							/>
						);
					})}
				</div>
			)}
			<AdminLectureMidDrawer
				open={drawerSection != null}
				locked={mid.draft != null}
				section={drawerSection ?? null}
				index={Math.max(drawerIndex, 0)}
				onOpenChange={(open) => {
					if (!open) mid.closeDrawer();
				}}
				onTitle={(title) => {
					if (mid.drawerKey) mid.setTitle(mid.drawerKey, title);
				}}
				onKind={(kind) => {
					if (mid.drawerKey) mid.setKind(mid.drawerKey, kind);
				}}
				onEdit={(questionIndex) => {
					if (mid.drawerKey) mid.openQuestion(mid.drawerKey, questionIndex);
				}}
				onAdd={() => {
					if (mid.drawerKey) mid.openQuestion(mid.drawerKey, null);
				}}
				onDelete={() => {
					if (mid.drawerKey) mid.removeSection(mid.drawerKey);
				}}
			/>
			<AdminLectureMidQuestionDialog
				draft={mid.draft}
				number={questionNumber}
				notice={mid.notice}
				onOpenChange={(open) => {
					if (!open) mid.closeDialog();
				}}
				onChange={mid.patchQuestion}
				onSave={mid.saveQuestion}
				onDiscard={mid.discardQuestion}
				onDelete={mid.removeQuestion}
			/>
		</div>
	);
}
