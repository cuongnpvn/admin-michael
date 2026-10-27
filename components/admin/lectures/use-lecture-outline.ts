"use client";

import { useEffect, useRef, useState } from "react";
import { createOutlineActions } from "@/components/admin/lectures/lecture-outline-actions";
import {
	lessonGroupsDiverge,
	outlineDraftKey,
	questionHasContent,
	readOutlineSections,
	writeOutlineSections,
	type OutlineMode,
	type OutlineOpen,
	type OutlineSectionData,
} from "@/components/admin/lectures/lecture-outline";
import {
	openFirst,
	openIsUnfinished,
	saveDisabled,
} from "@/components/admin/lectures/lecture-outline-session";
import type { LectureQuestionInsert } from "@/lib/lectures/options";

export { outlineDraftKey };

function freshKeys(sections: OutlineSectionData[]): string[] {
	return sections.map(() => crypto.randomUUID());
}

export function useLectureOutline({
	mode,
	questions,
	onChange,
	onPendingChange,
}: {
	mode: OutlineMode;
	questions: LectureQuestionInsert[];
	onChange: (questions: LectureQuestionInsert[]) => void;
	onPendingChange?: (pending: boolean) => void;
}) {
	const [sections, setSections] = useState(() => readOutlineSections(mode, questions));
	const [keys, setKeys] = useState(() => freshKeys(sections));
	const [open, setOpen] = useState<OutlineOpen>(() => openFirst(sections, keys));
	const [focus, setFocus] = useState<"section" | "question" | null>(null);
	const [notice, setNotice] = useState<string | null>(null);
	const lastWritten = useRef(JSON.stringify(questions));
	const questionsRef = useRef(questions);
	const sectionsRef = useRef(sections);
	const keysRef = useRef(keys);
	const openRef = useRef(open);
	const onChangeRef = useRef(onChange);
	questionsRef.current = questions;
	sectionsRef.current = sections;
	keysRef.current = keys;
	openRef.current = open;
	onChangeRef.current = onChange;
	const unfinished = openIsUnfinished(open);
	const serialized = JSON.stringify(questions);

	function commit(nextSections: OutlineSectionData[], nextKeys: string[]) {
		const written = writeOutlineSections(mode, nextSections);
		lastWritten.current = JSON.stringify(written);
		setSections(nextSections);
		setKeys(nextKeys);
		onChangeRef.current(written);
	}

	useEffect(() => {
		if (serialized === lastWritten.current) return;
		lastWritten.current = serialized;
		const next = readOutlineSections(mode, questionsRef.current);
		const nextKeys = freshKeys(next);
		setSections(next);
		setKeys(nextKeys);
		setOpen(openFirst(next, nextKeys));
		setNotice(null);
	}, [mode, serialized]);

	useEffect(() => {
		if (mode !== "lesson" || !lessonGroupsDiverge(questionsRef.current)) return;
		const next = readOutlineSections("lesson", questionsRef.current);
		const nextKeys =
			keysRef.current.length === next.length ? keysRef.current : freshKeys(next);
		commit(next, nextKeys);
		// Publish the learner grouping once so a later page save keeps the split.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mode]);

	useEffect(() => {
		onPendingChange?.(unfinished);
		return () => onPendingChange?.(false);
	}, [onPendingChange, unfinished]);

	const activeKey = open.mode === "section" ? open.key : null;
	const kindLocked =
		open.mode === "section" &&
		((sections[keys.indexOf(open.key)]?.questions.length ?? 0) > 0 ||
			(open.question != null && questionHasContent(open.question)));
	const actions = createOutlineActions({
		mode,
		kindLocked,
		sectionsRef,
		keysRef,
		openRef,
		setOpen,
		setFocus,
		setNotice,
		commit,
	});

	return {
		sections,
		keys,
		open,
		focus,
		notice,
		unfinished,
		activeKey,
		kindLocked,
		saveDisabled: saveDisabled(open, mode),
		clearFocus: () => setFocus(null),
		...actions,
	};
}

export type LectureOutlineController = ReturnType<typeof useLectureOutline>;
