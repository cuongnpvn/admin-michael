/**
 * Server-side extract/QA failure that still carries Gemini response JSON
 * for admin download. Must be mapped onto the action result before crossing
 * the server-action boundary (custom Error fields are not serialized).
 */
export class GeminiExtractDebugError extends Error {
	readonly debugJson: string;

	constructor(message: string, debugJson: string) {
		super(message);
		this.name = "GeminiExtractDebugError";
		this.debugJson = debugJson;
	}
}

export function isGeminiExtractDebugError(
	error: unknown,
): error is GeminiExtractDebugError {
	return error instanceof GeminiExtractDebugError;
}

export function buildReadingPart7QaDebugJson(input: {
	error: string;
	failedSegment: "reading-part-7-single" | "reading-part-7-multi" | "merge";
	singleRawJson: string;
	multiRawJson: string;
}): string {
	return JSON.stringify(
		{
			error: input.error,
			failedSegment: input.failedSegment,
			single: parseJsonOrRaw(input.singleRawJson),
			multi: parseJsonOrRaw(input.multiRawJson),
		},
		null,
		2,
	);
}

function parseJsonOrRaw(raw: string): unknown {
	try {
		return JSON.parse(raw);
	} catch {
		return raw;
	}
}
