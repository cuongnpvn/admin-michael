/** Part 6/7 cloze blank markers embedded in passage HTML, e.g. ----[131]---- (canonical) or ---[131]--- (legacy). */
export const PART6_CLOZE_MARKER = /-{3,4}\[\d+\]-{3,4}/g;

const PART6_CLOZE_MARKER_REPLACE = /-{3,4}\[(\d+)\]-{3,4}/g;

/** Wrapped exam blank: `<strong class="passage-cloze">----[131]----</strong>` (optional attrs; 3–4 hyphens). */
const PART6_CLOZE_MARKER_WRAPPED_REPLACE =
	/<strong([^>]*)>\s*-{3,4}\[(\d+)\]-{3,4}\s*<\/strong>/g;

/** Part 6 review display: `**[131] answer**`, legacy `[131] **answer**`, or HTML `<strong>[131] answer</strong>`. */
export const PART6_REVIEW_ANSWER_MARKER =
	/\*\*\[\d+\] [^*]+\*\*|\[\d+\]\s*\*\*[^*]+\*\*|<strong>\[\d+\][^<]*<\/strong>/gi;

export function formatClozeMarker(globalItemNumber: number): string {
	return `----[${globalItemNumber}]----`;
}

/** True when content contains a cloze marker for `globalItemNumber` (canonical or legacy dash count). */
export function contentHasClozeMarker(
	content: string,
	globalItemNumber: number,
): boolean {
	return new RegExp(`-{3,4}\\[${globalItemNumber}\\]-{3,4}`).test(content);
}

/** Exam/import HTML blank with bold (`passage-cloze`). */
export function formatClozeMarkerHtml(globalItemNumber: number): string {
	return `<strong class="passage-cloze">----[${globalItemNumber}]----</strong>`;
}

export function stripClozeMarkers(value: string): string {
	return value.replace(PART6_CLOZE_MARKER, "");
}

export function fillClozeMarkers(
	content: string,
	answersByNumber: ReadonlyMap<number, string>,
): string {
	return content.replace(PART6_CLOZE_MARKER_REPLACE, (match, raw) => {
		const answer = answersByNumber.get(Number(raw));
		return answer ?? match;
	});
}

/** Replace cloze markers with `**[n] answer**` for legacy plain-text review display. */
export function fillReviewClozeMarkers(
	content: string,
	answersByNumber: ReadonlyMap<number, string>,
): string {
	return content.replace(PART6_CLOZE_MARKER_REPLACE, (match, raw) => {
		const answer = answersByNumber.get(Number(raw));
		return answer ? `**[${raw}] ${answer}**` : match;
	});
}

/** Replace cloze markers with `<strong>[n] answer</strong>` for HTML passage review. */
export function fillReviewClozeMarkersHtml(
	content: string,
	answersByNumber: ReadonlyMap<number, string>,
): string {
	const withWrappedFilled = content.replace(
		PART6_CLOZE_MARKER_WRAPPED_REPLACE,
		(match, attrs: string, raw: string) => {
			const answer = answersByNumber.get(Number(raw));
			return answer
				? `<strong${attrs}>[${raw}] ${answer}</strong>`
				: match;
		},
	);

	return withWrappedFilled.replace(PART6_CLOZE_MARKER_REPLACE, (match, raw) => {
		const answer = answersByNumber.get(Number(raw));
		return answer ? `<strong>[${raw}] ${answer}</strong>` : match;
	});
}
