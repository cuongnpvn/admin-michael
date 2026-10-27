import type { ReadingPart7SegmentSpec } from "@/lib/content/reading-part-7-segments";
import { countReadingPassageSetQuestions } from "@/lib/content/reading-part-specs";
import { copy } from "@/lib/copy/vi";

const REQUIRED_OPTION_LABELS = ["A", "B", "C", "D"] as const;

export type ReadingPart7ExtractQualificationCode =
	| "invalid_json"
	| "wrong_part"
	| "empty_sets"
	| "wrong_question_count"
	| "wrong_passage_count"
	| "empty_questions"
	| "missing_global"
	| "global_out_of_range"
	| "duplicate_global"
	| "missing_passage_title"
	| "missing_passage_content"
	| "missing_prompt"
	| "invalid_options";

export interface ReadingPart7ExtractValidationIssue {
	code: ReadingPart7ExtractQualificationCode;
	questionNumber?: number;
	message: string;
}

interface PassageLike {
	title?: unknown;
	content?: unknown;
}

interface OptionLike {
	label?: unknown;
	text?: unknown;
}

interface QuestionLike {
	globalItemNumber?: unknown;
	prompt?: unknown;
	options?: unknown;
}

interface PassageSetLike {
	passages?: unknown;
	questions?: unknown;
}

function asPassageSets(parsed: unknown): PassageSetLike[] | null {
	if (!parsed || typeof parsed !== "object") return null;

	const record = parsed as Record<string, unknown>;
	if (record.part !== 7) return null;

	const passageSets = record.passageSets;
	if (!Array.isArray(passageSets) || passageSets.length === 0) return null;

	return passageSets as PassageSetLike[];
}

function assessOptions(
	options: unknown,
	segmentId: string,
	globalItemNumber: number | undefined,
): ReadingPart7ExtractValidationIssue | null {
	if (!Array.isArray(options) || options.length !== 4) {
		return {
			code: "invalid_options",
			questionNumber: globalItemNumber,
			message: copy.admin.exams.create.readingPart7ExtractInvalidOptions(
				segmentId,
				globalItemNumber,
			),
		};
	}

	const seen = new Set<string>();
	for (const option of options as OptionLike[]) {
		if (!option || typeof option !== "object") {
			return {
				code: "invalid_options",
				questionNumber: globalItemNumber,
				message:
					copy.admin.exams.create.readingPart7ExtractInvalidOptions(
						segmentId,
						globalItemNumber,
					),
			};
		}

		const label =
			typeof option.label === "string"
				? option.label.trim().toUpperCase()
				: "";
		const text = typeof option.text === "string" ? option.text.trim() : "";

		if (
			!REQUIRED_OPTION_LABELS.includes(
				label as (typeof REQUIRED_OPTION_LABELS)[number],
			) ||
			seen.has(label) ||
			!text
		) {
			return {
				code: "invalid_options",
				questionNumber: globalItemNumber,
				message:
					copy.admin.exams.create.readingPart7ExtractInvalidOptions(
						segmentId,
						globalItemNumber,
					),
			};
		}
		seen.add(label);
	}

	for (const label of REQUIRED_OPTION_LABELS) {
		if (!seen.has(label)) {
			return {
				code: "invalid_options",
				questionNumber: globalItemNumber,
				message:
					copy.admin.exams.create.readingPart7ExtractInvalidOptions(
						segmentId,
						globalItemNumber,
					),
			};
		}
	}

	return null;
}

/**
 * QA for a Part 7 extract segment: structure + required OCR fields.
 * Extract must include passages (title/content) and questions (prompt + A–D options).
 */
