import { extractJsonFromGeminiOutput } from "@/lib/admin/gemini/extract-json-from-output";
import { normalizeReadingPartProcessResponse } from "@/lib/admin/gemini/reading-part-process-response-schemas";
import { copy } from "@/lib/copy/vi";

const EXPLANATION_ANSWER_RE =
	/Đáp án\s+(?:đúng|phù hợp nhất)\s+là\s*(?:\*\*)?([A-D])(?:\*\*)?/i;

/**
 * Semantic QA only — answer letter / hint / explanation semantics vs export.
 * Shape/types/A–D are enforced by Gemini responseSchema
 * (READING_PART7_PROCESS_RESPONSE_SCHEMA); IDs are stamped from export in code.
 */
export type ReadingPart7ProcessQualificationCode =
	| "invalid_json"
	| "missing_set"
	| "missing_topic"
	| "missing_passage"
	| "missing_passage_translation"
	| "missing_question"
	| "missing_answer"
	| "invalid_answer"
	| "answer_key_mismatch"
	| "missing_explanation"
	| "explanation_answer_mismatch"
	| "missing_hint"
	| "hint_reveals_answer";

export interface ReadingPart7ProcessValidationIssue {
	code: ReadingPart7ProcessQualificationCode;
	questionId?: string;
	message: string;
}

interface ExportOption {
	label: string;
	text: string;
}

interface ExportQuestion {
	questionId: string;
	globalItemNumber?: number;
	options: ExportOption[];
}

interface ExportPassage {
	passageSlug: string;
}

interface ExportSet {
	questionId: string;
	passages: ExportPassage[];
	questions: ExportQuestion[];
}

interface ProcessQuestion {
	questionId?: unknown;
	correctOptionLabel?: unknown;
	hint?: unknown;
	explanation?: unknown;
}

interface ProcessPassage {
	passageSlug?: unknown;
	passageTranslation?: unknown;
	translations?: unknown;
}

interface ProcessSet {
	questionId?: unknown;
	topic?: unknown;
	passages?: unknown;
	questions?: unknown;
}

function parseJson(value: unknown): unknown {
	if (typeof value === "string") {
		return extractJsonFromGeminiOutput(value);
	}
	return value;
}

function asExportSets(parsed: unknown): ExportSet[] | null {
	const entries = Array.isArray(parsed) ? parsed : [parsed];
	const sets: ExportSet[] = [];

	for (const entry of entries) {
		if (!entry || typeof entry !== "object") return null;
		const record = entry as Record<string, unknown>;
		if (typeof record.questionId !== "string" || !record.questionId.trim()) {
			return null;
		}

		const passages = Array.isArray(record.passages) ? record.passages : [];
		const exportPassages: ExportPassage[] = [];
		for (const passage of passages) {
			if (!passage || typeof passage !== "object") return null;
			const slug = (passage as { passageSlug?: unknown }).passageSlug;
			if (typeof slug !== "string" || !slug.trim()) return null;
			exportPassages.push({ passageSlug: slug.trim() });
		}

		const questions = Array.isArray(record.questions) ? record.questions : [];
		const exportQuestions: ExportQuestion[] = [];
		for (const question of questions) {
			if (!question || typeof question !== "object") return null;
			const q = question as {
				questionId?: unknown;
				globalItemNumber?: unknown;
				options?: unknown;
			};
			if (typeof q.questionId !== "string" || !q.questionId.trim()) return null;

			const options = Array.isArray(q.options) ? q.options : [];
			const exportOptions: ExportOption[] = [];
			for (const option of options) {
				if (!option || typeof option !== "object") return null;
				const label = (option as { label?: unknown }).label;
				const text = (option as { text?: unknown }).text;
				if (typeof label !== "string" || typeof text !== "string") return null;
				exportOptions.push({ label: label.trim().toUpperCase(), text });
			}

			exportQuestions.push({
				questionId: q.questionId.trim(),
				globalItemNumber:
					typeof q.globalItemNumber === "number"
						? q.globalItemNumber
						: undefined,
				options: exportOptions,
			});
		}

		sets.push({
			questionId: record.questionId.trim(),
			passages: exportPassages,
			questions: exportQuestions,
		});
	}

	return sets;
}

/** Normalize Gemini process JSON into a flat array of set objects. */
export function asProcessSets(parsed: unknown): ProcessSet[] | null {
	try {
		const sets = normalizeReadingPartProcessResponse(parsed);
		if (
			sets.length === 0 ||
			!sets.every((entry) => entry && typeof entry === "object")
		) {
			return null;
		}
		return sets as ProcessSet[];
	} catch {
		return null;
	}
}

