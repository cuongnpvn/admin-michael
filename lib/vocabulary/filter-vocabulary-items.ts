import type { VocabularySummaryItem } from "@/lib/vocabulary/load-deck-vocabulary";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const DECK_NAME_WORD_SPLIT = /[\s·/,;:]+/;

function deckNameWords(name: string): string[] {
  return name.split(DECK_NAME_WORD_SPLIT).filter(Boolean);
}

function queryTokens(query: string): string[] {
  return query.trim().split(/\s+/).filter(Boolean);
}

/**
 * True when every query token matches at least one word in the deck name.
 * Matching is a case-insensitive regex against individual words, so "list"
 * matches "ETS 2026 · Test 1 · Listening".
 */
export function matchesVocabularyDeckName(name: string, query: string): boolean {
  const tokens = queryTokens(query);
  if (tokens.length === 0) return true;

  const words = deckNameWords(name);
  if (words.length === 0) return false;

  return tokens.every((token) => {
    const regex = new RegExp(escapeRegex(token), "i");
    return words.some((word) => regex.test(word));
  });
}

export function filterVocabularyDecksByName<T extends { name: string }>(
  decks: readonly T[],
  query: string,
): T[] {
  if (queryTokens(query).length === 0) return [...decks];
  return decks.filter((deck) => matchesVocabularyDeckName(deck.name, query));
}

/**
 * Builds a regex where each typed character must appear in order in the target text.
 * Example: "inv" matches "invoice".
 */
export function buildSequentialCharRegex(query: string): RegExp | null {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const pattern = trimmed
    .split("")
    .map((char) => escapeRegex(char))
    .join(".*");

  return new RegExp(pattern, "i");
}

export function matchesVocabularySearchQuery(
  text: string,
  query: string,
): boolean {
  const regex = buildSequentialCharRegex(query);
  if (!regex) return true;
  return regex.test(text);
}

export function filterVocabularySummaryItems(
  items: VocabularySummaryItem[],
  query: string,
): VocabularySummaryItem[] {
  const regex = buildSequentialCharRegex(query);
  if (!regex) return items;

  return items.filter((item) => regex.test(item.term));
}
