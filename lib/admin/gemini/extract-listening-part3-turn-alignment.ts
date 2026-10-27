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
import { buildPart3TurnAlignmentResponseSchema } from "@/lib/admin/gemini/listening-part3-turn-alignment-response-schema";
import { retryWithBackoff } from "@/lib/admin/gemini/retry-with-backoff";
import { runGeminiModelCall } from "@/lib/admin/gemini/run-gemini-model-call";
import type { SpeakerTurn } from "@/lib/listening/speaker-turns";

const LABEL = "listening-part-3-turn-alignment";
const TURN_EXPORT_PREFIX = "TURN_EXPORT_JSON:";

function requireGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  return key;
}

async function callGeminiForTurnAlignment(
  questionId: string,
  turns: SpeakerTurn[],
  audioBytes: Buffer,
  audioMimeType: string,
  model: string,
): Promise<unknown> {
  const startedAt = performance.now();

  geminiLog("call_start", {
    moduleId: LABEL,
    model,
    questionId,
    turnCount: turns.length,
    audioBytes: audioBytes.length,
  });

  const instructions = await loadAdminInstructionContent(
    "listening-part-3-turn-alignment",
  );
  geminiLog("instructions_loaded", {
    moduleId: LABEL,
    instructionChars: instructions.length,
  });

  requireGeminiApiKey();
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const documentInput = await createGeminiDocumentInput(
    ai,
    audioBytes,
    `${LABEL}-${questionId}`,
    audioMimeType,
  );

  const exportJson = JSON.stringify({ questionId, turns });
  const outputText = await runGeminiModelCall(ai, {
    model,
    label: LABEL,
    textParts: [instructions, `${TURN_EXPORT_PREFIX}\n${exportJson}`],
    documentInput,
    responseSchema: buildPart3TurnAlignmentResponseSchema(),
  });

  geminiLog("output_received", {
    moduleId: LABEL,
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
        moduleId: LABEL,
        outputChars: outputText.length,
        outputPreview: previewText(outputText, 500),
      },
      error,
    );
    throw error;
  }

  geminiLog("call_success", {
    moduleId: LABEL,
    jsonChars: JSON.stringify(parsed).length,
    totalMs: elapsedMs(startedAt),
  });

  return parsed;
}

export async function extractListeningPart3TurnAlignment(input: {
  questionId: string;
  turns: SpeakerTurn[];
  audioBytes: Buffer;
  audioMimeType?: string;
}): Promise<unknown> {
  requireGeminiApiKey();

  geminiLog("extract_start", {
    moduleId: LABEL,
    questionId: input.questionId,
    turnCount: input.turns.length,
    model: GEMINI_MODEL,
    maxRetries: GEMINI_MAX_RETRIES,
  });

  return withGeminiConcurrency(LABEL, () =>
    retryWithBackoff(
      () =>
        callGeminiWithModelFallback(LABEL, (model) =>
          callGeminiForTurnAlignment(
            input.questionId,
            input.turns,
            input.audioBytes,
            input.audioMimeType ?? "audio/mpeg",
            model,
          ),
        ),
      {
        label: LABEL,
        maxAttempts: GEMINI_MAX_RETRIES,
        baseDelayMs: GEMINI_RETRY_BASE_MS,
        maxDelayMs: GEMINI_RETRY_MAX_MS,
      },
    ),
  );
}
