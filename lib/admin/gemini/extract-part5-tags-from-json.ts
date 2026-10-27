import { GoogleGenAI } from "@google/genai";
import { withGeminiConcurrency } from "@/lib/admin/gemini/concurrency-limiter";
import { callGeminiWithModelFallback } from "@/lib/admin/gemini/call-gemini-with-model-fallback";
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
import {
  geminiQuestionTagProperties,
  geminiQuestionTagRequired,
} from "@/lib/admin/gemini/gemini-question-tags-schema";
import type { GeminiJsonSchema } from "@/lib/admin/gemini/gemini-response-schema-shared";
import { loadAdminInstructionContent } from "@/lib/admin/gemini/load-instruction-content";
import { retryWithBackoff } from "@/lib/admin/gemini/retry-with-backoff";
import { runGeminiModelCall } from "@/lib/admin/gemini/run-gemini-model-call";
import {
  assertPart5TagUpdatesComplete,
  mapPart5TagUpdates,
} from "@/lib/admin/content/map-part5-tag-updates";
import type { Part5TagExportEntry } from "@/lib/admin/export/build-part5-tag-export";

const EXPORT_PREFIX = "PART5_TAG_EXPORT_JSON:";
const LABEL = "part5-tags";

function requireGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  return key;
}

function parseExportEntries(exportJson: string): Part5TagExportEntry[] {
  const parsed = JSON.parse(exportJson) as unknown;
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Part 5 tag export must be a non-empty array.");
  }
  return parsed as Part5TagExportEntry[];
}

function buildPart5TagsResponseSchema(): GeminiJsonSchema {
  return {
    type: "object",
    properties: {
      questions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            ...geminiQuestionTagProperties(5),
          },
          required: ["id", ...geminiQuestionTagRequired(5)],
        },
      },
    },
    required: ["questions"],
  };
}

function normalizePart5TagsResponse(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object") {
    const questions = (parsed as { questions?: unknown }).questions;
    if (Array.isArray(questions)) return questions;
  }
  throw new Error("Part 5 tags response must be { questions } or an array.");
}

function stampIdsFromExport(
  questions: unknown[],
  exportEntries: Part5TagExportEntry[],
): unknown[] {
  if (questions.length !== exportEntries.length) return questions;

  return questions.map((question, index) => {
    if (!question || typeof question !== "object") return question;
    return {
      ...(question as Record<string, unknown>),
      id: exportEntries[index].id,
    };
  });
}

async function callGeminiForPart5Tags(
  exportJson: string,
  model: string,
): Promise<string> {
  const startedAt = performance.now();
  const exportEntries = parseExportEntries(exportJson);
  const allowedIds = new Set(exportEntries.map((entry) => entry.id));

  geminiLog("call_start", {
    moduleId: LABEL,
    model,
    exportJsonChars: exportJson.length,
    questionCount: exportEntries.length,
    structuredOutput: true,
  });

  const instructions = await loadAdminInstructionContent("reading-part-5-tags");
  requireGeminiApiKey();
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const outputText = await runGeminiModelCall(ai, {
    model,
    label: LABEL,
    textParts: [instructions, `${EXPORT_PREFIX}\n${exportJson}`],
    responseSchema: buildPart5TagsResponseSchema(),
  });

  geminiLog("output_received", {
    moduleId: LABEL,
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
        moduleId: LABEL,
        outputChars: outputText.length,
        outputPreview: previewText(outputText, 500),
      },
      error,
    );
    throw error;
  }

  const questions = stampIdsFromExport(
    normalizePart5TagsResponse(parsed),
    exportEntries,
  );
  const mapped = mapPart5TagUpdates({ questions }, allowedIds);
  const updates = assertPart5TagUpdatesComplete(mapped, exportEntries.length);

  const rawJson = JSON.stringify({ questions: updates });
  geminiLog("call_success", {
    moduleId: LABEL,
    jsonChars: rawJson.length,
    questionCount: updates.length,
    totalMs: elapsedMs(startedAt),
  });

  return rawJson;
}

export async function extractPart5TagsFromExportJson(
  exportJson: string,
): Promise<string> {
  requireGeminiApiKey();

  geminiLog("extract_start", {
    moduleId: LABEL,
    exportJsonChars: exportJson.length,
    model: GEMINI_MODEL,
    maxRetries: GEMINI_MAX_RETRIES,
  });

  return withGeminiConcurrency(LABEL, () =>
    retryWithBackoff(
      () =>
        callGeminiWithModelFallback(LABEL, (model) =>
          callGeminiForPart5Tags(exportJson, model),
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
