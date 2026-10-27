import {
	PART6_REVIEW_ANSWER_MARKER,
	stripClozeMarkers,
} from "@/lib/reading/passage-cloze-markers";
import {
	DEFAULT_HIGHLIGHT_COLOR,
	toHighlighterFill,
} from "@/lib/reading/passage-annotator-colors";
import { REFERENCE_HIGHLIGHT_OVERLAP_COLOR } from "@/lib/reading/passage-reference-highlight-colors";
import { unwrapPassageDomDecoration } from "@/lib/reading/unwrap-passage-dom-decoration";

const HIGHLIGHT_ATTR = "data-passage-reference-highlight";
const HIGHLIGHT_COLOR_ATTR = "data-passage-reference-color";
const HIGHLIGHT_OVERLAP_ATTR = "data-passage-reference-overlap";
/** Class styled in app/globals.css (border-radius, padding). */
const HIGHLIGHT_CLASS = "passage-reference-highlight";

export type VirtualHighlightRange = {
	start: number;
	end: number;
	color: string;
};

export interface PassageReferenceHighlight {
	text: string;
	color?: string;
}

function normalizeHighlightEntries(
	references: PassageReferenceHighlight[] | string[],
): PassageReferenceHighlight[] {
	return references
		.map((reference) =>
			typeof reference === "string"
				? { text: reference.trim() }
				: { text: reference.text.trim(), color: reference.color },
		)
		.filter((entry) => entry.text.length > 0);
}

export function collapsePassageWhitespace(value: string): string {
	return value.replace(/\s+/g, " ").trim();
}

export function stripQuestionNumberMarkers(value: string): string {
	return stripClozeMarkers(value).replace(PART6_REVIEW_ANSWER_MARKER, (match) => {
		const markdownAnswer = match.match(/\*\*([^*]+)\*\*/)?.[1];
		if (markdownAnswer) {
			return markdownAnswer;
		}

		const htmlAnswer = match.match(/<strong>\[\d+\]\s*([^<]*)<\/strong>/i)?.[1];
		if (htmlAnswer) {
			return htmlAnswer.trim();
		}

		return "";
	});
}

export function normalizePassageReferenceText(value: string): string {
	const withoutMarkers = stripQuestionNumberMarkers(value);
	const withNormalizedSeparators = withoutMarkers.replace(/\|/g, " ");
	return collapsePassageWhitespace(withNormalizedSeparators);
}

function collectTextNodes(root: HTMLElement): Text[] {
	const nodes: Text[] = [];
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

	let current: Node | null;
	while ((current = walker.nextNode())) {
		const parent = current.parentElement;
		if (parent?.closest(`mark[${HIGHLIGHT_ATTR}]`)) {
			continue;
		}
		nodes.push(current as Text);
	}

	return nodes;
}

type VirtualChar = { node: Text; offset: number; blockParent: Element | null };

function getTextBlockParent(node: Text): Element | null {
	return (
		node.parentElement?.closest(
			"p, div, li, td, th, dd, dt, blockquote, section",
		) ?? node.parentElement
	);
}

function joinVirtualChars(nodes: Text[]): VirtualChar[] {
	const chars: VirtualChar[] = [];

	for (const node of nodes) {
		const blockParent = getTextBlockParent(node);
		const content = node.textContent ?? "";
		for (let offset = 0; offset < content.length; offset += 1) {
			chars.push({ node, offset, blockParent });
		}
	}

	return chars;
}

function collapseVirtual(chars: VirtualChar[]): {
	collapsed: string;
	map: number[];
} {
	const map: number[] = [];
	let collapsed = "";
	let pendingSpace = false;
	let previousBlockParent: Element | null = null;

	for (let index = 0; index < chars.length; index += 1) {
		const blockParent = chars[index].blockParent;
		if (
			previousBlockParent &&
			blockParent &&
			blockParent !== previousBlockParent
		) {
			pendingSpace = collapsed.length > 0;
		}
		previousBlockParent = blockParent;

		const ch = chars[index].node.textContent?.[chars[index].offset] ?? "";
		if (/\s/.test(ch)) {
			pendingSpace = collapsed.length > 0;
			continue;
		}

		if (pendingSpace) {
			collapsed += " ";
			map.push(index);
			pendingSpace = false;
		}

		collapsed += ch;
		map.push(index);
	}

	return { collapsed, map };
}

