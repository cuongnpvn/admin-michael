import { lectureQuestionSection } from "@/lib/lectures/exercise-groups";
import type { LectureExerciseKind } from "@/lib/lectures/exercise";
import { emptyLectureQuestion } from "@/lib/lectures/options";
import type { LectureQuestionInsert } from "@/lib/lectures/options";
import {
	readLectureSections,
	writeLectureSections,
} from "@/components/admin/lectures/lecture-section-draft";

export type OutlineMode = "lesson" | "test";

export const outlineDraftKey = "draft";

export type OutlineSectionData = {
	title: string;
	kind: LectureExerciseKind;
	part?: "1" | "5";
	questions: LectureQuestionInsert[];
};

export type SectionMeta = {
	title: string;
	kind: LectureExerciseKind;
	part?: "1" | "5";
};

export type OutlineOpen =
	| { mode: "none" }
	| { mode: "draft-section"; meta: SectionMeta }
	| {
			mode: "section";
			key: string;
			meta: SectionMeta;
			metaSnapshot: SectionMeta;
			questionIndex: number | null;
			question: LectureQuestionInsert | null;
			questionSnapshot: LectureQuestionInsert | null;
			questionIsNew: boolean;
	  };

export function readOutlineSections(
	mode: OutlineMode,
	questions: LectureQuestionInsert[],
): OutlineSectionData[] {
	if (mode === "test") return readTestGroups(questions);
	return readLessonGroups(questions);
}

export function writeOutlineSections(
	mode: OutlineMode,
	sections: OutlineSectionData[],
): LectureQuestionInsert[] {
	return writeLectureSections(
		sections.map((section) => ({
			title: section.title,
			part:
				mode === "test" ? (section.part === "1" ? "1" : "5") : undefined,
			questions: section.questions.map((question) => ({
				...question,
				kind: mode === "lesson" ? section.kind : "multiple_choice",
			})),
		})),
	);
}

/** True when one stored section number contains more than one learner group. */
export function lessonGroupsDiverge(questions: LectureQuestionInsert[]): boolean {
	if (questions.length === 0) return false;
	const stored = new Set(questions.map((question) => lectureQuestionSection(question)));
	return readLessonGroups(questions).length !== stored.size;
}

export function emptyOutlineQuestion(
	kind: LectureExerciseKind,
): LectureQuestionInsert {
	const question = emptyLectureQuestion(1);
	if (kind === "multiple_choice") return question;
	return { ...question, kind, options: [], correctOptionId: null };
}

export function questionIsSavable(
	question: LectureQuestionInsert,
	part?: "1" | "5",
): boolean {
	if (part === "1") return Boolean(question.payload.bankQuestionId);
	if (question.kind !== "multiple_choice") return true;
	if (!question.stem.trim()) return false;
	if (!question.correctOptionId) return false;
	if (question.options.length < 4) return false;
	return question.options.every((option) => option.text.trim().length > 0);
}

export function questionHasContent(question: LectureQuestionInsert): boolean {
	if (question.stem.trim()) return true;
	if (question.payload.bankQuestionId) return true;
	if (question.payload.sentence.trim()) return true;
	if (question.payload.prompt.trim()) return true;
	if (question.options.some((option) => option.text.trim())) return true;
	if (question.payload.labels.some((label) => label.name.trim())) return true;
	if (question.answer.spans.length > 0) return true;
	if (question.answer.accepted.some((item) => item.trim())) return true;
	if (
		question.answer.blanks.some((blank) =>
			blank.accepted.some((item) => item.trim()),
		)
	) {
		return true;
	}
	return question.payload.parts.some(
		(part) => part.type === "text" && part.text.trim().length > 0,
	);
}

export function questionsEqual(
	left: LectureQuestionInsert,
	right: LectureQuestionInsert,
): boolean {
	const { sortOrder: leftOrder, ...leftRest } = left;
	const { sortOrder: rightOrder, ...rightRest } = right;
	void leftOrder;
	void rightOrder;
	return stable(leftRest) === stable(rightRest);
}

export function sameMeta(left: SectionMeta, right: SectionMeta): boolean {
	return (
		left.title === right.title &&
		left.kind === right.kind &&
		left.part === right.part
	);
}

function readLessonGroups(questions: LectureQuestionInsert[]): OutlineSectionData[] {
	const groups: Array<OutlineSectionData & { section: number }> = [];
	for (const question of questions) {
		const title = question.payload.groupTitle?.trim() ?? "";
		const section = lectureQuestionSection(question);
		const last = groups.at(-1);
		if (
			last &&
			last.kind === question.kind &&
			last.title === title &&
			last.section === section
		) {
			last.questions.push(question);
			continue;
		}
		groups.push({
			title,
			kind: question.kind,
			questions: [question],
			section,
		});
	}
	return groups.map((group) => ({
		title: group.title,
		kind: group.kind,
		questions: group.questions,
	}));
}

function readTestGroups(questions: LectureQuestionInsert[]): OutlineSectionData[] {
	return readLectureSections(
		questions.filter((question) => question.kind === "multiple_choice"),
	).map((section) => ({
		title: section.title,
		kind: "multiple_choice" as const,
		part: section.part === "1" ? "1" : "5",
		questions: section.questions,
	}));
}

function stable(value: unknown): string {
	return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(sortKeys);
	if (!value || typeof value !== "object") return value;
	return Object.fromEntries(
		Object.entries(value as Record<string, unknown>)
			.sort(([left], [right]) => left.localeCompare(right))
			.map(([key, item]) => [key, sortKeys(item)]),
	);
}
