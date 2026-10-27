import { extractJsonFromGeminiOutput } from "@/lib/admin/gemini/extract-json-from-output";
import {
	buildReadingPart7QaDebugJson,
	GeminiExtractDebugError,
} from "@/lib/admin/gemini/gemini-extract-debug-error";
import { normalizeGeminiExamPartTags } from "@/lib/admin/gemini/normalize-gemini-exam-part-tags";
import { assertQualifiedReadingPart7ExtractSegment } from "@/lib/admin/gemini/validate-reading-part-7-extract";
import { assertCreateExamReadingPartQuestionCount } from "@/lib/content/reading-part-specs";
import {
	READING_PART7_MULTI_SEGMENT,
	READING_PART7_SINGLE_SEGMENT,
	type ReadingPart7SegmentSpec,
} from "@/lib/content/reading-part-7-segments";
import { copy } from "@/lib/copy/vi";

const PART7_TITLE = "Reading Comprehension";

interface PassageSetLike {
	passages: unknown[];
	questions: Array<{
		globalItemNumber?: unknown;
	}>;
}

function parseSegmentJson(rawJson: string): unknown {
	const parsed = extractJsonFromGeminiOutput(rawJson);
	normalizeGeminiExamPartTags(parsed);
	return parsed;
}

function asPassageSets(parsed: unknown): PassageSetLike[] {
	if (!parsed || typeof parsed !== "object") {
		throw new Error(copy.admin.exams.create.readingPart7SegmentInvalidJson);
	}

	const record = parsed as Record<string, unknown>;
	if (record.part !== 7) {
		throw new Error(copy.admin.exams.create.readingPart7SegmentWrongPart);
	}

	const passageSets = record.passageSets;
	if (!Array.isArray(passageSets) || passageSets.length === 0) {
		throw new Error(copy.admin.exams.create.readingPart7SegmentEmptySets);
	}

	return passageSets as PassageSetLike[];
}

function validateSegment(
	parsed: unknown,
	spec: ReadingPart7SegmentSpec,
	options?: { skipOfficialQuestionNumberQa?: boolean },
): PassageSetLike[] {
	assertQualifiedReadingPart7ExtractSegment(parsed, spec, options);
	return asPassageSets(parsed);
}

function throwPart7QaError(
	message: string,
	failedSegment: "reading-part-7-single" | "reading-part-7-multi" | "merge",
	singleRawJson: string,
	multiRawJson: string,
): never {
	throw new GeminiExtractDebugError(
		message,
		buildReadingPart7QaDebugJson({
			error: message,
			failedSegment,
			singleRawJson,
			multiRawJson,
		}),
	);
}

export function mergeReadingPart7Extracts(
	singleRawJson: string,
	multiRawJson: string,
	options?: { skipOfficialQuestionNumberQa?: boolean },
): string {
	let singleParsed: unknown;
	try {
		singleParsed = parseSegmentJson(singleRawJson);
	} catch (error) {
		const message =
			error instanceof Error
				? error.message
				: copy.admin.exams.create.readingPart7SegmentInvalidJson;
		throwPart7QaError(
			message,
			"reading-part-7-single",
			singleRawJson,
			multiRawJson,
		);
	}

	let multiParsed: unknown;
	try {
		multiParsed = parseSegmentJson(multiRawJson);
	} catch (error) {
		const message =
			error instanceof Error
				? error.message
				: copy.admin.exams.create.readingPart7SegmentInvalidJson;
		throwPart7QaError(
			message,
			"reading-part-7-multi",
			singleRawJson,
			multiRawJson,
		);
	}

	let singleSets: PassageSetLike[];
	try {
		singleSets = validateSegment(
			singleParsed,
			READING_PART7_SINGLE_SEGMENT,
			options,
		);
	} catch (error) {
		const message =
			error instanceof Error
				? error.message
				: copy.admin.exams.create.readingPart7SegmentInvalidJson;
		throwPart7QaError(
			message,
			"reading-part-7-single",
			singleRawJson,
			multiRawJson,
		);
	}

	let multiSets: PassageSetLike[];
	try {
		multiSets = validateSegment(
			multiParsed,
			READING_PART7_MULTI_SEGMENT,
			options,
		);
	} catch (error) {
		const message =
			error instanceof Error
				? error.message
				: copy.admin.exams.create.readingPart7SegmentInvalidJson;
		throwPart7QaError(
			message,
			"reading-part-7-multi",
			singleRawJson,
			multiRawJson,
		);
	}

	const merged = {
		part: 7,
		title: PART7_TITLE,
		passageSets: [...singleSets, ...multiSets],
	};

	try {
		assertCreateExamReadingPartQuestionCount(7, merged, {
			skipOfficialQuestionCount: options?.skipOfficialQuestionNumberQa,
		});
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Part 7 merge QA failed.";
		throwPart7QaError(message, "merge", singleRawJson, multiRawJson);
	}

	return JSON.stringify(merged);
}
