export const DEFAULT_ANNOTATOR_COLOR = "#2563eb";
export const DEFAULT_HIGHLIGHT_COLOR = "#eab308";

export const ANNOTATOR_COLOR_PRESETS = [
	"#2563eb",
	"#6366f1",
	"#16a34a",
	"#eab308",
	"#9333ea",
	"#ea580c",
	"#0891b2",
	"#171717",
] as const;

export function hexToRgba(hex: string, alpha: number): string {
	const normalized = hex.replace("#", "");
	if (normalized.length !== 6) {
		return hex;
	}

	const red = Number.parseInt(normalized.slice(0, 2), 16);
	const green = Number.parseInt(normalized.slice(2, 4), 16);
	const blue = Number.parseInt(normalized.slice(4, 6), 16);

	if ([red, green, blue].some((channel) => Number.isNaN(channel))) {
		return hex;
	}

	return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function toHighlighterFill(color: string): string {
	return hexToRgba(color, 0.45);
}

export function toHighlighterAccent(color: string): string {
	return hexToRgba(color, 0.35);
}
