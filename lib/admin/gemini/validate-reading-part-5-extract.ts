import { READING_PART_OFFICIAL_SPEC } from "@/lib/content/reading-part-specs";
import { copy } from "@/lib/copy/vi";

/** Retries after a failed validation (first attempt is not a retry). */
export const READING_PART5_VALIDATION_MAX_RETRIES = 3;

/** Total Gemini calls for Part 5 extract when validation can fail. */
export const READING_PART5_VALIDATION_MAX_ATTEMPTS =
	1 + READING_PART5_VALIDATION_MAX_RETRIES;

const OPTION_LABELS = new Set(["A", "B", "C", "D"]);
const BLANK_MARKER = "-------";
const EXPLANATION_ANSWER_RE =
	/Đáp án phù hợp nhất là\s*(?:\*\*)?([A-D])(?:\*\*)?/i;

export type ReadingPart5QualificationCode =
	| "wrong_question_count"
	| "missing_answer"
	| "invalid_answer_label"
	| "explanation_answer_mismatch"
	| "hint_reveals_answer"
	| "missing_blank_marker"
	| "answer_key_mismatch";

export interface ReadingPart5ValidationIssue {
	code: ReadingPart5QualificationCode;
	questionNumber?: number;
	message: string;
}

interface QuestionLike {
	globalItemNumber?: unknown;
	prompt?: unknown;
	options?: unknown;
	correctOptionLabel?: unknown;
	hint?: unknown;
	explanation?: unknown;
}

function questionLabel(question: QuestionLike): number | undefined {
	return typeof question.globalItemNumber === "number"
		? question.globalItemNumber
		: undefined;
}

function asQuestions(parsed: unknown): QuestionLike[] | null {
	if (!parsed || typeof parsed !== "object") return null;

	const record = parsed as Record<string, unknown>;
	if (record.part !== 5) return null;

	const questions = record.questions;
	if (!Array.isArray(questions)) return null;

	return questions as QuestionLike[];
}

function optionLabels(question: QuestionLike): Set<string> {
	const labels = new Set<string>();
	if (!Array.isArray(question.options)) return labels;

	for (const option of question.options) {
		if (!option || typeof option !== "object") continue;
		const label = (option as { label?: unknown }).label;
		if (typeof label === "string") labels.add(label);
	}

	return labels;
}

function explanationAnswerLabel(question: QuestionLike): string | null {
	const explanation = question.explanation;
	if (!explanation || typeof explanation !== "object") return null;

	const reasoning = (explanation as { reasoning?: unknown }).reasoning;
	if (typeof reasoning !== "string") return null;

	const match = reasoning.match(EXPLANATION_ANSWER_RE);
	return match?.[1]?.toUpperCase() ?? null;
}

function hintRevealsAnswer(hint: string, answerLabel: string): boolean {
	const escaped = answerLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const patterns = [
		new RegExp(`đáp án\\s*(là\\s*)?${escaped}\\b`, "i"),
		new RegExp(`chọn\\s*\\*{0,2}${escaped}\\*{0,2}`, "i"),
		new RegExp(`→\\s*\\*{0,2}${escaped}\\*{0,2}`, "i"),
		new RegExp(`nhãn\\s*${escaped}\\b`, "i"),
		new RegExp(`option\\s*${escaped}\\b`, "i"),
	];

	return patterns.some((pattern) => pattern.test(hint));
}

/**
 * Five lightweight checks for a qualified Part 5 Gemini extract:
 * 1. Expected question count (30)
 * 2. Every question has a valid answer label present in options
 * 3. Explanation conclusion matches correctOptionLabel
 * 4. Hint does not reveal the answer label
 * 5. Prompt contains the blank marker (-------)
 */