/**
 * Build a comparison string from rendered passage text where question-number
 * markers are ignored, while retaining a map back to collapsed indices.
 */
export function buildCompareCollapsed(collapsed: string): {
	compare: string;
	compareToCollapsed: number[];
} {
	const compareChars: string[] = [];
	const compareToCollapsed: number[] = [];
	let pendingSpace = false;
	let index = 0;

	while (index < collapsed.length) {
		const clozeMarker = collapsed.slice(index).match(/^---\[\d+\]---/);
		if (clozeMarker) {
			index += clozeMarker[0].length;
			if (compareChars.length > 0) {
				pendingSpace = true;
			}
			continue;
		}

		const reviewBoldWrapped = collapsed
			.slice(index)
			.match(/^\*\*\[\d+\] ([^*]+)\*\*/);
		if (reviewBoldWrapped) {
			index += reviewBoldWrapped[0].length;
			for (const ch of reviewBoldWrapped[1]!) {
				if (/\s/.test(ch)) {
					if (compareChars.length > 0) {
						pendingSpace = true;
					}
				} else {
					if (pendingSpace) {
						compareChars.push(" ");
						compareToCollapsed.push(index);
						pendingSpace = false;
					}
					compareChars.push(ch);
					compareToCollapsed.push(index);
				}
			}
			continue;
		}

		const reviewMarker = collapsed.slice(index).match(/^\[\d+\]\s*\*\*/);
		if (reviewMarker) {
			index += reviewMarker[0].length;
			while (index < collapsed.length) {
				if (collapsed.slice(index).startsWith("**")) {
					index += 2;
					break;
				}

				const ch = collapsed[index];
				if (/\s/.test(ch)) {
					if (compareChars.length > 0) {
						pendingSpace = true;
					}
				} else {
					if (pendingSpace) {
						compareChars.push(" ");
						compareToCollapsed.push(index);
						pendingSpace = false;
					}
					compareChars.push(ch);
					compareToCollapsed.push(index);
				}

				index += 1;
			}
			continue;
		}

		const reviewNumberPrefix = collapsed.slice(index).match(/^\[\d+\]\s+/);
		if (reviewNumberPrefix) {
			index += reviewNumberPrefix[0].length;
			continue;
		}

		const ch = collapsed[index];
		if (/\s/.test(ch)) {
			if (compareChars.length > 0) {
				pendingSpace = true;
			}
		} else {
			if (pendingSpace) {
				compareChars.push(" ");
				compareToCollapsed.push(index);
				pendingSpace = false;
			}
			compareChars.push(ch);
			compareToCollapsed.push(index);
		}

		index += 1;
	}

	const rawCompare = compareChars.join("");
	const compare = rawCompare.trim();
	if (!compare) {
		return { compare: "", compareToCollapsed: [0] };
	}

	const trimStart = rawCompare.indexOf(compare);
	const trimEnd = trimStart + compare.length;

	return {
		compare,
		compareToCollapsed: [
			...compareToCollapsed.slice(trimStart, trimEnd),
			collapsed.length,
		],
	};
}

export function findPassageCompareMatch(
	compare: string,
	query: string,
	_collapsed?: string,
): { start: number; end: number } | null {
	const normalizedQuery = normalizePassageReferenceText(query);
	if (!normalizedQuery || !compare) {
		return null;
	}

	const matchStart = compare.indexOf(normalizedQuery);
	if (matchStart === -1) {
		return null;
	}

	return {
		start: matchStart,
		end: matchStart + normalizedQuery.length,
	};
}

