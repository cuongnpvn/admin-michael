import type { AiDictionaryLookupResult } from "@/lib/dictionary/format-ai-dictionary-lookup";
import { lookupDeepseekDictionaryWord } from "@/lib/dictionary/lookup-deepseek-word";
import { lookupGeminiDictionaryWord } from "@/lib/dictionary/lookup-gemini-word";
import { requireTranslationProvider } from "@/lib/dictionary/translation-ai-env";

/**
 * Route Tra cứu AI lookup by TRANSLATION_PROVIDER (gemini | deepseek).
 */
export async function lookupAiDictionaryWord(
  word: string,
  sentenceContext?: string | null,
): Promise<AiDictionaryLookupResult> {
  const provider = requireTranslationProvider();

  if (provider === "deepseek") {
    return lookupDeepseekDictionaryWord(word, sentenceContext);
  }

  return lookupGeminiDictionaryWord(word, sentenceContext);
}