export function assessReadingPart5Extract(
	parsed: unknown,
	expectedKeys?: Map<number, string>,
	options?: { skipOfficialQuestionCount?: boolean },
): ReadingPart5ValidationIssue[] {
	const issues: ReadingPart5ValidationIssue[] = [];
	const questions = asQuestions(parsed);
	const expectedQuestions = READING_PART_OFFICIAL_SPEC[5].questions;

	if (!questions) {
		issues.push({
			code: "wrong_question_count",
			message: copy.admin.exams.create.readingPart5InvalidJson,
		});
		return issues;
	}

	if (
		!options?.skipOfficialQuestionCount &&
		questions.length !== expectedQuestions
	) {
		issues.push({
			code: "wrong_question_count",
			message: copy.admin.exams.create.readingPart5QuestionCount(
				expectedQuestions,
				questions.length,
			),
		});
	}

	for (const question of questions) {
		const number = questionLabel(question);

		const prompt =
			typeof question.prompt === "string" ? question.prompt : "";
		if (!prompt.includes(BLANK_MARKER)) {
			issues.push({
				code: "missing_blank_marker",
				questionNumber: number,
				message:
					copy.admin.exams.create.readingPart5MissingBlank(number),
			});
		}

		const answerLabel = question.correctOptionLabel;
		if (typeof answerLabel !== "string" || !answerLabel.trim()) {
			issues.push({
				code: "missing_answer",
				questionNumber: number,
				message:
					copy.admin.exams.create.readingPart5MissingAnswer(number),
			});
			continue;
		}

		const normalizedAnswer = answerLabel.trim().toUpperCase();
		if (!OPTION_LABELS.has(normalizedAnswer)) {
			issues.push({
				code: "invalid_answer_label",
				questionNumber: number,
				message: copy.admin.exams.create.readingPart5InvalidAnswerLabel(
					number,
					answerLabel,
				),
			});
			continue;
		}

		if (expectedKeys && number != null) {
			const expected = expectedKeys.get(number);
			if (expected && expected !== normalizedAnswer) {
				issues.push({
					code: "answer_key_mismatch",
					questionNumber: number,
					message: copy.admin.answerKey.errors.processMismatchAgainstKey(
						number,
						expected,
						normalizedAnswer,
					),
				});
			}
		}

		const labels = optionLabels(question);
		if (!labels.has(normalizedAnswer)) {
			issues.push({
				code: "invalid_answer_label",
				questionNumber: number,
				message: copy.admin.exams.create.readingPart5AnswerNotInOptions(
					number,
					normalizedAnswer,
				),
			});
		}

		const explanationLabel = explanationAnswerLabel(question);
		if (!explanationLabel) {
			issues.push({
				code: "explanation_answer_mismatch",
				questionNumber: number,
				message:
					copy.admin.exams.create.readingPart5MissingExplanationAnswer(
						number,
					),
			});
		} else if (explanationLabel !== normalizedAnswer) {
			issues.push({
				code: "explanation_answer_mismatch",
				questionNumber: number,
				message:
					copy.admin.exams.create.readingPart5ExplanationMismatch(
						number,
						normalizedAnswer,
						explanationLabel,
					),
			});
		}

		const hint =
			typeof question.hint === "string" ? question.hint.trim() : "";
		if (hint && hintRevealsAnswer(hint, normalizedAnswer)) {
			issues.push({
				code: "hint_reveals_answer",
				questionNumber: number,
				message: copy.admin.exams.create.readingPart5HintRevealsAnswer(
					number,
					normalizedAnswer,
				),
			});
		}
	}

	return issues;
}

export function isQualifiedReadingPart5Extract(parsed: unknown): boolean {
	return assessReadingPart5Extract(parsed).length === 0;
}

export function readingPart5NotQualifiedMessage(
	issueCount: number,
	preview: string,
): string {
	return copy.admin.exams.create.readingPart5NotQualified(
		issueCount,
		preview,
	);
}

export function isReadingPart5ValidationError(message: string): boolean {
	return message.includes(
		copy.admin.exams.create.readingPart5NotQualifiedPrefix,
	);
}

export function assertQualifiedReadingPart5Extract(
	parsed: unknown,
	expectedKeys?: Map<number, string>,
	options?: { skipOfficialQuestionCount?: boolean },
): void {
	const issues = assessReadingPart5Extract(parsed, expectedKeys, options);
	if (issues.length === 0) return;

	const preview = issues
		.slice(0, 3)
		.map((issue) => issue.message)
		.join(" ");

	throw new Error(readingPart5NotQualifiedMessage(issues.length, preview));
}