/** Segment-based match for filled translation text against passage text with cloze markers. */
export function findClozeAwareMatchInCollapsed(
	collapsed: string,
	query: string,
): { start: number; end: number } | null {
	const normalizedQuery = collapsePassageWhitespace(query);
	const markerPattern =
		/---\[\d+\]---|\*\*\[\d+\] [^*]+\*\*|\[\d+\]\s+(?:\*\*[^*]+\*\*|\S+?)(?=\s|$)/;
	if (!normalizedQuery || !markerPattern.test(collapsed)) {
		return null;
	}

	const parts = collapsed.split(markerPattern);
	if (parts.length < 2) {
		return null;
	}

	let queryPos = 0;
	let collapsedStart = -1;
	let collapsedEnd = 0;
	let offset = 0;

	for (let i = 0; i < parts.length; i++) {
		const rawPart = parts[i];
		const segment = collapsePassageWhitespace(rawPart);
		const segmentStart = offset;
		offset += rawPart.length;

		if (i < parts.length - 1) {
			const marker = collapsed.slice(offset).match(markerPattern);
			if (marker) {
				offset += marker[0].length;
			}
		}

		if (!segment) {
			continue;
		}

		const found = normalizedQuery.indexOf(segment, queryPos);
		if (found === -1) {
			return null;
		}

		if (collapsedStart === -1) {
			collapsedStart = segmentStart;
		}

		queryPos = found + segment.length;
		collapsedEnd = offset;
	}

	if (queryPos !== normalizedQuery.length || collapsedStart === -1) {
		return null;
	}

	return { start: collapsedStart, end: collapsedEnd };
}

function collapsedRangeToCompareMatch(
	compareToCollapsed: number[],
	collapsedStart: number,
	collapsedEnd: number,
): { start: number; end: number } {
	let compareStart = 0;
	for (let i = 0; i < compareToCollapsed.length; i++) {
		if (compareToCollapsed[i] >= collapsedStart) {
			compareStart = i;
			break;
		}
	}

	let compareEnd = compareToCollapsed.length;
	for (let i = 0; i < compareToCollapsed.length; i++) {
		if (compareToCollapsed[i] >= collapsedEnd) {
			compareEnd = i;
			break;
		}
	}

	return { start: compareStart, end: compareEnd };
}

export function findPassageClozeAwareCompareMatch(
	compare: string,
	query: string,
	collapsed?: string,
): { start: number; end: number } | null {
	const direct = findPassageCompareMatch(compare, query);
	if (direct) {
		return direct;
	}

	if (!collapsed) {
		return null;
	}

	const collapsedMatch = findClozeAwareMatchInCollapsed(collapsed, query);
	if (!collapsedMatch) {
		return null;
	}

	const { compareToCollapsed } = buildCompareCollapsed(collapsed);
	return collapsedRangeToCompareMatch(
		compareToCollapsed,
		collapsedMatch.start,
		collapsedMatch.end,
	);
}

/** Find filled translation text within passage HTML/plain text (for bilingual grouping). */
export function findTranslationPositionInPassage(
	passageText: string,
	queryEnglish: string,
	startPosition = 0,
): { start: number; end: number } | null {
	const normalized = collapsePassageWhitespace(queryEnglish);
	const collapsed = collapsePassageWhitespace(passageText);
	if (!normalized || !collapsed) {
		return null;
	}

	const direct = collapsed.indexOf(normalized, startPosition);
	if (direct !== -1) {
		return { start: direct, end: direct + normalized.length };
	}

	if (!/---\[\d+\]---/.test(collapsed)) {
		return null;
	}

	const subMatch = findClozeAwareMatchInCollapsed(
		collapsed.slice(startPosition),
		normalized,
	);
	if (!subMatch) {
		return null;
	}

	return {
		start: startPosition + subMatch.start,
		end: startPosition + subMatch.end,
	};
}

export type CompareMatchFinder = (
	compare: string,
	query: string,
	collapsed?: string,
) => { start: number; end: number } | null;

function clearPassageHighlights(root: HTMLElement) {
	if (!root.isConnected) {
		return;
	}

	root.querySelectorAll(`mark[${HIGHLIGHT_ATTR}]`).forEach((mark) => {
		unwrapPassageDomDecoration(mark);
	});
}

function isTableCellBlock(element: Element | null): boolean {
	const tagName = element?.tagName;
	return tagName === "TD" || tagName === "TH";
}

