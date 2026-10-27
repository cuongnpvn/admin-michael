/**
 * Split an explanation `reference` field into individual passage queries for
 * highlight matching. Authors may cite multiple sentences in one string using
 * newlines or semicolons (see admin instructions: "sentence(s)").
 */
export function splitPassageReferenceQueries(reference: string): string[] {
	const trimmed = reference.trim();
	if (!trimmed) {
		return [];
	}

	const byParagraph = trimmed
		.split(/\n{2,}/)
		.map((chunk) => chunk.trim())
		.filter(Boolean);

	const byLine = (
		byParagraph.length > 1 ? byParagraph : trimmed.split(/\n+/)
	)
		.map((chunk) => chunk.trim())
		.filter(Boolean);

	const expanded = byLine.flatMap((chunk) => {
		const bySemicolon = chunk
			.split(/\s*;\s+/)
			.map((part) => part.trim())
			.filter(Boolean);
		return bySemicolon.length > 1 ? bySemicolon : [chunk];
	});

	const seen = new Set<string>();
	const unique: string[] = [];

	for (const query of expanded) {
		const key = query.toLowerCase();
		if (seen.has(key)) {
			continue;
		}
		seen.add(key);
		unique.push(query);
	}

	return unique;
}

/**
 * Expand highlight entries so each cited sentence is matched independently.
 */
export function expandPassageReferenceHighlights<
	T extends { text: string; color?: string },
>(entries: T[]): T[] {
	return entries.flatMap((entry) => {
		const parts = splitPassageReferenceQueries(entry.text);
		if (parts.length === 0) {
			return [];
		}

		return parts.map((text) => ({ ...entry, text }));
	});
}
