import { copy } from "@/lib/copy/vi";
import type {
	NotebookNoteSource,
	NotebookNoteSourceSection,
} from "@/lib/notebook/types";

export type NotebookSourceOverrides = Partial<
	Pick<
		NotebookNoteSource,
		| "bookId"
		| "testId"
		| "bookName"
		| "testLabel"
		| "section"
		| "part"
		| "setId"
		| "groupId"
		| "questionNumber"
	>
>;

function inferSectionFromPath(pathname: string): NotebookNoteSourceSection {
	if (pathname.startsWith("/reading")) return "reading";
	if (pathname.startsWith("/listening")) return "listening";
	if (pathname.startsWith("/vocab")) return "vocabulary";
	if (pathname.startsWith("/exam")) return "exam";
	return "other";
}

function buildSourceLabel(source: NotebookNoteSource): string {
	const parts: string[] = [];

	if (source.section === "reading") {
		parts.push(copy.reading.title);
	} else if (source.section === "listening") {
		parts.push(copy.listening.title);
	} else if (source.section === "vocabulary") {
		parts.push(copy.vocab.title);
	}

	if (source.part != null) {
		parts.push(`Part ${source.part}`);
	}

	if (source.questionNumber != null) {
		parts.push(`${copy.common.question} ${source.questionNumber}`);
	}

	if (parts.length === 0 && source.path) {
		return source.path;
	}

	return parts.join(" · ");
}

export function captureNotebookSource(
	overrides: NotebookSourceOverrides = {},
): NotebookNoteSource {
	if (typeof window === "undefined") {
		return { path: "", ...overrides };
	}

	const pathname = window.location.pathname;
	const search = window.location.search;
	const params = new URLSearchParams(search);

	const bookId = overrides.bookId ?? params.get("book") ?? undefined;
	const testId = overrides.testId ?? params.get("test") ?? undefined;
	const partParam = params.get("part");
	const part =
		overrides.part ??
		(partParam ? Number.parseInt(partParam, 10) : undefined);
	const setId = overrides.setId ?? params.get("set") ?? undefined;
	const groupId = overrides.groupId ?? params.get("group") ?? undefined;
	const section = overrides.section ?? inferSectionFromPath(pathname);

	const source: NotebookNoteSource = {
		path: `${pathname}${search}`,
		bookId,
		testId,
		section,
		part: Number.isFinite(part) ? part : undefined,
		setId,
		groupId,
		questionNumber: overrides.questionNumber,
	};

	source.label = buildSourceLabel(source);
	return source;
}

export function formatNotebookSourceReference(
	source: NotebookNoteSource,
): string | null {
	const parts: string[] = [];

	if (source.bookName || source.bookId) {
		parts.push(source.bookName ?? source.bookId!);
	}
	if (source.testLabel || source.testId) {
		parts.push(source.testLabel ?? source.testId!);
	}
	if (source.part != null) {
		parts.push(`Part ${String(source.part)}`);
	}
	if (source.questionNumber != null) {
		parts.push(String(source.questionNumber));
	}

	if (parts.length === 0) {
		return null;
	}

	return parts.join(" - ");
}
