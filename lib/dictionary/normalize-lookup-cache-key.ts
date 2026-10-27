export const LOOKUP_CACHE_SENTENCE_MAX_CHARS = 280;

function foldTypography(value: string): string {
  return value
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014\u2212]/g, "-");
}

export function normalizeLookupCacheWord(word: string): string {
  return word.trim().normalize("NFKC").toLocaleLowerCase();
}

export function normalizeLookupCacheSentence(
  sentenceContext?: string | null,
): string {
  return foldTypography((sentenceContext ?? "").normalize("NFKC"))
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, LOOKUP_CACHE_SENTENCE_MAX_CHARS)
    .toLocaleLowerCase();
}

export function normalizeLookupCacheKey(
  word: string,
  sentenceContext?: string | null,
): { word: string; sentence: string } | null {
  const normalizedWord = normalizeLookupCacheWord(word);
  if (!normalizedWord) return null;
  return {
    word: normalizedWord,
    sentence: normalizeLookupCacheSentence(sentenceContext),
  };
}
