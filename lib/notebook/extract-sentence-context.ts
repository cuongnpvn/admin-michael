import { NOTEBOOK_SELECTABLE_ATTR } from "@/lib/notebook/types";
import { normalizePassageReferenceText } from "@/lib/reading/passage-highlight-dom";

const MAX_SENTENCE_CHARS = 280;
const FALLBACK_WINDOW_CHARS = 120;

function findSelectableRoot(node: EventTarget | null): HTMLElement | null {
  if (!(node instanceof Node)) return null;
  const element = node instanceof HTMLElement ? node : node.parentElement;
  return element?.closest(`[${NOTEBOOK_SELECTABLE_ATTR}]`) ?? null;
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function capSentence(value: string): string {
  if (value.length <= MAX_SENTENCE_CHARS) {
    return value;
  }
  return `${value.slice(0, MAX_SENTENCE_CHARS - 1).trimEnd()}…`;
}

function findSentenceAroundIndex(text: string, index: number, length: number): string {
  if (!text || index < 0) {
    return "";
  }

  const endIndex = Math.min(text.length, index + Math.max(length, 1));
  let start = index;
  let end = endIndex;

  while (start > 0) {
    const ch = text[start - 1]!;
    if (ch === "\n" || ch === "." || ch === "?" || ch === "!") {
      break;
    }
    start -= 1;
  }

  while (end < text.length) {
    const ch = text[end]!;
    end += 1;
    if (ch === "\n" || ch === "." || ch === "?" || ch === "!") {
      break;
    }
  }

  let sentence = collapseWhitespace(text.slice(start, end));
  if (!sentence) {
    const windowStart = Math.max(0, index - FALLBACK_WINDOW_CHARS);
    const windowEnd = Math.min(text.length, endIndex + FALLBACK_WINDOW_CHARS);
    sentence = collapseWhitespace(text.slice(windowStart, windowEnd));
  }

  return capSentence(sentence);
}

/**
 * Best-effort sentence around the current selection for AI Tra cứu context.
 * Call before clearing the selection.
 */
export function extractSentenceContextFromSelection(
  selectedWord?: string,
): string | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const root = findSelectableRoot(range.commonAncestorContainer);
  if (!root) {
    return null;
  }

  const rootText = collapseWhitespace(root.innerText ?? root.textContent ?? "");
  if (!rootText) {
    return null;
  }

  const selected =
    normalizePassageReferenceText(
      selectedWord?.trim() || selection.toString().trim(),
    ) || "";
  if (!selected) {
    return null;
  }

  const lowerRoot = rootText.toLowerCase();
  const lowerSelected = selected.toLowerCase();
  let index = lowerRoot.indexOf(lowerSelected);

  // Prefer occurrence near the selection’s pre-range text when duplicates exist.
  if (index >= 0) {
    try {
      const preRange = range.cloneRange();
      preRange.selectNodeContents(root);
      preRange.setEnd(range.startContainer, range.startOffset);
      const prefixLen = collapseWhitespace(preRange.toString()).length;
      let searchFrom = 0;
      let best = index;
      let bestDistance = Math.abs(index - prefixLen);
      while (searchFrom < lowerRoot.length) {
        const next = lowerRoot.indexOf(lowerSelected, searchFrom);
        if (next < 0) break;
        const distance = Math.abs(next - prefixLen);
        if (distance < bestDistance) {
          best = next;
          bestDistance = distance;
        }
        searchFrom = next + lowerSelected.length;
      }
      index = best;
    } catch {
      // keep first match
    }
  }

  if (index < 0) {
    return capSentence(selected);
  }

  const sentence = findSentenceAroundIndex(rootText, index, selected.length);
  return sentence || null;
}