export function splitVirtualRangeByTableCell(
	chars: VirtualChar[],
	startIndex: number,
	endIndex: number,
): Array<{ start: number; end: number }> {
	if (startIndex < 0 || endIndex <= startIndex || startIndex >= chars.length) {
		return [];
	}

	const subRanges: Array<{ start: number; end: number }> = [];
	let rangeStart = startIndex;
	let currentBlock = chars[startIndex]?.blockParent ?? null;

	for (let index = startIndex + 1; index < endIndex; index += 1) {
		const blockParent = chars[index]?.blockParent ?? null;
		if (
			blockParent !== currentBlock &&
			isTableCellBlock(currentBlock) &&
			isTableCellBlock(blockParent)
		) {
			subRanges.push({ start: rangeStart, end: index });
			rangeStart = index;
		}
		currentBlock = blockParent;
	}

	subRanges.push({ start: rangeStart, end: endIndex });
	return subRanges;
}

/** Split a virtual range so each sub-range stays within one block element (div, p, td, …). */
export function splitVirtualRangeByBlockParent(
	chars: VirtualChar[],
	startIndex: number,
	endIndex: number,
): Array<{ start: number; end: number }> {
	if (startIndex < 0 || endIndex <= startIndex || startIndex >= chars.length) {
		return [];
	}

	const subRanges: Array<{ start: number; end: number }> = [];
	let rangeStart = startIndex;
	let currentBlock = chars[startIndex]?.blockParent ?? null;

	for (let index = startIndex + 1; index < endIndex; index += 1) {
		const blockParent = chars[index]?.blockParent ?? null;
		if (blockParent !== currentBlock) {
			subRanges.push({ start: rangeStart, end: index });
			rangeStart = index;
			currentBlock = blockParent;
		}
	}

	subRanges.push({ start: rangeStart, end: endIndex });
	return subRanges;
}

export function createDomRangeFromVirtualIndices(
	chars: VirtualChar[],
	startIndex: number,
	endIndex: number,
): Range | null {
	if (startIndex < 0 || endIndex <= startIndex || startIndex >= chars.length) {
		return null;
	}

	const lastIndex = Math.min(endIndex - 1, chars.length - 1);
	const start = chars[startIndex];
	const end = chars[lastIndex];
	const range = document.createRange();

	range.setStart(start.node, start.offset);
	range.setEnd(end.node, end.offset + 1);
	return range;
}

export function createDomRangesForVirtualHighlight(
	chars: VirtualChar[],
	startIndex: number,
	endIndex: number,
): Range[] {
	const subRanges = splitVirtualRangeByBlockParent(chars, startIndex, endIndex);
	const ranges: Range[] = [];

	for (const subRange of subRanges) {
		const range = createDomRangeFromVirtualIndices(
			chars,
			subRange.start,
			subRange.end,
		);
		if (range) {
			ranges.push(range);
		}
	}

	return ranges;
}

function highlightVirtualRangeSingle(
	chars: VirtualChar[],
	startIndex: number,
	endIndex: number,
	color: string,
	isOverlap = false,
): HTMLElement | null {
	const range = createDomRangeFromVirtualIndices(chars, startIndex, endIndex);
	if (!range) {
		return null;
	}

	const mark = document.createElement("mark");
	mark.setAttribute(HIGHLIGHT_ATTR, "");
	mark.setAttribute(HIGHLIGHT_COLOR_ATTR, color);
	if (isOverlap) {
		mark.setAttribute(HIGHLIGHT_OVERLAP_ATTR, "");
	}
	mark.className = HIGHLIGHT_CLASS;
	mark.style.backgroundColor = toHighlighterFill(color);
	mark.style.color = "inherit";
	mark.style.boxShadow = "none";

	try {
		range.surroundContents(mark);
	} catch {
		const contents = range.extractContents();
		mark.appendChild(contents);
		range.insertNode(mark);
	}

	return mark;
}

function highlightVirtualRange(
	chars: VirtualChar[],
	startIndex: number,
	endIndex: number,
	color: string,
	isOverlap = false,
): HTMLElement | null {
	const subRanges = splitVirtualRangeByBlockParent(chars, startIndex, endIndex);
	if (subRanges.length === 0) {
		return null;
	}

	let firstMark: HTMLElement | null = null;
	for (const subRange of subRanges) {
		const mark = highlightVirtualRangeSingle(
			chars,
			subRange.start,
			subRange.end,
			color,
			isOverlap,
		);
		if (mark && !firstMark) {
			firstMark = mark;
		}
	}

	return firstMark;
}

