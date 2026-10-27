import type { LectureQuestionInsert } from "@/lib/lectures/options";
import {
	questionIsSavable,
	questionsEqual,
	sameMeta,
	type OutlineMode,
	type OutlineOpen,
	type OutlineSectionData,
	type SectionMeta,
} from "@/components/admin/lectures/lecture-outline";

export function openIsUnfinished(open: OutlineOpen): boolean {
	if (open.mode === "draft-section") return true;
	if (open.mode !== "section") return false;
	if (open.questionIsNew) return true;
	if (!sameMeta(open.meta, open.metaSnapshot)) return true;
	if (!open.question || !open.questionSnapshot) return false;
	return !questionsEqual(open.question, open.questionSnapshot);
}

export function questionTouched(open: OutlineOpen): boolean {
	if (open.mode !== "section" || !open.question) return false;
	if (open.questionIsNew || !open.questionSnapshot) return true;
	return !questionsEqual(open.question, open.questionSnapshot);
}

export function saveDisabled(open: OutlineOpen, mode: OutlineMode): boolean {
	if (!questionTouched(open) || open.mode !== "section" || !open.question) {
		return false;
	}
	const part = mode === "test" ? (open.meta.part === "1" ? "1" : "5") : undefined;
	return !questionIsSavable(open.question, part);
}

export function persistOutlineOpen(
	mode: OutlineMode,
	sections: OutlineSectionData[],
	keys: string[],
	open: OutlineOpen,
	newKey: string,
): PersistResult {
	if (open.mode === "none") {
		return {
			ok: true,
			sections,
			keys,
			sectionIndex: -1,
			questionIndex: null,
		};
	}
	if (open.mode === "draft-section") {
		const nextSections = [...sections, sectionFromMeta(mode, open.meta, [])];
		return {
			ok: true,
			sections: nextSections,
			keys: [...keys, newKey],
			sectionIndex: nextSections.length - 1,
			questionIndex: null,
		};
	}

	const sectionIndex = keys.indexOf(open.key);
	const existing = sections[sectionIndex];
	if (!existing) return { ok: false, reason: "incomplete" };

	let questions = existing.questions;
	let questionIndex = open.questionIndex;
	if (questionTouched(open) && open.question) {
		const part = mode === "test" ? (open.meta.part === "1" ? "1" : "5") : undefined;
		if (!questionIsSavable(open.question, part)) {
			return { ok: false, reason: "incomplete" };
		}
		const bankId = open.question.payload.bankQuestionId;
		const except = open.questionSnapshot?.payload.bankQuestionId;
		if (bankId && bankId !== except && bankIds(sections).has(bankId)) {
			return { ok: false, reason: "duplicate" };
		}
		if (open.questionIsNew) {
			questions = [...questions, open.question];
			questionIndex = questions.length - 1;
		} else if (open.questionIndex != null) {
			questions = questions.map((question, index) =>
				index === open.questionIndex ? open.question! : question,
			);
		}
	}

	const nextSections = sections.map((section, index) =>
		index === sectionIndex
			? sectionFromMeta(mode, open.meta, questions)
			: section,
	);
	return {
		ok: true,
		sections: nextSections,
		keys,
		sectionIndex,
		questionIndex,
	};
}

export type PersistResult =
	| {
			ok: true;
			sections: OutlineSectionData[];
			keys: string[];
			sectionIndex: number;
			questionIndex: number | null;
	  }
	| { ok: false; reason: "incomplete" | "duplicate" };

export function bankIds(sections: OutlineSectionData[]): Set<string> {
	const ids = new Set<string>();
	for (const section of sections) {
		for (const question of section.questions) {
			const id = question.payload.bankQuestionId;
			if (id) ids.add(id);
		}
	}
	return ids;
}

export function sectionFromMeta(
	mode: OutlineMode,
	meta: SectionMeta,
	questions: LectureQuestionInsert[],
): OutlineSectionData {
	return {
		title: meta.title,
		kind: mode === "lesson" ? meta.kind : "multiple_choice",
		part: mode === "test" ? (meta.part === "1" ? "1" : "5") : undefined,
		questions,
	};
}

export function metaFromSection(section: OutlineSectionData): SectionMeta {
	return { title: section.title, kind: section.kind, part: section.part };
}

export function openSaved(
	key: string,
	section: OutlineSectionData,
	questionIndex: number | null,
): OutlineOpen {
	const meta = metaFromSection(section);
	const question =
		questionIndex == null ? null : (section.questions[questionIndex] ?? null);
	return {
		mode: "section",
		key,
		meta: { ...meta },
		metaSnapshot: { ...meta },
		questionIndex: question ? questionIndex : null,
		question: question ? structuredClone(question) : null,
		questionSnapshot: question ? structuredClone(question) : null,
		questionIsNew: false,
	};
}

export function openFirst(
	sections: OutlineSectionData[],
	keys: string[],
): OutlineOpen {
	return openAt(sections, keys, 0);
}

export function openLast(
	sections: OutlineSectionData[],
	keys: string[],
): OutlineOpen {
	return openAt(sections, keys, sections.length - 1);
}

function openAt(
	sections: OutlineSectionData[],
	keys: string[],
	index: number,
): OutlineOpen {
	const section = sections[index];
	const key = keys[index];
	if (!section || !key) return { mode: "none" };
	return openSaved(key, section, section.questions.length > 0 ? 0 : null);
}
