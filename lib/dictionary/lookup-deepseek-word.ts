import { createDeepSeek } from "@ai-sdk/deepseek";
import { generateObject } from "ai";
import { dictionaryLookupZodSchema } from "@/lib/dictionary/dictionary-lookup-schema";
import {
  dictionaryLookupError,
  dictionaryLookupLog,
  elapsedMs,
} from "@/lib/dictionary/dictionary-lookup-log";
import { buildDictionaryLookupUserPrompt } from "@/lib/dictionary/build-dictionary-lookup-user-prompt";
import {
  formatAiDictionaryLookup,
  type AiDictionaryLookupResult,
} from "@/lib/dictionary/format-ai-dictionary-lookup";
import { loadDictionaryLookupPrompt } from "@/lib/dictionary/load-dictionary-lookup-prompt";
import { normalizeDictionaryLookup } from "@/lib/dictionary/normalize-dictionary-lookup";
import {
  requireDeepseekApiKey,
  requireTranslationAiModel,
} from "@/lib/dictionary/translation-ai-env";

const LOOKUP_LABEL = "dictionary-lookup-deepseek";
const MAX_WORD_LENGTH = 100;
/** Avoid truncated JSON per DeepSeek JSON Output docs. */
const MAX_OUTPUT_TOKENS = 2048;

/**
 * DeepSeek Tra cứu via AI SDK generateObject (JSON mode + Zod schema).
 */
export async function lookupDeepseekDictionaryWord(
  word: string,
  sentenceContext?: string | null,
): Promise<AiDictionaryLookupResult> {
  const trimmedWord = word.trim();
  if (!trimmedWord) {
    throw new Error("Word is required.");
  }
  if (trimmedWord.length > MAX_WORD_LENGTH) {
    throw new Error("Word is too long.");
  }

  const apiKey = requireDeepseekApiKey();
  const modelId = requireTranslationAiModel();
  const instructions = await loadDictionaryLookupPrompt();
  const userPrompt = buildDictionaryLookupUserPrompt(
    trimmedWord,
    sentenceContext,
  );
  const startedAt = performance.now();

  dictionaryLookupLog("start", {
    label: LOOKUP_LABEL,
    provider: "deepseek",
    model: modelId,
    word: trimmedWord,
    hasSentenceContext: Boolean(sentenceContext?.trim()),
  });

  const deepseek = createDeepSeek({ apiKey });

  let object: unknown;
  try {
    const result = await generateObject({
      model: deepseek(modelId),
      schema: dictionaryLookupZodSchema,
      system: instructions,
      prompt: userPrompt,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    });
    object = result.object;
  } catch (error) {
    dictionaryLookupError(
      "api_failed",
      {
        label: LOOKUP_LABEL,
        provider: "deepseek",
        model: modelId,
        word: trimmedWord,
        totalMs: elapsedMs(startedAt),
      },
      error,
    );
    throw error;
  }

  dictionaryLookupLog("parsed", {
    label: LOOKUP_LABEL,
    provider: "deepseek",
    word: trimmedWord,
    parsed: object,
  });

  const normalized = normalizeDictionaryLookup(object, trimmedWord);
  if (!normalized) {
    dictionaryLookupError("normalize_failed", {
      label: LOOKUP_LABEL,
      provider: "deepseek",
      word: trimmedWord,
      parsed: object,
    });
    throw new Error(
      "DeepSeek dictionary lookup returned no Vietnamese meaning.",
    );
  }

  const formatted = formatAiDictionaryLookup(normalized);
  dictionaryLookupLog("success", {
    label: LOOKUP_LABEL,
    provider: "deepseek",
    model: modelId,
    word: trimmedWord,
    payload: formatted.payload,
    bodyChars: formatted.body.length,
    totalMs: elapsedMs(startedAt),
  });

  return formatted;
}