function collapsedIndexToVirtualEnd(
	map: number[],
	collapsedIndex: number,
	charsLength: number,
): number {
	if (collapsedIndex >= map.length) {
		return charsLength;
	}

	return map[collapsedIndex] ?? charsLength;
}

export function resolveHighlightVirtualRange(
	collapsed: string,
	map: number[],
	compareToCollapsed: number[],
	match: { start: number; end: number },
	charsLength: number,
): { start: number; end: number } | null {
	if (match.start < 0 || match.end <= match.start) {
		return null;
	}

	const collapsedStart = compareToCollapsed[match.start];
	const collapsedLastInclusive = compareToCollapsed[match.end - 1];

	if (
		collapsedStart === undefined ||
		collapsedLastInclusive === undefined ||
		collapsedStart >= collapsed.length ||
		collapsedLastInclusive >= collapsed.length
	) {
		return null;
	}

	const collapsedEndExclusive = collapsedLastInclusive + 1;
	const virtualStart = map[collapsedStart];
	const virtualEnd = collapsedIndexToVirtualEnd(
		map,
		collapsedEndExclusive,
		charsLength,
	);

	if (virtualStart === undefined || virtualEnd <= virtualStart) {
		return null;
	}

	return { start: virtualStart, end: virtualEnd };
}

function mergeAdjacentHighlightSegments(
	segments: VirtualHighlightRange[],
): VirtualHighlightRange[] {
	if (segments.length === 0) {
		return [];
	}

	const merged: VirtualHighlightRange[] = [{ ...segments[0]! }];
	for (let index = 1; index < segments.length; index += 1) {
		const current = segments[index]!;
		const previous = merged[merged.length - 1]!;

		if (previous.color === current.color && previous.end === current.start) {
			previous.end = current.end;
			continue;
		}

		merged.push({ ...current });
	}

	return merged;
}

export function buildReferenceHighlightSegments(
	ranges: VirtualHighlightRange[],
): VirtualHighlightRange[] {
	if (ranges.length === 0) {
		return [];
	}

	const boundaries = new Set<number>();
	for (const range of ranges) {
		boundaries.add(range.start);
		boundaries.add(range.end);
	}

	const sortedBoundaries = [...boundaries].sort((left, right) => left - right);
	const segments: VirtualHighlightRange[] = [];

	for (let index = 0; index < sortedBoundaries.length - 1; index += 1) {
		const start = sortedBoundaries[index]!;
		const end = sortedBoundaries[index + 1]!;
		if (start >= end) {
			continue;
		}

		const covering = ranges.filter(
			(range) => range.start <= start && range.end >= end,
		);
		if (covering.length === 0) {
			continue;
		}

		segments.push({
			start,
			end,
			color:
				covering.length >= 2
					? REFERENCE_HIGHLIGHT_OVERLAP_COLOR
					: covering[0]!.color,
		});
	}

	return mergeAdjacentHighlightSegments(segments);
}

function highlightRangesOverlapWithDifferentColors(
	ranges: VirtualHighlightRange[],
): boolean {
	for (let leftIndex = 0; leftIndex < ranges.length; leftIndex += 1) {
		const left = ranges[leftIndex]!;
		for (let rightIndex = leftIndex + 1; rightIndex < ranges.length; rightIndex += 1) {
			const right = ranges[rightIndex]!;
			if (left.color === right.color) {
				continue;
			}

			if (left.start < right.end && right.start < left.end) {
				return true;
			}
		}
	}

	return false;
}