export function assessReadingPart7ExtractSegment(
	parsed: unknown,
	spec: ReadingPart7SegmentSpec,
	options?: { skipOfficialQuestionNumberQa?: boolean },
): ReadingPart7ExtractValidationIssue[] {
	const issues: ReadingPart7ExtractValidationIssue[] = [];

	if (!parsed || typeof parsed !== "object") {
		issues.push({
			code: "invalid_json",
			message: copy.admin.exams.create.readingPart7SegmentInvalidJson,
		});
		return issues;
	}

	const record = parsed as Record<string, unknown>;
	if (record.part !== 7) {
		issues.push({
			code: "wrong_part",
			message: copy.admin.exams.create.readingPart7SegmentWrongPart,
		});
		return issues;
	}

	const passageSets = asPassageSets(parsed);
	if (!passageSets) {
		issues.push({
			code: "empty_sets",
			message: copy.admin.exams.create.readingPart7SegmentEmptySets,
		});
		return issues;
	}

	const { questions: questionCount } = countReadingPassageSetQuestions({
		passageSets: passageSets as { questions: unknown[] }[],
	});

	if (
		!options?.skipOfficialQuestionNumberQa &&
		questionCount !== spec.questions
	) {
		issues.push({
			code: "wrong_question_count",
			message: copy.admin.exams.create.readingPart7SegmentQuestionCount(
				spec.id,
				spec.questions,
				questionCount,
			),
		});
	}

	const globalNumbers = new Set<number>();

	for (const set of passageSets) {
		const passages = Array.isArray(set.passages)
			? (set.passages as PassageLike[])
			: [];
		const passageCount = passages.length;

		if (
			passageCount < spec.passagesPerSet.min ||
			passageCount > spec.passagesPerSet.max
		) {
			issues.push({
				code: "wrong_passage_count",
				message:
					copy.admin.exams.create.readingPart7SegmentPassageCount(
						spec.id,
						spec.passagesPerSet.min,
						spec.passagesPerSet.max,
						passageCount,
					),
			});
		}

		for (const passage of passages) {
			const title =
				typeof passage?.title === "string" ? passage.title.trim() : "";
			const content =
				typeof passage?.content === "string"
					? passage.content.trim()
					: "";

			if (!title) {
				issues.push({
					code: "missing_passage_title",
					message:
						copy.admin.exams.create.readingPart7ExtractMissingPassageTitle(
							spec.id,
						),
				});
			}
			if (!content) {
				issues.push({
					code: "missing_passage_content",
					message:
						copy.admin.exams.create.readingPart7ExtractMissingPassageContent(
							spec.id,
						),
				});
			}
		}

		const questions = Array.isArray(set.questions)
			? (set.questions as QuestionLike[])
			: [];

		if (questions.length === 0) {
			issues.push({
				code: "empty_questions",
				message:
					copy.admin.exams.create.readingPart7SegmentEmptyQuestions(
						spec.id,
					),
			});
			continue;
		}

		for (const question of questions) {
			const globalItemNumber =
				typeof question.globalItemNumber === "number"
					? question.globalItemNumber
					: undefined;

			if (globalItemNumber === undefined) {
				issues.push({
					code: "missing_global",
					message:
						copy.admin.exams.create.readingPart7SegmentMissingGlobal(
							spec.id,
						),
				});
				continue;
			}

			if (
				!options?.skipOfficialQuestionNumberQa &&
				(globalItemNumber < spec.globalFirst ||
					globalItemNumber > spec.globalLast)
			) {
				issues.push({
					code: "global_out_of_range",
					questionNumber: globalItemNumber,
					message:
						copy.admin.exams.create.readingPart7SegmentGlobalRange(
							spec.id,
							spec.globalFirst,
							spec.globalLast,
							globalItemNumber,
						),
				});
			}

			if (globalNumbers.has(globalItemNumber)) {
				issues.push({
					code: "duplicate_global",
					questionNumber: globalItemNumber,
					message:
						copy.admin.exams.create.readingPart7SegmentDuplicateGlobal(
							globalItemNumber,
						),
				});
			}
			globalNumbers.add(globalItemNumber);

			const prompt =
				typeof question.prompt === "string"
					? question.prompt.trim()
					: "";
			if (!prompt) {
				issues.push({
					code: "missing_prompt",
					questionNumber: globalItemNumber,
					message:
						copy.admin.exams.create.readingPart7ExtractMissingPrompt(
							spec.id,
							globalItemNumber,
						),
				});
			}

			const optionIssue = assessOptions(
				question.options,
				spec.id,
				globalItemNumber,
			);
			if (optionIssue) issues.push(optionIssue);
		}
	}

	return issues;
}

export function isQualifiedReadingPart7ExtractSegment(
	parsed: unknown,
	spec: ReadingPart7SegmentSpec,
): boolean {
	return assessReadingPart7ExtractSegment(parsed, spec).length === 0;
}

export function readingPart7ExtractNotQualifiedMessage(
	issueCount: number,
	preview: string,
): string {
	return copy.admin.exams.create.readingPart7ExtractNotQualified(
		issueCount,
		preview,
	);
}

export function assertQualifiedReadingPart7ExtractSegment(
	parsed: unknown,
	spec: ReadingPart7SegmentSpec,
	options?: { skipOfficialQuestionNumberQa?: boolean },
): void {
	const issues = assessReadingPart7ExtractSegment(parsed, spec, options);
	if (issues.length === 0) return;

	const preview = issues
		.slice(0, 3)
		.map((issue) => issue.message)
		.join(" ");

	throw new Error(
		readingPart7ExtractNotQualifiedMessage(issues.length, preview),
	);
}
