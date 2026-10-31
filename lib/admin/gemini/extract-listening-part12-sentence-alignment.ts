import { GoogleGenAI } from "@google/genai";
import { withGeminiConcurrency } from "@/lib/admin/gemini/concurrency-limiter";
import {
  GEMINI_MAX_RETRIES,
  GEMINI_MODEL,
  GEMINI_RETRY_BASE_MS,
  GEMINI_RETRY_MAX_MS,
} from "@/lib/admin/gemini/constants";
import { createGeminiDocumentInput } from "@/lib/admin/gemini/create-document-input";
import { extractJsonFromGeminiOutput } from "@/lib/admin/gemini/extract-json-from-output";
import {
  elapsedMs,
  geminiError,
  geminiLog,
  previewText,
} from "@/lib/admin/gemini/gemini-log";
import { loadAdminInstructionContent } from "@/lib/admin/gemini/load-instruction-content";
import { callGeminiWithModelFallback } from "@/lib/admin/gemini/call-gemini-with-model-fallback";
import { buildPart12SentenceAlignmentResponseSchema } from "@/lib/admin/gemini/listening-part12-sentence-alignment-response-schema";
import { retryWithBackoff } from "@/lib/admin/gemini/retry-with-backoff";
import { runGeminiModelCall } from "@/lib/admin/gemini/run-gemini-model-call";
import type { AdminInstructionId } from "@/lib/admin/instructions/catalog";
import type { SpeechSentence } from "@/lib/listening/speech-sentences";

const SENTENCE_EXPORT_PREFIX = "SENTENCE_EXPORT_JSON:";

const INSTRUCTION_ID: Record<1 | 2, AdminInstructionId> = {
  1: "listening-part-1-sentence-alignment",
  2: "listening-part-2-sentence-alignment",
};

function requireGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  return key;
}

async function callGeminiForSentenceAlignment(
  part: 1 | 2,
  questionId: string,
  sentences: SpeechSentence[],
  audioBytes: Buffer,
  audioMimeType: string,
  model: string,
): Promise<unknown> {
  const label = INSTRUCTION_ID[part];
  const startedAt = performance.now();

  geminiLog("call_start", {
    moduleId: label,
    model,
    questionId,
    sentenceCount: sentences.length,
    audioBytes: audioBytes.length,
  });

  const instructions = await loadAdminInstructionContent(label);
  geminiLog("instructions_loaded", {
    moduleId: label,
    instructionChars: instructions.length,
  });

  requireGeminiApiKey();
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const documentInput = await createGeminiDocumentInput(
    ai,
    audioBytes,
    `${label}-${questionId}`,
    audioMimeType,
  );

  const exportJson = JSON.stringify({ questionId, sentences });
  const outputText = await runGeminiModelCall(ai, {
    model,
    label,
    textParts: [instructions, `${SENTENCE_EXPORT_PREFIX}\n${exportJson}`],
    documentInput,
    responseSchema: buildPart12SentenceAlignmentResponseSchema(part),
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

  geminiLog("call_success", {
    moduleId: label,
    jsonChars: JSON.stringify(parsed).length,
    totalMs: elapsedMs(startedAt),
  });

  return parsed;
}

export async function extractListeningPart12SentenceAlignment(input: {
  part: 1 | 2;
  questionId: string;
  sentences: SpeechSentence[];
  audioBytes: Buffer;
  audioMimeType?: string;
}): Promise<unknown> {
  const label = INSTRUCTION_ID[input.part];
  requireGeminiApiKey();

  geminiLog("extract_start", {
    moduleId: label,
    questionId: input.questionId,
    sentenceCount: input.sentences.length,
    model: GEMINI_MODEL,
    maxRetries: GEMINI_MAX_RETRIES,
  });

  return withGeminiConcurrency(label, () =>
    retryWithBackoff(
      () =>
        callGeminiWithModelFallback(label, (model) =>
          callGeminiForSentenceAlignment(
            input.part,
            input.questionId,
            input.sentences,
            input.audioBytes,
            input.audioMimeType ?? "audio/mpeg",
            model,
          ),
        ),
      {
        label,
        maxAttempts: GEMINI_MAX_RETRIES,
        baseDelayMs: GEMINI_RETRY_BASE_MS,
        maxDelayMs: GEMINI_RETRY_MAX_MS,
      },
    ),
  );
}