function resolvePassageHighlightRanges(
	root: HTMLElement,
	queries: PassageReferenceHighlight[],
	findMatch: CompareMatchFinder,
): { chars: VirtualChar[]; ranges: VirtualHighlightRange[] } | null {
	const textNodes = collectTextNodes(root);
	if (textNodes.length === 0) {
		return null;
	}

	const chars = joinVirtualChars(textNodes);
	if (chars.length === 0) {
		return null;
	}

	const { collapsed, map } = collapseVirtual(chars);
	const { compare, compareToCollapsed } = buildCompareCollapsed(collapsed);
	const ranges: VirtualHighlightRange[] = [];

	for (const query of queries) {
		const trimmed = query.text.trim();
		if (!trimmed) {
			continue;
		}

		const match = findMatch(compare, trimmed, collapsed);
		if (!match) {
			continue;
		}

		const virtualRange = resolveHighlightVirtualRange(
			collapsed,
			map,
			compareToCollapsed,
			match,
			chars.length,
		);
		if (!virtualRange) {
			continue;
		}

		ranges.push({
			start: virtualRange.start,
			end: virtualRange.end,
			color: query.color ?? DEFAULT_HIGHLIGHT_COLOR,
		});
	}

	if (ranges.length === 0) {
		return null;
	}

	return { chars, ranges };
}

export function preparePassageReferenceHighlightSegments(
	root: HTMLElement,
	references: PassageReferenceHighlight[] | string[],
	findMatch: CompareMatchFinder,
): { chars: VirtualChar[]; segments: VirtualHighlightRange[] } | null {
	const queries = normalizeHighlightEntries(references);
	if (queries.length === 0) {
		return null;
	}

	const resolved = resolvePassageHighlightRanges(root, queries, findMatch);
	if (!resolved) {
		return null;
	}

	const segments = highlightRangesOverlapWithDifferentColors(resolved.ranges)
		? buildReferenceHighlightSegments(resolved.ranges)
		: resolved.ranges;

	return { chars: resolved.chars, segments };
}

export type PassageQueryVirtualRange = {
	start: number;
	end: number;
	queryIndex: number;
};

export function resolvePassageQueryVirtualRanges(
	root: HTMLElement,
	queries: string[],
	findMatch: CompareMatchFinder = findPassageClozeAwareCompareMatch,
): { chars: VirtualChar[]; ranges: PassageQueryVirtualRange[] } | null {
	const textNodes = collectTextNodes(root);
	if (textNodes.length === 0) {
		return null;
	}

	const chars = joinVirtualChars(textNodes);
	if (chars.length === 0) {
		return null;
	}

	const { collapsed, map } = collapseVirtual(chars);
	const { compare, compareToCollapsed } = buildCompareCollapsed(collapsed);
	const ranges: PassageQueryVirtualRange[] = [];

	for (let queryIndex = 0; queryIndex < queries.length; queryIndex += 1) {
		const query = queries[queryIndex]?.trim();
		if (!query) {
			continue;
		}

		const match = findMatch(compare, query, collapsed);
		if (!match) {
			continue;
		}

		const virtualRange = resolveHighlightVirtualRange(
			collapsed,
			map,
			compareToCollapsed,
			match,
			chars.length,
		);
		if (!virtualRange) {
			continue;
		}

		ranges.push({
			start: virtualRange.start,
			end: virtualRange.end,
			queryIndex,
		});
	}

	if (ranges.length === 0) {
		return null;
	}

	return { chars, ranges };
}

export function applyPassageReferenceHighlightsDom(
	root: HTMLElement,
	references: PassageReferenceHighlight[] | string[],
	findMatch: CompareMatchFinder = findPassageCompareMatch,
): () => void {
	clearPassageHighlights(root);

	const prepared = preparePassageReferenceHighlightSegments(
		root,
		references,
		findMatch,
	);
	if (!prepared) {
		return () => clearPassageHighlights(root);
	}

	const sortedSegments = [...prepared.segments].sort(
		(left, right) => right.start - left.start,
	);

	let firstMark: HTMLElement | null = null;
	let appliedCount = 0;
	for (const segment of sortedSegments) {
		const isOverlap = segment.color === REFERENCE_HIGHLIGHT_OVERLAP_COLOR;
		const mark = highlightVirtualRange(
			prepared.chars,
			segment.start,
			segment.end,
			segment.color,
			isOverlap,
		);
		if (mark) {
			appliedCount += 1;
			if (!firstMark) {
				firstMark = mark;
			}
		}
	}

	if (appliedCount === 1 && firstMark) {
		firstMark.scrollIntoView({ block: "nearest", behavior: "smooth" });
	}

	return () => clearPassageHighlights(root);
}
