import { normalizeLookupCacheWord } from "@/lib/dictionary/normalize-lookup-cache-key";
import { parseVocabularyCefrLevel } from "@/lib/vocabulary/cefr-level";
import type { VocabularyItemPayload } from "@/lib/vocabulary/vocabulary-item-payload";

export const LOOKUP_HISTORY_MAX_ITEMS = 20;

export type LookupHistoryStorage = Pick<Storage, "getItem" | "setItem">;

export type LookupHistoryItem = {
  word: string;
  body: string;
  payload: VocabularyItemPayload | null;
  lookedUpAt: string;
  sentenceContext?: string;
};

export type LookupHistoryWriteInput = {
  word: string;
  body: string;
  payload?: VocabularyItemPayload | null;
  lookedUpAt?: string;
  sentenceContext?: string | null;
  /** Original selected text, used to replace a prior entry when the lemma differs. */
  queriedWord?: string;
};

function storageKey(userId: string): string {
  return `michael-toeic:lookup-history:${userId}`;
}

function getStorage(
  storage?: LookupHistoryStorage | null,
): LookupHistoryStorage | null {
  if (storage) return storage;
  if (typeof globalThis.localStorage === "undefined") return null;

  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function parsePayload(value: unknown): VocabularyItemPayload | null {
  if (!value || typeof value !== "object") return null;

  const payload = value as Record<string, unknown>;
  if (typeof payload.term !== "string" || !payload.term.trim()) return null;
  if (
    !isStringArray(payload.wordTypes) ||
    !isStringArray(payload.synonyms) ||
    !isStringArray(payload.collocations)
  ) {
    return null;
  }

  return {
    term: payload.term,
    lemma: typeof payload.lemma === "string" ? payload.lemma : null,
    meaningVi: typeof payload.meaningVi === "string" ? payload.meaningVi : null,
    definitionEn:
      typeof payload.definitionEn === "string" ? payload.definitionEn : null,
    ipaUs: typeof payload.ipaUs === "string" ? payload.ipaUs : null,
    ipaUk: typeof payload.ipaUk === "string" ? payload.ipaUk : null,
    wordTypes: payload.wordTypes,
    synonyms: payload.synonyms,
    collocations: payload.collocations,
    example: typeof payload.example === "string" ? payload.example : null,
    level: parseVocabularyCefrLevel(payload.level),
  };
}

function parseHistoryItem(value: unknown): LookupHistoryItem | null {
  if (!value || typeof value !== "object") return null;

  const item = value as Record<string, unknown>;
  if (typeof item.word !== "string" || !item.word.trim()) return null;
  if (typeof item.body !== "string") return null;
  if (typeof item.lookedUpAt !== "string" || !item.lookedUpAt) return null;

  const parsed: LookupHistoryItem = {
    word: item.word.trim(),
    body: item.body,
    payload: parsePayload(item.payload),
    lookedUpAt: item.lookedUpAt,
  };

  if (typeof item.sentenceContext === "string" && item.sentenceContext.trim()) {
    parsed.sentenceContext = item.sentenceContext;
  }

  return parsed;
}

export function lookupHistoryItemKey(item: LookupHistoryItem): string {
  return `${normalizeLookupCacheWord(item.word)}__${item.lookedUpAt}`;
}

export function findLookupHistoryItem(
  items: LookupHistoryItem[],
  word: string,
): LookupHistoryItem | null {
  const key = normalizeLookupCacheWord(word);
  if (!key) return null;

  return (
    items.find((item) => {
      const candidates = [
        item.word,
        item.payload?.term,
        item.payload?.lemma,
      ].filter((value): value is string => Boolean(value));
      return candidates.some(
        (value) => normalizeLookupCacheWord(value) === key,
      );
    }) ?? null
  );
}

export function readLookupHistory(
  userId: string,
  storage?: LookupHistoryStorage | null,
): LookupHistoryItem[] {
  const trimmedUserId = userId.trim();
  const target = getStorage(storage);
  if (!trimmedUserId || !target) return [];

  try {
    const raw = target.getItem(storageKey(trimmedUserId));
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(parseHistoryItem)
      .filter((item): item is LookupHistoryItem => item !== null)
      .slice(0, LOOKUP_HISTORY_MAX_ITEMS);
  } catch {
    return [];
  }
}

export function prependLookupHistory(
  userId: string,
  input: LookupHistoryWriteInput,
  storage?: LookupHistoryStorage | null,
): LookupHistoryItem[] {
  const word = input.word.trim();
  if (!word) {
    return readLookupHistory(userId, storage);
  }

  const nextItem: LookupHistoryItem = {
    word,
    body: input.body,
    payload: input.payload ?? null,
    lookedUpAt: input.lookedUpAt ?? new Date().toISOString(),
  };

  if (input.sentenceContext?.trim()) {
    nextItem.sentenceContext = input.sentenceContext.trim();
  }

  const dropKeys = new Set(
    [word, input.queriedWord]
      .map((value) => (value ? normalizeLookupCacheWord(value) : ""))
      .filter(Boolean),
  );

  const next = [
    nextItem,
    ...readLookupHistory(userId, storage).filter(
      (item) => !dropKeys.has(normalizeLookupCacheWord(item.word)),
    ),
  ].slice(0, LOOKUP_HISTORY_MAX_ITEMS);

  const trimmedUserId = userId.trim();
  const target = getStorage(storage);
  if (!trimmedUserId || !target) return next;

  try {
    target.setItem(storageKey(trimmedUserId), JSON.stringify(next));
  } catch {
    // Private mode / quota — keep the in-memory list for this session.
  }

  return next;
}
