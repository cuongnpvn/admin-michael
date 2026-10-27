/** One color per question in a passage set (max 5 questions). */
export const REFERENCE_HIGHLIGHT_COLORS = [
	"#92400e", // brown
	"#dc2626", // red
	"#16a34a", // green
	"#2563eb", // blue
	"#0d9488", // teal — fills the green↔blue hue gap; clear of overlap fuchsia
] as const;

/** Distinct fill when two or more question references cover the same passage text. */
export const REFERENCE_HIGHLIGHT_OVERLAP_COLOR = "#c026d3";

export function getReferenceHighlightColor(questionIndexInSet: number): string {
	const index =
		((questionIndexInSet % REFERENCE_HIGHLIGHT_COLORS.length) +
			REFERENCE_HIGHLIGHT_COLORS.length) %
		REFERENCE_HIGHLIGHT_COLORS.length;
	return REFERENCE_HIGHLIGHT_COLORS[index]!;
}
