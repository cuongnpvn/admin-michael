import {
  normalizeLookupCacheKey,
  normalizeLookupCacheWord,
} from "@/lib/dictionary/normalize-lookup-cache-key";
import type { VocabularyItemPayload } from "@/lib/vocabulary/vocabulary-item-payload";

const MAX_ENTRIES = 50;

export type LookupSessionCacheEntry = {
  body: string;
  payload: VocabularyItemPayload | null;
};

const cache = new Map<string, LookupSessionCacheEntry>();

function cacheKey(word: string, sentenceContext?: string | null): string | null {
  const normalized = normalizeLookupCacheKey(word, sentenceContext);
  if (!normalized) return null;
  return `${normalized.word}\0${normalized.sentence}`;
}

function write(
  word: string,
  sentenceContext: string | null | undefined,
  entry: LookupSessionCacheEntry,
): void {
  const key = cacheKey(word, sentenceContext);
  if (!key) return;

  cache.delete(key);
  cache.set(key, entry);

  while (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

export function getLookupSessionCache(
  word: string,
  sentenceContext?: string | null,
): LookupSessionCacheEntry | null {
  const key = cacheKey(word, sentenceContext);
  if (!key) return null;

  const entry = cache.get(key);
  if (!entry) return null;

  cache.delete(key);
  cache.set(key, entry);
  return entry;
}

export function setLookupSessionCache(
  word: string,
  sentenceContext: string | null | undefined,
  entry: LookupSessionCacheEntry,
): void {
  write(word, sentenceContext, entry);

  const resolved = entry.payload?.term.trim();
  if (resolved && normalizeLookupCacheWord(resolved) !== normalizeLookupCacheWord(word)) {
    write(resolved, sentenceContext, entry);
  }
}
