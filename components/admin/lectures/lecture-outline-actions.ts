"use client";

import type { Dispatch, SetStateAction } from "react";
import { emptyOutlineQuestion, outlineDraftKey, questionHasContent } from "@/components/admin/lectures/lecture-outline";
import type {
	OutlineMode,
	OutlineOpen,
	OutlineSectionData,
	SectionMeta,
} from "@/components/admin/lectures/lecture-outline";
import {
	bankIds,
	metaFromSection,
	openIsUnfinished,
	openLast,
	openSaved,
	persistOutlineOpen,
} from "@/components/admin/lectures/lecture-outline-session";
import { copy } from "@/lib/copy/vi";
import type { LectureExerciseKind } from "@/lib/lectures/exercise";
import type { LectureQuestionInsert } from "@/lib/lectures/options";

type Notice = string | null;
type Focus = "section" | "question" | null;

export function createOutlineActions(deps: {
	mode: OutlineMode;
	kindLocked: boolean;
	sectionsRef: { current: OutlineSectionData[] };
	keysRef: { current: string[] };
	openRef: { current: OutlineOpen };
	setOpen: Dispatch<SetStateAction<OutlineOpen>>;
	setFocus: Dispatch<SetStateAction<Focus>>;
	setNotice: Dispatch<SetStateAction<Notice>>;
	commit: (sections: OutlineSectionData[], keys: string[]) => void;
}) {
	const {
		mode,
		kindLocked,
		sectionsRef,
		keysRef,
		openRef,
		setOpen,
		setFocus,
		setNotice,
		commit,
	} = deps;
	const fields = copy.admin.lectures.fields;

	function applyPersist(result: ReturnType<typeof persistOutlineOpen>) {
		if (!result.ok) {
			setNotice(
				result.reason === "duplicate"
					? fields.practiceAdded
					: fields.questionIncomplete,
			);
			return null;
		}
		commit(result.sections, result.keys);
		setNotice(null);
		return result;
	}

	function persistCurrent() {
		return applyPersist(
			persistOutlineOpen(
				mode,
				sectionsRef.current,
				keysRef.current,
				openRef.current,
				crypto.randomUUID(),
			),
		);
	}

	function gate(next: (base: { sections: OutlineSectionData[]; keys: string[] }) => void) {
		if (!openIsUnfinished(openRef.current)) {
			next({ sections: sectionsRef.current, keys: keysRef.current });
			return;
		}
		const saveFirst = window.confirm(fields.unsavedChoice);
		if (!saveFirst) {
			setNotice(null);
			next({ sections: sectionsRef.current, keys: keysRef.current });
			return;
		}
		const saved = persistCurrent();
		if (!saved) return;
		next(saved);
	}

	function beginQuestion(key: string, section: OutlineSectionData) {
		const meta = metaFromSection(section);
		setOpen({
			mode: "section",
			key,
			meta: { ...meta },
			metaSnapshot: { ...meta },
			questionIndex: null,
			question: emptyOutlineQuestion(
				mode === "test" ? "multiple_choice" : section.kind,
			),
			questionSnapshot: null,
			questionIsNew: true,
		});
		setFocus("question");
		setNotice(null);
	}

	function addSection() {
		gate(() => {
			setOpen({
				mode: "draft-section",
				meta: {
					title: "",
					kind: "multiple_choice",
					part: mode === "test" ? "5" : undefined,
				},
			});
			setFocus("section");
			setNotice(null);
		});
	}

	function addQuestion(key: string) {
		if (key === outlineDraftKey) {
			const saved = persistCurrent();
			if (!saved) return;
			const savedKey = saved.keys[saved.sectionIndex];
			const section = saved.sections[saved.sectionIndex];
			if (!savedKey || !section) return;
			beginQuestion(savedKey, section);
			return;
		}
		gate((base) => {
			const section = base.sections[base.keys.indexOf(key)];
			if (!section) return;
			beginQuestion(key, section);
		});
	}

	function selectSection(key: string) {
		if (openRef.current.mode === "section" && openRef.current.key === key) return;
		gate((base) => {
			const section = base.sections[base.keys.indexOf(key)];
			if (!section) return;
			setOpen(openSaved(key, section, section.questions.length > 0 ? 0 : null));
			setNotice(null);
		});
	}

	function selectQuestion(key: string, questionIndex: number) {
		const current = openRef.current;
		if (
			current.mode === "section" &&
			current.key === key &&
			!current.questionIsNew &&
			current.questionIndex === questionIndex
		) {
			return;
		}
		gate((base) => {
			const section = base.sections[base.keys.indexOf(key)];
			if (!section) return;
			setOpen(openSaved(key, section, questionIndex));
			setNotice(null);
		});
	}

	function discard() {
		const current = openRef.current;
		setNotice(null);
		if (current.mode === "draft-section") {
			setOpen(openLast(sectionsRef.current, keysRef.current));
			return;
		}
		if (current.mode !== "section") return;
		const section = sectionsRef.current[keysRef.current.indexOf(current.key)];
		if (!section) return;
		if (current.questionIsNew) {
			const last = section.questions.length - 1;
			setOpen(openSaved(current.key, section, last >= 0 ? last : null));
			return;
		}
		setOpen({
			...current,
			meta: { ...current.metaSnapshot },
			question: current.questionSnapshot
				? structuredClone(current.questionSnapshot)
				: null,
		});
	}

	function save() {
		const current = openRef.current;
		const saved = persistCurrent();
		if (!saved || saved.sectionIndex < 0) return;
		const section = saved.sections[saved.sectionIndex];
		const key = saved.keys[saved.sectionIndex];
		if (!section || !key) return;
		if (current.mode !== "section" || !current.question) {
			setOpen(openSaved(key, section, null));
			return;
		}
		setOpen(
			openSaved(
				key,
				section,
				saved.questionIndex != null && section.questions[saved.questionIndex]
					? saved.questionIndex
					: null,
			),
		);
	}

	function removeQuestion() {
		const current = openRef.current;
		if (current.mode !== "section" || current.questionIsNew || current.questionIndex == null) {
			return;
		}
		const index = keysRef.current.indexOf(current.key);
		const section = sectionsRef.current[index];
		const question = section?.questions[current.questionIndex];
		if (!section || !question) return;
		const visible = current.question ?? question;
		if (questionHasContent(visible) && !window.confirm(fields.deleteQuestionConfirm)) {
			return;
		}
		const questions = section.questions.filter(
			(_, questionIndex) => questionIndex !== current.questionIndex,
		);
		const nextSections = sectionsRef.current.map((item, itemIndex) =>
			itemIndex === index ? { ...item, questions } : item,
		);
		commit(nextSections, keysRef.current);
		const next = nextSections[index];
		if (!next) return;
		const neighbor = Math.min(current.questionIndex, next.questions.length - 1);
		setOpen(openSaved(current.key, next, neighbor >= 0 ? neighbor : null));
		setNotice(null);
	}

	function removeSection(key: string) {
		const index = keysRef.current.indexOf(key);
		const section = sectionsRef.current[index];
		if (!section) return;
		if (!window.confirm(fields.deleteSectionConfirm(section.questions.length))) return;
		const nextSections = sectionsRef.current.filter((_, itemIndex) => itemIndex !== index);
		const nextKeys = keysRef.current.filter((_, itemIndex) => itemIndex !== index);
		commit(nextSections, nextKeys);
		const neighbor = Math.min(index, nextSections.length - 1);
		const next = nextSections[neighbor];
		const nextKey = nextKeys[neighbor];
		setOpen(
			next && nextKey
				? openSaved(nextKey, next, next.questions.length > 0 ? 0 : null)
				: { mode: "none" },
		);
		setNotice(null);
	}

	function patchMeta(patch: Partial<SectionMeta>) {
		setNotice(null);
		setOpen((current) => {
			if (current.mode === "draft-section") {
				return { ...current, meta: { ...current.meta, ...patch } };
			}
			if (current.mode !== "section") return current;
			return { ...current, meta: { ...current.meta, ...patch } };
		});
	}

	function patchQuestion(patch: Partial<LectureQuestionInsert>) {
		setNotice(null);
		setOpen((current) => {
			if (current.mode !== "section" || !current.question) return current;
			return {
				...current,
				question: { ...current.question, ...patch, kind: current.meta.kind },
			};
		});
	}

	function fillFromBank(question: LectureQuestionInsert) {
		const id = question.payload.bankQuestionId;
		const except =
			openRef.current.mode === "section"
				? openRef.current.questionSnapshot?.payload.bankQuestionId
				: undefined;
		if (id && id !== except && bankIds(sectionsRef.current).has(id)) return false;
		setNotice(null);
		setOpen((current) => {
			if (current.mode !== "section") return current;
			return { ...current, question: { ...question, kind: "multiple_choice" } };
		});
	}

	function setKind(kind: LectureExerciseKind) {
		if (kindLocked) return;
		setNotice(null);
		setOpen((current) => {
			if (current.mode === "draft-section") {
				return { ...current, meta: { ...current.meta, kind } };
			}
			if (current.mode !== "section") return current;
			return {
				...current,
				meta: { ...current.meta, kind },
				question: current.questionIsNew ? emptyOutlineQuestion(kind) : current.question,
			};
		});
	}

	function setPart(part: "1" | "5") {
		if (kindLocked) return;
		setNotice(null);
		setOpen((current) => {
			if (current.mode === "draft-section") {
				return { ...current, meta: { ...current.meta, part } };
			}
			if (current.mode !== "section") return current;
			return {
				...current,
				meta: { ...current.meta, part },
				question: current.questionIsNew
					? emptyOutlineQuestion("multiple_choice")
					: current.question,
			};
		});
	}

	return {
		addSection,
		addQuestion,
		selectSection,
		selectQuestion,
		discard,
		save,
		removeQuestion,
		removeSection,
		setTitle: (title: string) => patchMeta({ title }),
		setKind,
		setPart,
		patchQuestion,
		fillFromBank,
	};
}
