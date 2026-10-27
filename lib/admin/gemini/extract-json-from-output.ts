import { stripGeminiAntiRecitationMarker } from "@/lib/admin/gemini/strip-gemini-anti-recitation-marker";

function tryParseJson(candidate: string): unknown | undefined {
	try {
		return JSON.parse(candidate);
	} catch {
		return undefined;
	}
}

function extractFencedBlocks(text: string): string[] {
	const blocks: string[] = [];
	const fenceRe = /```(?:json)?\s*([\s\S]*?)```/gi;
	for (const match of text.matchAll(fenceRe)) {
		const body = match[1]?.trim();
		if (body) {
			blocks.push(body);
		}
	}
	return blocks;
}

/** Score parsed JSON so we prefer full arrays/objects over tiny accidental parses. */
function jsonPayloadScore(value: unknown): number {
	if (Array.isArray(value)) {
		return 1_000_000 + value.length * 1_000 + JSON.stringify(value).length;
	}
	if (value && typeof value === "object") {
		return 100_000 + Object.keys(value as object).length * 100 + JSON.stringify(value).length;
	}
	if (typeof value === "string") {
		return value.length;
	}
	return 1;
}

function extractBalancedJsonSlice(text: string): string | null {
	const startCandidates: Array<{ index: number; open: "[" | "{" }> = [];
	for (let index = 0; index < text.length; index += 1) {
		const char = text[index];
		if (char === "[" || char === "{") {
			startCandidates.push({ index, open: char });
		}
	}

	for (const { index: start, open } of startCandidates) {
		const close = open === "[" ? "]" : "}";
		let depth = 0;
		let inString = false;
		let escaped = false;

		for (let index = start; index < text.length; index += 1) {
			const char = text[index];

			if (inString) {
				if (escaped) {
					escaped = false;
					continue;
				}
				if (char === "\\") {
					escaped = true;
					continue;
				}
				if (char === '"') {
					inString = false;
				}
				continue;
			}

			if (char === '"') {
				inString = true;
				continue;
			}

			if (char === open) {
				depth += 1;
				continue;
			}

			if (char === close) {
				depth -= 1;
				if (depth === 0) {
					return text.slice(start, index + 1);
				}
			}
		}
	}

	return null;
}

/**
 * Parse JSON from Gemini text that may include markdown fences or prose.
 * Prefers the largest successfully parsed payload when multiple candidates exist.
 */
export function extractJsonFromGeminiOutput(text: string): unknown {
	const trimmed = text.trim();
	if (!trimmed) {
		throw new SyntaxError("Gemini output was empty.");
	}

	const candidates: string[] = [trimmed, ...extractFencedBlocks(trimmed)];
	const balanced = extractBalancedJsonSlice(trimmed);
	if (balanced) {
		candidates.push(balanced);
	}

	let best: { value: unknown; score: number } | undefined;

	for (const candidate of candidates) {
		const parsed = tryParseJson(candidate);
		if (parsed === undefined) {
			continue;
		}

		// Unwrap accidental double-encoded JSON strings.
		const value =
			typeof parsed === "string" ? (tryParseJson(parsed) ?? parsed) : parsed;
		const score = jsonPayloadScore(value);
		if (!best || score > best.score) {
			best = { value, score };
		}
	}

	if (best) {
		return stripGeminiAntiRecitationMarker(best.value);
	}

	throw new SyntaxError("Gemini output did not contain valid JSON.");
}
