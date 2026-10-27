/**
 * Gemini structured-output schemas for Part 6 translation + Part 7 process.
 *
 * Root is always an object (`sets` array) — Gemini does not accept a bare array
 * as responseSchema root. Callers unwrap to a plain array before import.
 *
 * Part 7 process omits questionId / passageSlug (stamped from export in code)
 * and omits skills / focus for this version.
 */

import {
	GEMINI_EXPLANATION_SCHEMA,
	GEMINI_OPTION_LABEL,
	GEMINI_VOCABULARY_SCHEMA,
	type GeminiJsonSchema,
} from "@/lib/admin/gemini/gemini-response-schema-shared";

const TRANSLATION_ROW_SCHEMA: GeminiJsonSchema = {
	type: "object",
	properties: {
		english: {
			type: "string",
			description: "Verbatim visible English from the source passage.",
		},
		vietnamese: {
			type: "string",
			description: "Natural Vietnamese translation for study hover popups.",
		},
	},
	required: ["english", "vietnamese"],
};

function part7ProcessPassageSchema(): GeminiJsonSchema {
	return {
		type: "object",
		properties: {
			passageTranslation: {
				type: "string",
				description:
					"Vietnamese HTML — same tag tree and classes as the English content; only visible text changes.",
			},
			translations: {
				type: "array",
				minItems: 1,
				items: TRANSLATION_ROW_SCHEMA,
				description:
					"Sentence-level bilingual rows for this passage only (reading order).",
			},
		},
		required: ["passageTranslation", "translations"],
	};
}

function part7ProcessQuestionSchema(): GeminiJsonSchema {
	return {
		type: "object",
		description: "Solved answer + study enrichment for one Part 7 question.",
		properties: {
			correctOptionLabel: GEMINI_OPTION_LABEL,
			hint: {
				type: "string",
				description:
					"Vietnamese hint — spoiler-free (must not reveal the answer letter).",
			},
			explanation: GEMINI_EXPLANATION_SCHEMA,
		},
		required: ["correctOptionLabel", "hint", "explanation"],
	};
}

function part7ProcessSetSchema(
	passageCount?: number,
	questionCount?: number,
): GeminiJsonSchema {
	const passages: GeminiJsonSchema = {
		type: "array",
		minItems: passageCount ?? 1,
		items: part7ProcessPassageSchema(),
	};
	if (passageCount != null) {
		passages.maxItems = passageCount;
	}

	const questions: GeminiJsonSchema = {
		type: "array",
		minItems: questionCount ?? 1,
		items: part7ProcessQuestionSchema(),
	};
	if (questionCount != null) {
		questions.maxItems = questionCount;
	}

	return {
		type: "object",
		properties: {
			topic: {
				type: "string",
				description:
					"Short English passage-set title (2–6 words), e.g. 'Building entrance notice'.",
			},
			vocabulary: GEMINI_VOCABULARY_SCHEMA,
			passages,
			questions,
		},
		required: ["topic", "vocabulary", "passages", "questions"],
	};
}

/** Part 7 process — translation + solve/enrich (IDs stamped from export after response). */
export const READING_PART7_PROCESS_RESPONSE_SCHEMA: GeminiJsonSchema = {
	type: "object",
	description:
		"Reading Part 7 process response. One entry in sets[] per export passage set.",
	properties: {
		sets: {
			type: "array",
			minItems: 1,
			maxItems: 1,
			items: part7ProcessSetSchema(),
			description: "Exactly one set object for this API call.",
		},
	},
	required: ["sets"],
};

/** Per-set schema with exact passage/question counts from the export. */
export function buildPart7ProcessResponseSchema(
	passageCount: number,
	questionCount: number,
): GeminiJsonSchema {
	return {
		type: "object",
		description:
			"Reading Part 7 process response for one export passage set.",
		properties: {
			sets: {
				type: "array",
				minItems: 1,
				maxItems: 1,
				items: part7ProcessSetSchema(passageCount, questionCount),
			},
		},
		required: ["sets"],
	};
}

function part6TranslationSetSchema(): GeminiJsonSchema {
	return {
		type: "object",
		properties: {
			questionId: {
				type: "string",
				description: "Anchor set slug — copy exactly from the export questionId.",
			},
			passageTranslation: {
				type: "string",
				description:
					"Vietnamese HTML fragment with cloze answers as <strong>[N] vi</strong>.",
			},
			translations: {
				type: "array",
				minItems: 1,
				items: TRANSLATION_ROW_SCHEMA,
			},
		},
		required: ["questionId", "passageTranslation", "translations"],
	};
}

/** Part 6 translation — HTML + hover rows per export passage set. */
export const READING_PART6_TRANSLATION_RESPONSE_SCHEMA: GeminiJsonSchema = {
	type: "object",
	description:
		"Reading Part 6 translation response. One entry in sets[] per export passage set.",
	properties: {
		sets: {
			type: "array",
			minItems: 1,
			items: part6TranslationSetSchema(),
		},
	},
	required: ["sets"],
};

