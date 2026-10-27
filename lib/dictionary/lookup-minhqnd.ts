import type {
  MinhqndLookupResponse,
  NormalizedDictionaryEntry,
} from "@/lib/dictionary/minhqnd-types";

const MINHQND_LOOKUP_URL = "https://dict.minhqnd.com/api/v1/lookup";
const MAX_WORD_LENGTH = 100;

function normalizeIpa(ipa: string): string {
  const trimmed = ipa.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("/") && trimmed.endsWith("/")) {
    return trimmed;
  }

  return `/${trimmed.replace(/^\/+|\/+$/g, "")}/`;
}

function dedupePronunciations(ipas: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const ipa of ipas) {
    const normalized = normalizeIpa(ipa);
    if (!normalized) {
      continue;
    }

    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(normalized);
  }

  return result;
}

export function normalizeMinhqndEnglishVi(
  response: MinhqndLookupResponse,
): NormalizedDictionaryEntry | null {
  if (!response.exists || response.results.length === 0) {
    return null;
  }

  const englishResult =
    response.results.find((result) => result.lang_code === "en") ??
    response.results[0];

  if (!englishResult) {
    return null;
  }

  const meanings = englishResult.meanings
    .filter((meaning) => meaning.definition_lang === "vi")
    .map((meaning) => ({
      pos: meaning.pos,
      definition: meaning.definition.trim(),
      example: meaning.example?.trim() || null,
    }))
    .filter((meaning) => meaning.definition.length > 0);

  if (meanings.length === 0) {
    return null;
  }

  const pronunciations = dedupePronunciations(
    englishResult.pronunciations.map((item) => item.ipa),
  );

  return {
    word: response.word,
    pronunciations,
    meanings,
  };
}

export async function fetchMinhqndLookup(
  word: string,
): Promise<MinhqndLookupResponse> {
  const trimmedWord = word.trim();
  if (!trimmedWord) {
    throw new Error("Word is required.");
  }

  if (trimmedWord.length > MAX_WORD_LENGTH) {
    throw new Error("Word is too long.");
  }

  const url = new URL(MINHQND_LOOKUP_URL);
  url.searchParams.set("word", trimmedWord);
  url.searchParams.set("lang", "en");
  url.searchParams.set("def_lang", "vi");

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 60 * 60 * 24 * 7 },
  });

  if (!response.ok) {
    throw new Error(`Dictionary lookup failed with status ${response.status}.`);
  }

  return (await response.json()) as MinhqndLookupResponse;
}
