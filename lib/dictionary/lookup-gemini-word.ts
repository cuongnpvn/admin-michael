import { GoogleGenAI } from "@google/genai";
import { extractJsonFromGeminiOutput } from "@/lib/admin/gemini/extract-json-from-output";
import { GEMINI_DICTIONARY_LOOKUP_SCHEMA } from "@/lib/dictionary/dictionary-gemini-response-schema";
import {
  dictionaryLookupError,
  dictionaryLookupLog,
  elapsedMs,
  previewText,
} from "@/lib/dictionary/dictionary-lookup-log";
import { buildDictionaryLookupUserPrompt } from "@/lib/dictionary/build-dictionary-lookup-user-prompt";
import {
  formatAiDictionaryLookup,
  type AiDictionaryLookupResult,
} from "@/lib/dictionary/format-ai-dictionary-lookup";
import { loadDictionaryLookupPrompt } from "@/lib/dictionary/load-dictionary-lookup-prompt";
import { normalizeDictionaryLookup } from "@/lib/dictionary/normalize-dictionary-lookup";
import {
  requireGeminiApiKey,
  requireTranslationAiModel,
} from "@/lib/dictionary/translation-ai-env";

const LOOKUP_LABEL = "dictionary-lookup-gemini";
const MAX_WORD_LENGTH = 100;

/**
 * Lean Gemini Tra cứu call: structured JSON only (no safety overrides / documents).
 */
export async function lookupGeminiDictionaryWord(
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

  const apiKey = requireGeminiApiKey();
  const model = requireTranslationAiModel();
  const instructions = await loadDictionaryLookupPrompt();
  const userPrompt = buildDictionaryLookupUserPrompt(
    trimmedWord,
    sentenceContext,
  );
  const startedAt = performance.now();

  dictionaryLookupLog("start", {
    label: LOOKUP_LABEL,
    provider: "gemini",
    model,
    word: trimmedWord,
    hasSentenceContext: Boolean(sentenceContext?.trim()),
  });

  const ai = new GoogleGenAI({ apiKey });
  let outputText: string;
  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: [instructions, "", userPrompt].join("\n"),
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: GEMINI_DICTIONARY_LOOKUP_SCHEMA,
      },
    });

    outputText = response.text?.trim() ?? "";
    if (!outputText) {
      throw new Error("Gemini returned empty output.");
    }
  } catch (error) {
    dictionaryLookupError(
      "api_failed",
      {
        label: LOOKUP_LABEL,
        provider: "gemini",
        model,
        word: trimmedWord,
        totalMs: elapsedMs(startedAt),
      },
      error,
    );
    throw error;
  }

  dictionaryLookupLog("output_received", {
    label: LOOKUP_LABEL,
    provider: "gemini",
    word: trimmedWord,
    outputChars: outputText.length,
    outputPreview: previewText(outputText, 500),
  });

  let parsed: unknown;
  try {
    parsed = extractJsonFromGeminiOutput(outputText);
  } catch (error) {
    dictionaryLookupError(
      "json_parse_failed",
      {
        label: LOOKUP_LABEL,
        provider: "gemini",
        word: trimmedWord,
        outputPreview: previewText(outputText, 500),
      },
      error,
    );
    throw error;
  }

  const normalized = normalizeDictionaryLookup(parsed, trimmedWord);
  if (!normalized) {
    dictionaryLookupError("normalize_failed", {
      label: LOOKUP_LABEL,
      provider: "gemini",
      word: trimmedWord,
      parsed,
    });
    throw new Error("Gemini dictionary lookup returned no Vietnamese meaning.");
  }

  const result = formatAiDictionaryLookup(normalized);
  dictionaryLookupLog("success", {
    label: LOOKUP_LABEL,
    provider: "gemini",
    model,
    word: trimmedWord,
    payload: result.payload,
    bodyChars: result.body.length,
    totalMs: elapsedMs(startedAt),
  });

  return result;
}
