import { GoogleGenAI } from "@google/genai";
import { withGeminiConcurrency } from "@/lib/admin/gemini/concurrency-limiter";
import {
  GEMINI_MAX_RETRIES,
  GEMINI_MODEL,
  GEMINI_RETRY_BASE_MS,
  GEMINI_RETRY_MAX_MS,
} from "@/lib/admin/gemini/constants";
import { extractJsonFromGeminiOutput } from "@/lib/admin/gemini/extract-json-from-output";
import {
  elapsedMs,
  geminiError,
  geminiLog,
  previewText,
} from "@/lib/admin/gemini/gemini-log";
import { loadAdminInstructionContent } from "@/lib/admin/gemini/load-instruction-content";
import { callGeminiWithModelFallback } from "@/lib/admin/gemini/call-gemini-with-model-fallback";
import { retryWithBackoff } from "@/lib/admin/gemini/retry-with-backoff";
import { runGeminiModelCall } from "@/lib/admin/gemini/run-gemini-model-call";

function requireGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  return key;
}

async function callGeminiForListeningTranscriptTranslation(
  exportJson: string,
  part: 3 | 4,
  model: string,
): Promise<string> {
  const label = `listening-transcript-translation-p${part}`;
  const startedAt = performance.now();

  geminiLog("call_start", {
    moduleId: label,
    model,
    exportJsonChars: exportJson.length,
  });

  const instructions = await loadAdminInstructionContent(
    "listening-transcript-translation",
  );
  geminiLog("instructions_loaded", {
    moduleId: label,
    instructionChars: instructions.length,
  });

  requireGeminiApiKey();
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const outputText = await runGeminiModelCall(ai, {
    model,
    label,
    textParts: [instructions, exportJson],
  });

  geminiLog("output_received", {
    moduleId: label,
    outputChars: outputText.length,
    outputPreview: previewText(outputText),
  });

  let parsed: unknown;
  try {
    parsed = extractJsonFromGeminiOutput(outputText);
  } catch (error) {
    geminiError(
      "json_parse_failed",
      {
        moduleId: label,
        outputChars: outputText.length,
        outputPreview: previewText(outputText, 500),
      },
      error,
    );
    throw error;
  }

  const rawJson = JSON.stringify(parsed);
  geminiLog("call_success", {
    moduleId: label,
    jsonChars: rawJson.length,
    totalMs: elapsedMs(startedAt),
  });

  return rawJson;
}

export async function extractListeningTranscriptTranslationsFromExportJson(
  exportJson: string,
  part: 3 | 4,
): Promise<string> {
  requireGeminiApiKey();

  geminiLog("extract_start", {
    moduleId: `listening-transcript-translation-p${part}`,
    exportJsonChars: exportJson.length,
    model: GEMINI_MODEL,
    maxRetries: GEMINI_MAX_RETRIES,
  });

  return withGeminiConcurrency(`listening-transcript-translation-p${part}`, () =>
    retryWithBackoff(
      () =>
        callGeminiWithModelFallback(
          `listening-transcript-translation-p${part}`,
          (model) =>
            callGeminiForListeningTranscriptTranslation(exportJson, part, model),
        ),
      {
        label: `listening-transcript-translation-p${part}`,
        maxAttempts: GEMINI_MAX_RETRIES,
        baseDelayMs: GEMINI_RETRY_BASE_MS,
        maxDelayMs: GEMINI_RETRY_MAX_MS,
      },
    ),
  );
}