function processSetQuestionId(set: ProcessSet): string | null {
	if (typeof set.questionId !== "string") return null;
	const trimmed = set.questionId.trim();
	return trimmed.length > 0 ? trimmed : null;
}

function explanationAnswerLabel(explanation: unknown): string | null {
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

function hasNonEmptyTranslations(translations: unknown): boolean {
	if (!Array.isArray(translations) || translations.length === 0) return false;
	return translations.every((row) => {
		if (!row || typeof row !== "object") return false;
		const english = (row as { english?: unknown }).english;
		const vietnamese = (row as { vietnamese?: unknown }).vietnamese;
		return (
			typeof english === "string" &&
			english.trim().length > 0 &&
			typeof vietnamese === "string" &&
			vietnamese.trim().length > 0
		);
	});
}

/**
 * Semantic QA against the export payload after structured-output parsing.
 * Does not re-validate A–D shape (schema owns those).
 */
export function assessReadingPart7Process(
	processParsed: unknown,
	exportSource: unknown,
	expectedKeys?: Map<number, string>,
	_exportSetForStamp?: unknown,
): ReadingPart7ProcessValidationIssue[] {
	const issues: ReadingPart7ProcessValidationIssue[] = [];

	let exportParsed: unknown;
	let processValue: unknown;
	try {
		exportParsed = parseJson(exportSource);
		processValue = parseJson(processParsed);
	} catch {
		issues.push({
			code: "invalid_json",
			message: copy.admin.exams.create.readingPart7ProcessInvalidJson,
		});
		return issues;
	}

	const exportSets = asExportSets(exportParsed);
	const processSets = asProcessSets(processValue);

	if (!exportSets || !processSets) {
		issues.push({
			code: "invalid_json",
			message: copy.admin.exams.create.readingPart7ProcessInvalidJson,
		});
		return issues;
	}

	const processBySetId = new Map<string, ProcessSet>();
	for (const set of processSets) {
		const setId = processSetQuestionId(set);
		if (setId) {
			processBySetId.set(setId, set);
		}
	}

	for (const exportSet of exportSets) {
		const processSet = processBySetId.get(exportSet.questionId);
		if (!processSet) {
			issues.push({
				code: "missing_set",
				questionId: exportSet.questionId,
				message: copy.admin.exams.create.readingPart7ProcessMissingSet(
					exportSet.questionId,
				),
			});
			continue;
		}

		const topic =
			typeof processSet.topic === "string" ? processSet.topic.trim() : "";
		if (!topic) {
			issues.push({
				code: "missing_topic",
				questionId: exportSet.questionId,
				message: copy.admin.exams.create.readingPart7ProcessMissingTopic(
					exportSet.questionId,
				),
			});
		}

		const processPassages = Array.isArray(processSet.passages)
			? (processSet.passages as ProcessPassage[])
			: [];
		const processPassageBySlug = new Map<string, ProcessPassage>();
		for (const passage of processPassages) {
			if (typeof passage.passageSlug === "string" && passage.passageSlug.trim()) {
				processPassageBySlug.set(passage.passageSlug.trim(), passage);
			}
		}

		for (const exportPassage of exportSet.passages) {
			const processPassage = processPassageBySlug.get(
				exportPassage.passageSlug,
			);
			if (!processPassage) {
				issues.push({
					code: "missing_passage",
					questionId: exportSet.questionId,
					message: copy.admin.exams.create.readingPart7ProcessMissingPassage(
						exportSet.questionId,
						exportPassage.passageSlug,
					),
				});
				continue;
			}

			const passageTranslation =
				typeof processPassage.passageTranslation === "string"
					? processPassage.passageTranslation.trim()
					: "";
			if (
				!passageTranslation ||
				!hasNonEmptyTranslations(processPassage.translations)
			) {
				issues.push({
					code: "missing_passage_translation",
					questionId: exportSet.questionId,
					message:
						copy.admin.exams.create.readingPart7ProcessMissingPassageTranslation(
							exportSet.questionId,
							exportPassage.passageSlug,
						),
				});
			}
		}

		const processQuestions = Array.isArray(processSet.questions)
			? (processSet.questions as ProcessQuestion[])
			: [];
		const processQuestionById = new Map<string, ProcessQuestion>();
		for (const question of processQuestions) {
			if (typeof question.questionId === "string" && question.questionId.trim()) {
				processQuestionById.set(question.questionId.trim(), question);
			}
		}

		for (const exportQuestion of exportSet.questions) {
			const processQuestion = processQuestionById.get(
				exportQuestion.questionId,
			);
			if (!processQuestion) {
				issues.push({
					code: "missing_question",
					questionId: exportQuestion.questionId,
					message: copy.admin.exams.create.readingPart7ProcessMissingQuestion(
						exportQuestion.questionId,
					),
				});
				continue;
			}

			const answerLabel = processQuestion.correctOptionLabel;
			if (typeof answerLabel !== "string" || !answerLabel.trim()) {
				issues.push({
					code: "missing_answer",
					questionId: exportQuestion.questionId,
					message: copy.admin.exams.create.readingPart7ProcessMissingAnswer(
						exportQuestion.questionId,
					),
				});
				continue;
			}

			const normalizedAnswer = answerLabel.trim().toUpperCase();
			const optionLabels = new Set(
				exportQuestion.options.map((option) => option.label),
			);
			if (optionLabels.size > 0 && !optionLabels.has(normalizedAnswer)) {
				issues.push({
					code: "invalid_answer",
					questionId: exportQuestion.questionId,
					message: copy.admin.exams.create.readingPart7ProcessInvalidAnswer(
						exportQuestion.questionId,
						answerLabel,
					),
				});
				continue;
			}

			if (
				expectedKeys &&
				exportQuestion.globalItemNumber != null &&
				expectedKeys.has(exportQuestion.globalItemNumber)
			) {
				const expected = expectedKeys.get(exportQuestion.globalItemNumber);
				if (expected && expected !== normalizedAnswer) {
					issues.push({
						code: "answer_key_mismatch",
						questionId: exportQuestion.questionId,
						message: copy.admin.answerKey.errors.processMismatchAgainstKey(
							exportQuestion.globalItemNumber,
							expected,
							normalizedAnswer,
						),
					});
				}
			}

			const explanation = processQuestion.explanation;
			const reasoning =
				explanation &&
				typeof explanation === "object" &&
				typeof (explanation as { reasoning?: unknown }).reasoning === "string"
					? (explanation as { reasoning: string }).reasoning.trim()
					: "";
			const references =
				explanation &&
				typeof explanation === "object" &&
				Array.isArray((explanation as { reference?: unknown }).reference)
					? (explanation as { reference: unknown[] }).reference.filter(
							(entry) => typeof entry === "string" && entry.trim().length > 0,
						)
					: [];

			if (!reasoning || references.length === 0) {
				issues.push({
					code: "missing_explanation",
					questionId: exportQuestion.questionId,
					message:
						copy.admin.exams.create.readingPart7ProcessMissingExplanation(
							exportQuestion.questionId,
						),
				});
			} else {
				const explanationLabel = explanationAnswerLabel(explanation);
				if (!explanationLabel) {
					issues.push({
						code: "explanation_answer_mismatch",
						questionId: exportQuestion.questionId,
						message:
							copy.admin.exams.create.readingPart7ProcessMissingExplanationAnswer(
								exportQuestion.questionId,
							),
					});
				} else if (explanationLabel !== normalizedAnswer) {
					issues.push({
						code: "explanation_answer_mismatch",
						questionId: exportQuestion.questionId,
						message:
							copy.admin.exams.create.readingPart7ProcessExplanationMismatch(
								exportQuestion.questionId,
								normalizedAnswer,
								explanationLabel,
							),
					});
				}
			}

			const hint =
				typeof processQuestion.hint === "string"
					? processQuestion.hint.trim()
					: "";
			if (!hint) {
				issues.push({
					code: "missing_hint",
					questionId: exportQuestion.questionId,
					message: copy.admin.exams.create.readingPart7ProcessMissingHint(
						exportQuestion.questionId,
					),
				});
			} else if (hintRevealsAnswer(hint, normalizedAnswer)) {
				issues.push({
					code: "hint_reveals_answer",
					questionId: exportQuestion.questionId,
					message:
						copy.admin.exams.create.readingPart7ProcessHintRevealsAnswer(
							exportQuestion.questionId,
							normalizedAnswer,
						),
				});
			}
		}
	}

	return issues;
}

export function isQualifiedReadingPart7Process(
	processParsed: unknown,
	exportSource: unknown,
): boolean {
	return assessReadingPart7Process(processParsed, exportSource).length === 0;
}

export function readingPart7ProcessNotQualifiedMessage(
	issueCount: number,
	preview: string,
): string {
	return copy.admin.exams.create.readingPart7ProcessNotQualified(
		issueCount,
		preview,
	);
}

export function assertQualifiedReadingPart7Process(
	processParsed: unknown,
	exportSource: unknown,
	expectedKeys?: Map<number, string>,
	exportSetForStamp?: unknown,
): void {
	const issues = assessReadingPart7Process(
		processParsed,
		exportSource,
		expectedKeys,
		exportSetForStamp,
	);
	if (issues.length === 0) return;

	const preview = issues
		.slice(0, 3)
		.map((issue) => issue.message)
		.join(" ");

	throw new Error(readingPart7ProcessNotQualifiedMessage(issues.length, preview));
}
