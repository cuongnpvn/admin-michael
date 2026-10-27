"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { AdminLectureOutlineChips } from "@/components/admin/lectures/admin-lecture-outline-chips";
import { questionOffset } from "@/components/admin/lectures/admin-lecture-outline-chips";
import { AdminLecturePart5SearchDialog } from "@/components/admin/lectures/admin-lecture-part5-bank";
import { AdminLectureQuestionKind } from "@/components/admin/lectures/admin-lecture-question-kind";
import { outlineDraftKey } from "@/components/admin/lectures/use-lecture-outline";
import type { LectureOutlineController } from "@/components/admin/lectures/use-lecture-outline";
import { LecturePart1View } from "@/components/lectures/lecture-part1-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { copy } from "@/lib/copy/vi";
import type { LectureExerciseKind } from "@/lib/lectures/exercise";
import type { OutlineMode } from "@/components/admin/lectures/lecture-outline";
import { cn } from "@/lib/utils";

const KINDS = ["multiple_choice", "highlight", "rewrite", "fill_blank"] as const;

export function AdminLectureOutlineDetail({
	mode,
	outline,
	onInsertLink,
}: {
	mode: OutlineMode;
	outline: LectureOutlineController;
	onInsertLink?: (section: number) => void;
}) {
	const paneRef = useRef<HTMLElement>(null);
	const clearFocusRef = useRef(outline.clearFocus);
	clearFocusRef.current = outline.clearFocus;
	const fields = copy.admin.lectures.fields;
	const [bankOpen, setBankOpen] = useState(false);
	const open = outline.open;

	useEffect(() => {
		if (!outline.focus) return;
		const root = paneRef.current;
		root?.scrollIntoView({ block: "start" });
		if (outline.focus === "section") {
			root?.querySelector<HTMLElement>("[data-outline-focus]")?.focus();
		} else {
			const question = root?.querySelector<HTMLElement>("[data-outline-question]");
			const target =
				question?.querySelector<HTMLElement>("[data-outline-focus]") ??
				question?.querySelector<HTMLElement>("input, textarea");
			target?.focus();
		}
		clearFocusRef.current();
	}, [outline.focus]);

	if (open.mode === "none") {
		return (
			<p className="flex-1 rounded-[12px] border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
				{fields.exerciseEmpty}
			</p>
		);
	}

	const draft = open.mode === "draft-section";
	const sectionIndex = draft
		? outline.sections.length
		: outline.keys.indexOf(open.key);
	const meta = open.meta;
	const part = mode === "test" ? (meta.part === "1" ? "1" : "5") : undefined;
	const question = open.mode === "section" ? open.question : null;
	const questionIsNew = open.mode === "section" && open.questionIsNew;
	const showQuestion = open.mode === "section" && question != null;
	const questionNumber =
		questionOffset(outline.sections, sectionIndex) +
		(questionIsNew
			? (outline.sections[sectionIndex]?.questions.length ?? 0)
			: (open.mode === "section" ? (open.questionIndex ?? 0) : 0)) +
		1;
	const newItem = draft || questionIsNew;

	return (
		<section
			ref={paneRef}
			className={cn(
				"min-w-0 flex-1 scroll-mt-4 space-y-4 rounded-[16px] border p-4",
				newItem ? "border-dashed border-border" : "border-border",
			)}
		>
			<div className="flex flex-wrap items-start justify-between gap-3">
				<h3 className="text-sm font-semibold">
					{fields.outlineSection(sectionIndex + 1, meta.title)}
				</h3>
				{draft ? null : (
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => outline.removeSection(open.key)}
					>
						{fields.deleteSection}
					</Button>
				)}
			</div>
			<div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-end">
				<div className="space-y-2">
					<Label htmlFor="outline-section-title">{fields.sectionTitle}</Label>
					<Input
						id="outline-section-title"
						value={meta.title}
						data-outline-focus={outline.focus === "section" ? "" : undefined}
						onChange={(event) => outline.setTitle(event.target.value)}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="outline-section-kind">
						{mode === "test" ? fields.testSectionKind : fields.kind}
					</Label>
					{mode === "test" ? (
						<select
							id="outline-section-kind"
							className="flex h-9 w-full rounded-[10px] border border-border bg-surface px-3 text-sm shadow-sm"
							value={part}
							disabled={outline.kindLocked}
							onChange={(event) =>
								outline.setPart(event.target.value === "1" ? "1" : "5")
							}
						>
							<option value="5">{fields.testSectionKindMcq}</option>
							<option value="1">{fields.testSectionKindPart1}</option>
						</select>
					) : (
						<select
							id="outline-section-kind"
							className="flex h-9 w-full rounded-[10px] border border-border bg-surface px-3 text-sm shadow-sm"
							value={meta.kind}
							disabled={outline.kindLocked}
							onChange={(event) =>
								outline.setKind(event.target.value as LectureExerciseKind)
							}
						>
							{KINDS.map((kind) => (
								<option key={kind} value={kind}>
									{fields.kinds[kind]}
								</option>
							))}
						</select>
					)}
				</div>
			</div>
			{mode === "lesson" && !draft && onInsertLink ? (
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => onInsertLink(sectionIndex + 1)}
				>
					{fields.insertExerciseLink}
				</Button>
			) : null}
			<div className="lg:hidden">
				<AdminLectureOutlineChips
					sections={outline.sections}
					sectionIndex={sectionIndex}
					active
					questionIndex={open.mode === "section" ? open.questionIndex : null}
					questionIsNew={questionIsNew}
					onSelect={(questionIndex) => {
						if (draft) return;
						outline.selectQuestion(open.key, questionIndex);
					}}
					onAdd={() =>
						outline.addQuestion(draft ? outlineDraftKey : open.key)
					}
				/>
			</div>
			{showQuestion ? null : (
				<p className="text-sm text-muted-foreground">{fields.sectionNoQuestions}</p>
			)}
			{showQuestion && question ? (
				<div data-outline-question className="space-y-3">
					<div className="flex items-center justify-between gap-3">
						<h3 className="text-sm font-semibold">
							{fields.questionNumber(questionNumber)}
						</h3>
						{mode === "test" ? (
							<Button
								type="button"
								variant="outline"
								size="sm"
								data-outline-focus={part === "1" ? "" : undefined}
								onClick={() => setBankOpen(true)}
							>
								<Search className="size-3.5" />
								{fields.searchBank}
							</Button>
						) : null}
					</div>
					{part === "1" && question.payload.bankQuestionId ? (
						<LecturePart1View payload={question.payload}>
							<ul className="space-y-2 text-sm">
								{question.options.map((option) => (
									<li key={option.id}>
										<span className="mr-2 font-semibold">{option.label}.</span>
										{option.text}
									</li>
								))}
							</ul>
						</LecturePart1View>
					) : part === "1" ? null : (
						<AdminLectureQuestionKind
							question={question}
							index={sectionIndex * 100 + (open.questionIndex ?? outline.sections.length)}
							lockKind
							collapseExplanation={mode === "test"}
							onChange={outline.patchQuestion}
						/>
					)}
					{question.payload.bankQuestionId ? (
						<p className="text-xs text-muted-foreground">{fields.bankSource}</p>
					) : null}
				</div>
			) : null}
			{noticeRow(outline.notice)}
			<div className="flex flex-wrap gap-2">
				{outline.unfinished ? (
					<Button type="button" variant="outline" size="sm" onClick={outline.discard}>
						{newItem ? fields.discardItem : fields.discardChanges}
					</Button>
				) : null}
				{open.mode === "section" && !questionIsNew && open.questionIndex != null ? (
					<Button type="button" variant="outline" size="sm" onClick={outline.removeQuestion}>
						{fields.deleteQuestion}
					</Button>
				) : null}
				{outline.unfinished ? (
					<Button
						type="button"
						size="sm"
						disabled={outline.saveDisabled}
						onClick={outline.save}
					>
						{draft || !question ? fields.saveSection : fields.saveQuestion}
					</Button>
				) : null}
			</div>
			{mode === "test" && showQuestion ? (
				<AdminLecturePart5SearchDialog
					part={part}
					open={bankOpen}
					onOpenChange={setBankOpen}
					onFilled={outline.fillFromBank}
				/>
			) : null}
		</section>
	);
}

function noticeRow(notice: string | null) {
	if (!notice) return null;
	return <p className="text-sm text-destructive">{notice}</p>;
}
