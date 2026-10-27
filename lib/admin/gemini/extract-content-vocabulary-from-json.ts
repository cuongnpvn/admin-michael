import { GoogleGenAI } from "@google/genai";
import { withGeminiConcurrency } from "@/lib/admin/gemini/concurrency-limiter";
import {
  buildContentVocabularyResponseSchema,
  normalizeContentVocabularyResponse,
} from "@/lib/admin/gemini/content-vocabulary-response-schema";
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
import type { ContentVocabularyPart } from "@/lib/content/content-vocabulary-export-schema";

const EXPORT_PREFIX = "CONTENT_VOCABULARY_EXPORT_JSON:";

function requireGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  return key;
}

function parseExportUnits(exportJson: string): unknown[] {
  const parsed = JSON.parse(exportJson) as unknown;
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Content vocabulary export must be a non-empty array.");
  }
  return parsed;
}

function stampQuestionIdsFromExport(
  units: unknown[],
  exportUnits: unknown[],
): unknown[] {
  return units.map((unit, index) => {
    const exportUnit = exportUnits[index];
    if (!unit || typeof unit !== "object") return unit;
    if (!exportUnit || typeof exportUnit !== "object") return unit;

    const exportRecord = exportUnit as {
      questionId?: unknown;
      groupId?: unknown;
    };
    const record = unit as Record<string, unknown>;
    const questionId =
      typeof exportRecord.questionId === "string"
        ? exportRecord.questionId
        : record.questionId;
    const groupId =
      typeof exportRecord.groupId === "string"
        ? exportRecord.groupId
        : record.groupId;

    return {
      ...record,
      questionId,
      ...(typeof groupId === "string" ? { groupId } : {}),
    };
  });
}

async function callGeminiForContentVocabulary(
  exportJson: string,
  part: ContentVocabularyPart,
  model: string,
): Promise<string> {
  const label = `content-vocabulary-p${part}`;
  const startedAt = performance.now();
  const exportUnits = parseExportUnits(exportJson);

  geminiLog("call_start", {
    moduleId: label,
    model,
    exportJsonChars: exportJson.length,
    unitCount: exportUnits.length,
    structuredOutput: true,
  });

  const instructions = await loadAdminInstructionContent("content-vocabulary");
  geminiLog("instructions_loaded", {
    moduleId: label,
    instructionChars: instructions.length,
  });

  requireGeminiApiKey();
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const responseSchema = buildContentVocabularyResponseSchema();

  const outputText = await runGeminiModelCall(ai, {
    model,
    label,
    textParts: [
      instructions,
      `${EXPORT_PREFIX}\n${exportJson}`,
    ],
    responseSchema,
  });

  geminiLog("output_received", {
    moduleId: label,
    outputChars: outputText.length,
    outputPreview: previewText(outputText),
  });

  let parsed: unknown;
  try {
    try {
      parsed = JSON.parse(outputText);
    } catch {
      parsed = extractJsonFromGeminiOutput(outputText);
    }
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

  let units = normalizeContentVocabularyResponse(parsed);
  if (units.length !== exportUnits.length) {
    // Prefer order alignment when counts match after soft stamp; otherwise keep model output.
    if (units.length === 0) {
      throw new Error(
        `Content vocabulary returned 0 units; expected ${exportUnits.length}.`,
      );
    }
  }

  if (units.length === exportUnits.length) {
    units = stampQuestionIdsFromExport(units, exportUnits);
  }

  const rawJson = JSON.stringify(units);
  geminiLog("call_success", {
    moduleId: label,
    jsonChars: rawJson.length,
    unitCount: units.length,
    totalMs: elapsedMs(startedAt),
  });

  return rawJson;
}

export async function extractContentVocabularyFromExportJson(
  exportJson: string,
  part: ContentVocabularyPart,
): Promise<string> {
  requireGeminiApiKey();
  const label = `content-vocabulary-p${part}`;

  geminiLog("extract_start", {
    moduleId: label,
    exportJsonChars: exportJson.length,
    model: GEMINI_MODEL,
    maxRetries: GEMINI_MAX_RETRIES,
  });

  return withGeminiConcurrency(label, () =>
    retryWithBackoff(
      () =>
        callGeminiWithModelFallback(label, (model) =>
          callGeminiForContentVocabulary(exportJson, part, model),
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
