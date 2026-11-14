"use client";

import { ChevronRight, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { copy } from "@/lib/copy/vi";
import type { LectureExerciseKind } from "@/lib/lectures/exercise";
import type { LectureQuestionInsert } from "@/lib/lectures/options";
import type { OutlineSectionData } from "@/components/admin/lectures/lecture-outline";

const KINDS = ["multiple_choice", "highlight", "rewrite", "fill_blank"] as const;

export function AdminLectureMidDrawer({
	open,
	locked,
	section,
	index,
	onOpenChange,
	onTitle,
	onKind,
	onEdit,
	onAdd,
	onDelete,
}: {
	open: boolean;
	locked: boolean;
	section: OutlineSectionData | null;
	index: number;
	onOpenChange: (open: boolean) => void;
	onTitle: (title: string) => void;
	onKind: (kind: LectureExerciseKind) => void;
	onEdit: (questionIndex: number) => void;
	onAdd: () => void;
	onDelete: () => void;
}) {
	const fields = copy.admin.lectures.fields;
	return (
		<Sheet open={open} onOpenChange={onOpenChange} modal={!locked}>
			<SheetContent
				side="right"
				className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
				onEscapeKeyDown={(event) => {
					if (locked) event.preventDefault();
				}}
				onPointerDownOutside={(event) => {
					if (locked) event.preventDefault();
				}}
				onInteractOutside={(event) => {
					if (locked) event.preventDefault();
				}}
			>
				{section ? (
					<>
						<SheetHeader className="space-y-1 border-b border-border px-5 py-4 pr-12 text-left">
							<SheetTitle>{fields.midLectureItem(index + 1, section.title)}</SheetTitle>
							<p className="text-sm text-muted-foreground">{fields.midLectureKindHint}</p>
						</SheetHeader>
						<div className="space-y-4 border-b border-border px-5 py-4">
							<div className="space-y-2">
								<Label htmlFor="mid-lecture-title">{fields.midLectureTitle}</Label>
								<Input
									id="mid-lecture-title"
									value={section.title}
									onChange={(event) => onTitle(event.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="mid-lecture-kind">{fields.kind}</Label>
								<select
									id="mid-lecture-kind"
									className="flex h-9 w-full rounded-[10px] border border-border bg-surface px-3 text-sm shadow-sm"
									value={section.kind}
									onChange={(event) =>
										onKind(event.target.value as LectureExerciseKind)
									}
								>
									{KINDS.map((kind) => (
										<option key={kind} value={kind}>
											{fields.kinds[kind]}
										</option>
									))}
								</select>
							</div>
						</div>
						<div className="flex items-center justify-between gap-3 px-5 py-3">
							<h3 className="text-sm font-semibold">{fields.questionsHeading}</h3>
							<Button type="button" variant="outline" size="sm" onClick={onAdd}>
								{fields.addQuestion}
							</Button>
						</div>
						<div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-5 pb-4">
							{section.questions.length === 0 ? (
								<p className="rounded-[12px] border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
									{fields.sectionNoQuestions}
								</p>
							) : (
								section.questions.map((question, questionIndex) => (
									<QuestionRow
										key={`${index}-${questionIndex}`}
										number={questionIndex + 1}
										question={question}
										onEdit={() => onEdit(questionIndex)}
									/>
								))
							)}
						</div>
						<div className="border-t border-border px-5 py-4">
							<Button type="button" variant="outline" size="sm" onClick={onDelete}>
								{fields.deleteMidLecture}
							</Button>
						</div>
					</>
				) : null}
			</SheetContent>
		</Sheet>
	);
}

function QuestionRow({
	number,
	question,
	onEdit,
}: {
	number: number;
	question: LectureQuestionInsert;
	onEdit: () => void;
}) {
	const fields = copy.admin.lectures.fields;
	const preview = questionPreview(question);
	return (
		<div className="flex items-center gap-2 rounded-[12px] border border-border px-3 py-2">
			<div className="min-w-0 flex-1">
				<p className="text-sm font-medium">{fields.questionNumber(number)}</p>
				<p className="truncate text-sm text-muted-foreground">
					{preview || fields.questionEmpty}
				</p>
			</div>
			<Button
				type="button"
				variant="ghost"
				size="icon"
				aria-label={`${fields.editQuestion} ${number}`}
				onClick={onEdit}
			>
				<Pencil />
			</Button>
		</div>
	);
}

export function MidLectureButton({
	label,
	kind,
	count,
	active,
	onClick,
}: {
	label: string;
	kind: string;
	count: number;
	active: boolean;
	onClick: () => void;
}) {
	const fields = copy.admin.lectures.fields;
	return (
		<button
			type="button"
			aria-expanded={active}
			className={`flex w-full items-center gap-3 rounded-[12px] border border-border px-4 py-3 text-left ${active ? "bg-muted" : "hover:bg-muted/60"}`}
			onClick={onClick}
		>
			<span className="min-w-0 flex-1">
				<span className="block truncate text-sm font-medium">{label}</span>
				<span className="block text-xs text-muted-foreground">{kind}</span>
			</span>
			<span className="shrink-0 text-xs text-muted-foreground">
				{fields.questionCount(count)}
			</span>
			<ChevronRight className="size-4 shrink-0 text-muted-foreground" />
		</button>
	);
}

function questionPreview(question: LectureQuestionInsert): string {
	const fill = question.payload.parts
		.map((part) => (part.type === "text" ? part.text : "______"))
		.join("")
		.trim();
	return (
		question.stem.trim() ||
		question.payload.prompt.trim() ||
		question.payload.sentence.trim() ||
		fill
	);
}