export function readingPartProcessResponseSchema(
	part: 6 | 7,
): GeminiJsonSchema {
	return part === 7
		? READING_PART7_PROCESS_RESPONSE_SCHEMA
		: READING_PART6_TRANSLATION_RESPONSE_SCHEMA;
}

/**
 * Unwrap structured `{ sets: [...] }` (or legacy bare array / single object)
 * into the plain array import expects.
 */
export function normalizeReadingPartProcessResponse(
	parsed: unknown,
): unknown[] {
	if (Array.isArray(parsed)) {
		return parsed;
	}

	if (parsed && typeof parsed === "object") {
		const record = parsed as Record<string, unknown>;
		if (Array.isArray(record.sets)) {
			return record.sets;
		}
		if (Array.isArray(record.passageSets)) {
			return record.passageSets;
		}
		if (
			typeof record.questionId === "string" ||
			Array.isArray(record.passages) ||
			typeof record.passageTranslation === "string" ||
			typeof record.topic === "string"
		) {
			return [parsed];
		}
	}

	throw new Error("Gemini process response was not a sets array or object.");
}

interface ExportPassage {
	passageSlug?: unknown;
	title?: unknown;
	content?: unknown;
}

interface ExportQuestion {
	questionId?: unknown;
	globalItemNumber?: unknown;
	prompt?: unknown;
	options?: unknown;
}

interface ExportSet {
	questionId?: unknown;
	passages?: unknown;
	questions?: unknown;
}

/**
 * Slim export for the Gemini prompt — content only (no join-key IDs).
 */
export function slimPart7ExportSetForProcess(exportSet: unknown): unknown {
	if (!exportSet || typeof exportSet !== "object") {
		throw new Error("Export set must be an object.");
	}
	const set = exportSet as ExportSet;
	const passages = Array.isArray(set.passages) ? set.passages : [];
	const questions = Array.isArray(set.questions) ? set.questions : [];

	return {
		passages: passages.map((passage) => {
			const p = passage as ExportPassage;
			return {
				title: typeof p.title === "string" ? p.title : "",
				content: typeof p.content === "string" ? p.content : "",
			};
		}),
		questions: questions.map((question) => {
			const q = question as ExportQuestion;
			return {
				globalItemNumber: q.globalItemNumber,
				prompt: typeof q.prompt === "string" ? q.prompt : "",
				options: Array.isArray(q.options) ? q.options : [],
			};
		}),
	};
}

/**
 * Stamp questionId / passageSlug from the export onto Gemini process output
 * by array index (same length/order required).
 */
export function stampPart7ProcessIdsFromExport(
	processSets: unknown[],
	exportSet: unknown,
): unknown[] {
	if (!exportSet || typeof exportSet !== "object") {
		throw new Error("Export set must be an object for ID stamping.");
	}
	const exportRecord = exportSet as ExportSet;
	const exportPassages = Array.isArray(exportRecord.passages)
		? (exportRecord.passages as ExportPassage[])
		: [];
	const exportQuestions = Array.isArray(exportRecord.questions)
		? (exportRecord.questions as ExportQuestion[])
		: [];
	const setQuestionId =
		typeof exportRecord.questionId === "string"
			? exportRecord.questionId.trim()
			: "";

	if (!setQuestionId) {
		throw new Error("Export set is missing questionId.");
	}

	if (processSets.length === 0) {
		throw new Error("Process response has no sets to stamp.");
	}

	return processSets.map((processSet) => {
		if (!processSet || typeof processSet !== "object") {
			throw new Error("Process set must be an object.");
		}
		const set = processSet as Record<string, unknown>;
		const processPassages = Array.isArray(set.passages) ? set.passages : [];
		const processQuestions = Array.isArray(set.questions) ? set.questions : [];

		if (processPassages.length !== exportPassages.length) {
			throw new Error(
				`Process passage count ${processPassages.length} != export ${exportPassages.length}.`,
			);
		}
		if (processQuestions.length !== exportQuestions.length) {
			throw new Error(
				`Process question count ${processQuestions.length} != export ${exportQuestions.length}.`,
			);
		}

		return {
			...set,
			questionId: setQuestionId,
			passages: processPassages.map((passage, index) => {
				const slug = exportPassages[index]?.passageSlug;
				if (typeof slug !== "string" || !slug.trim()) {
					throw new Error(`Export passage ${index} is missing passageSlug.`);
				}
				return {
					...(passage && typeof passage === "object" ? passage : {}),
					passageSlug: slug.trim(),
				};
			}),
			questions: processQuestions.map((question, index) => {
				const questionId = exportQuestions[index]?.questionId;
				if (typeof questionId !== "string" || !questionId.trim()) {
					throw new Error(`Export question ${index} is missing questionId.`);
				}
				return {
					...(question && typeof question === "object" ? question : {}),
					questionId: questionId.trim(),
				};
			}),
		};
	});
}
