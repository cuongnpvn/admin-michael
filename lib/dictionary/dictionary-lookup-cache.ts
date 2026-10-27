import {
  formatAiDictionaryLookup,
  type AiDictionaryLookupResult,
} from "@/lib/dictionary/format-ai-dictionary-lookup";
import {
  dictionaryLookupError,
  dictionaryLookupLog,
} from "@/lib/dictionary/dictionary-lookup-log";
import { getDictionaryLookupPromptVersion } from "@/lib/dictionary/load-dictionary-lookup-prompt";
import { normalizeDictionaryLookup } from "@/lib/dictionary/normalize-dictionary-lookup";
import {
  normalizeLookupCacheKey,
  normalizeLookupCacheWord,
} from "@/lib/dictionary/normalize-lookup-cache-key";
import {
  requireTranslationAiModel,
  requireTranslationProvider,
} from "@/lib/dictionary/translation-ai-env";
import { createServiceRoleClient } from "@/lib/supabase/service";
import type { VocabularyItemPayload } from "@/lib/vocabulary/vocabulary-item-payload";

const ON_CONFLICT =
  "word_normalized,sentence_normalized,provider,model,prompt_version";

type CacheIdentity = {
  provider: string;
  model: string;
  promptVersion: string;
};

type ServiceClient = ReturnType<typeof createServiceRoleClient>;

async function cacheIdentity(): Promise<CacheIdentity> {
  return {
    provider: requireTranslationProvider(),
    model: requireTranslationAiModel(),
    promptVersion: await getDictionaryLookupPromptVersion(),
  };
}

function tryServiceClient(): ServiceClient | null {
  try {
    return createServiceRoleClient();
  } catch (error) {
    dictionaryLookupError("cache_client_unavailable", {}, error);
    return null;
  }
}

function parseCachedLookup(
  payload: unknown,
  word: string,
  sentenceNormalized: string,
): AiDictionaryLookupResult | null {
  const normalized = normalizeDictionaryLookup(payload, word);
  if (!normalized) return null;

  dictionaryLookupLog("cache_hit", {
    word: normalizeLookupCacheWord(word),
    hasSentenceContext: Boolean(sentenceNormalized),
  });
  return formatAiDictionaryLookup(normalized);
}

export async function getDictionaryLookupCache(
  word: string,
  sentenceContext?: string | null,
): Promise<AiDictionaryLookupResult | null> {
  const key = normalizeLookupCacheKey(word, sentenceContext);
  if (!key) return null;

  const supabase = tryServiceClient();
  if (!supabase) return null;

  try {
    const identity = await cacheIdentity();
    const { data, error } = await supabase
      .from("dictionary_lookup_cache")
      .select("payload")
      .eq("word_normalized", key.word)
      .eq("sentence_normalized", key.sentence)
      .eq("provider", identity.provider)
      .eq("model", identity.model)
      .eq("prompt_version", identity.promptVersion)
      .maybeSingle();

    if (error) {
      dictionaryLookupError("cache_get_failed", { word: key.word }, error);
      return null;
    }

    return parseCachedLookup(data?.payload, word, key.sentence);
  } catch (error) {
    dictionaryLookupError("cache_get_failed", { word: key.word }, error);
    return null;
  }
}

/**
 * Vocab add/edit lookup: prefer a generic (empty sentence) row, then the
 * newest row for the same word + provider/model/prompt. Notebook Tra cứu
 * stays on exact sentence match via getDictionaryLookupCache.
 */
export async function getDictionaryLookupCacheForTerm(
  word: string,
): Promise<AiDictionaryLookupResult | null> {
  const exact = await getDictionaryLookupCache(word);
  if (exact) return exact;

  const key = normalizeLookupCacheKey(word);
  if (!key) return null;

  const supabase = tryServiceClient();
  if (!supabase) return null;

  try {
    const identity = await cacheIdentity();
    const { data, error } = await supabase
      .from("dictionary_lookup_cache")
      .select("payload, sentence_normalized")
      .eq("word_normalized", key.word)
      .eq("provider", identity.provider)
      .eq("model", identity.model)
      .eq("prompt_version", identity.promptVersion)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      dictionaryLookupError(
        "cache_get_for_term_failed",
        { word: key.word },
        error,
      );
      return null;
    }

    const sentenceNormalized =
      typeof data?.sentence_normalized === "string"
        ? data.sentence_normalized
        : "";

    return parseCachedLookup(data?.payload, word, sentenceNormalized);
  } catch (error) {
    dictionaryLookupError(
      "cache_get_for_term_failed",
      { word: key.word },
      error,
    );
    return null;
  }
}

async function writeCacheRow(
  supabase: ServiceClient,
  wordNormalized: string,
  sentenceNormalized: string,
  payload: VocabularyItemPayload,
  identity: CacheIdentity,
): Promise<void> {
  const { error } = await supabase.from("dictionary_lookup_cache").upsert(
    {
      word_normalized: wordNormalized,
      sentence_normalized: sentenceNormalized,
      provider: identity.provider,
      model: identity.model,
      prompt_version: identity.promptVersion,
      payload,
    },
    { onConflict: ON_CONFLICT, ignoreDuplicates: true },
  );

  if (error) {
    dictionaryLookupError("cache_set_failed", { word: wordNormalized }, error);
  }
}

export async function setDictionaryLookupCache(
  word: string,
  sentenceContext: string | null | undefined,
  payload: VocabularyItemPayload,
): Promise<void> {
  const key = normalizeLookupCacheKey(word, sentenceContext);
  if (!key) return;

  const supabase = tryServiceClient();
  if (!supabase) return;

  try {
    const identity = await cacheIdentity();
    await writeCacheRow(supabase, key.word, key.sentence, payload, identity);

    const resolved = normalizeLookupCacheKey(payload.term, sentenceContext);
    if (resolved && resolved.word !== key.word) {
      await writeCacheRow(
        supabase,
        resolved.word,
        key.sentence,
        payload,
        identity,
      );
    }
  } catch (error) {
    dictionaryLookupError("cache_set_failed", { word: key.word }, error);
  }
}
