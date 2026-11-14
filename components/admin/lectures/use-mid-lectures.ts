"use client";

import { useEffect, useRef, useState } from "react";
import {
	emptyOutlineQuestion,
	questionHasContent,
	questionIsSavable,
	questionWithKind,
	questionsEqual,
	readOutlineSections,
	writeOutlineSections,
	type OutlineSectionData,
} from "@/components/admin/lectures/lecture-outline";
import { copy } from "@/lib/copy/vi";
import type { LectureExerciseKind } from "@/lib/lectures/exercise";
import type { LectureQuestionInsert } from "@/lib/lectures/options";

export type MidQuestionDraft = {
	key: string;
	index: number | null;
	question: LectureQuestionInsert;
	snapshot: LectureQuestionInsert;
};

export function useMidLectures({
	questions,
	onChange,
	onPendingChange,
}: {
	questions: LectureQuestionInsert[];
	onChange: (questions: LectureQuestionInsert[]) => void;
	onPendingChange?: (pending: boolean) => void;
}) {
	const [sections, setSections] = useState(() =>
		readOutlineSections("lesson", questions),
	);
	const [keys, setKeys] = useState(() => freshKeys(sections));
	const [drawerKey, setDrawerKey] = useState<string | null>(null);
	const [draft, setDraft] = useState<MidQuestionDraft | null>(null);
	const [notice, setNotice] = useState<string | null>(null);
	const lastWritten = useRef(JSON.stringify(questions));
	const questionsRef = useRef(questions);
	const sectionsRef = useRef(sections);
	const keysRef = useRef(keys);
	const draftRef = useRef(draft);
	const onChangeRef = useRef(onChange);
	const serialized = JSON.stringify(questions);
	const dialogOpen = draft != null;
	const fields = copy.admin.lectures.fields;

	useEffect(() => {
		questionsRef.current = questions;
		sectionsRef.current = sections;
		keysRef.current = keys;
		draftRef.current = draft;
		onChangeRef.current = onChange;
	}, [questions, sections, keys, draft, onChange]);

	function commit(nextSections: OutlineSectionData[], nextKeys: string[]) {
		const written = writeOutlineSections("lesson", nextSections);
		lastWritten.current = JSON.stringify(written);
		sectionsRef.current = nextSections;
		keysRef.current = nextKeys;
		setSections(nextSections);
		setKeys(nextKeys);
		onChangeRef.current(written);
	}

	useEffect(() => {
		if (serialized === lastWritten.current) return;
		lastWritten.current = serialized;
		const next = readOutlineSections("lesson", questionsRef.current);
		const nextKeys = freshKeys(next);
		sectionsRef.current = next;
		keysRef.current = nextKeys;
		setSections(next);
		setKeys(nextKeys);
		setDrawerKey(null);
		setDraft(null);
		setNotice(null);
	}, [serialized]);

	useEffect(() => {
		onPendingChange?.(dialogOpen);
		return () => onPendingChange?.(false);
	}, [onPendingChange, dialogOpen]);

	function saveQuestion() {
		const current = draftRef.current;
		if (!current) return true;
		const sectionIndex = keysRef.current.indexOf(current.key);
		const section = sectionsRef.current[sectionIndex];
		if (!section) return false;
		const question = { ...current.question, kind: section.kind };
		if (!questionIsSavable(question)) {
			setNotice(fields.questionIncomplete);
			return false;
		}
		const nextQuestions =
			current.index == null
				? [...section.questions, question]
				: section.questions.map((item, index) =>
						index === current.index ? question : item,
					);
		commit(
			sectionsRef.current.map((item, index) =>
				index === sectionIndex ? { ...item, questions: nextQuestions } : item,
			),
			keysRef.current,
		);
		draftRef.current = null;
		setDraft(null);
		setNotice(null);
		return true;
	}

	function requestLeave(next: () => void) {
		const current = draftRef.current;
		if (!current) {
			next();
			return;
		}
		const changed = !questionsEqual(current.question, current.snapshot);
		if (!changed) {
			draftRef.current = null;
			setDraft(null);
			setNotice(null);
			next();
			return;
		}
		if (!window.confirm(fields.unsavedChoice)) {
			draftRef.current = null;
			setDraft(null);
			setNotice(null);
			next();
			return;
		}
		if (!saveQuestion()) return;
		next();
	}

	function updateSection(
		key: string,
		patch: (section: OutlineSectionData) => OutlineSectionData,
	) {
		const index = keysRef.current.indexOf(key);
		if (index < 0) return;
		commit(
			sectionsRef.current.map((section, sectionIndex) =>
				sectionIndex === index ? patch(section) : section,
			),
			keysRef.current,
		);
	}

	return {
		sections,
		keys,
		drawerKey,
		draft,
		notice,
		openDrawer(key: string) {
			if (drawerKey === key && !draftRef.current) return;
			requestLeave(() => setDrawerKey(key));
		},
		closeDrawer() {
			requestLeave(() => setDrawerKey(null));
		},
		closeDialog() {
			requestLeave(() => {});
		},
		addSection() {
			requestLeave(() => {
				const key = crypto.randomUUID();
				commit(
					[
						...sectionsRef.current,
						{ title: "", kind: "multiple_choice", questions: [] },
					],
					[...keysRef.current, key],
				);
				setDrawerKey(key);
			});
		},
		removeSection(key: string) {
			const index = keysRef.current.indexOf(key);
			const section = sectionsRef.current[index];
			if (!section) return;
			if (!window.confirm(fields.deleteMidLectureConfirm(section.questions.length))) {
				return;
			}
			commit(
				sectionsRef.current.filter((_, sectionIndex) => sectionIndex !== index),
				keysRef.current.filter((_, sectionIndex) => sectionIndex !== index),
			);
			if (draftRef.current?.key === key) draftRef.current = null;
			setDraft((current) => (current?.key === key ? null : current));
			setDrawerKey((current) => (current === key ? null : current));
			setNotice(null);
		},
		setTitle(key: string, title: string) {
			updateSection(key, (section) => ({ ...section, title }));
		},
		setKind(key: string, kind: LectureExerciseKind) {
			const section = sectionsRef.current[keysRef.current.indexOf(key)];
			if (!section || section.kind === kind) return;
			const filled = section.questions.some(questionHasContent);
			if (filled && !window.confirm(fields.changeMidLectureKind)) return;
			updateSection(key, (current) => ({
				...current,
				kind,
				questions: current.questions.map((question) =>
					questionWithKind(question, kind),
				),
			}));
			setDraft((current) => {
				if (!current || current.key !== key) return current;
				return {
					...current,
					question: questionWithKind(current.question, kind),
					snapshot: questionWithKind(current.snapshot, kind),
				};
			});
		},
		openQuestion(key: string, index: number | null) {
			requestLeave(() => {
				const section = sectionsRef.current[keysRef.current.indexOf(key)];
				if (!section) return;
				const source =
					index == null
						? emptyOutlineQuestion(section.kind)
						: section.questions[index];
				if (!source) return;
				const question = questionWithKind(structuredClone(source), section.kind);
				setDraft({
					key,
					index,
					question,
					snapshot: structuredClone(question),
				});
				setNotice(null);
				setDrawerKey(key);
			});
		},
		patchQuestion(patch: Partial<LectureQuestionInsert>) {
			setNotice(null);
			setDraft((current) => {
				if (!current) return current;
				const section = sectionsRef.current[keysRef.current.indexOf(current.key)];
				return {
					...current,
					question: {
						...current.question,
						...patch,
						kind: section?.kind ?? current.question.kind,
					},
				};
			});
		},
		saveQuestion,
		discardQuestion() {
			draftRef.current = null;
			setDraft(null);
			setNotice(null);
		},
		removeQuestion() {
			const current = draftRef.current;
			if (!current || current.index == null) return;
			const sectionIndex = keysRef.current.indexOf(current.key);
			const section = sectionsRef.current[sectionIndex];
			if (!section) return;
			if (
				questionHasContent(current.question) &&
				!window.confirm(fields.deleteQuestionConfirm)
			) {
				return;
			}
			commit(
				sectionsRef.current.map((item, index) =>
					index === sectionIndex
						? {
								...item,
								questions: item.questions.filter(
									(_, questionIndex) => questionIndex !== current.index,
								),
							}
						: item,
				),
				keysRef.current,
			);
			draftRef.current = null;
			setDraft(null);
			setNotice(null);
		},
	};
}

function freshKeys(sections: OutlineSectionData[]): string[] {
	return sections.map(() => crypto.randomUUID());
}
