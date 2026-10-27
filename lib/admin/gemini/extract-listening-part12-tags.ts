import { GoogleGenAI } from "@google/genai";
import {
  assertListeningPart12TagUpdatesComplete,
  mapListeningPart12TagUpdates,
} from "@/lib/admin/content/map-listening-part12-tag-updates";
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
import {
  runGeminiModelCall,
  type GeminiInlineImage,
} from "@/lib/admin/gemini/run-gemini-model-call";
import type {
  ListeningPart1TagExportEntry,
  ListeningPart2TagExportEntry,
} from "@/lib/admin/export/build-listening-part12-tag-export";

type ListeningPart12TagExportEntry =
  | ListeningPart1TagExportEntry
  | ListeningPart2TagExportEntry;

function requireGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  return key;
}

function parseExportEntries(
  part: 1 | 2,
  exportJson: string,
): ListeningPart12TagExportEntry[] {
  const parsed = JSON.parse(exportJson) as unknown;
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error(`Part ${part} tag export must be a non-empty array.`);
  }
  return parsed as ListeningPart12TagExportEntry[];
}

function buildResponseSchema(part: 1 | 2): GeminiJsonSchema {
  return {
    type: "object",
    properties: {
      questions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            ...geminiQuestionTagProperties(part),
          },
          required: ["id", ...geminiQuestionTagRequired(part)],
        },
      },
    },
    required: ["questions"],
  };
}

function questionsFromParsed(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object") {
    const questions = (parsed as { questions?: unknown }).questions;
    if (Array.isArray(questions)) return questions;
  }
  throw new Error("Listening tag response must be { questions } or an array.");
}

function stampIdsFromExport(
  questions: unknown[],
  exportEntries: ListeningPart12TagExportEntry[],
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

async function callGeminiForListeningPartTags(
  part: 1 | 2,
  exportJson: string,
  images: GeminiInlineImage[] | undefined,
  model: string,
): Promise<string> {
  const startedAt = performance.now();
  const exportEntries = parseExportEntries(part, exportJson);
  const allowedIds = new Set(exportEntries.map((entry) => entry.id));
  const label = `part${part}-tags`;
  const instructionId =
    part === 1 ? "listening-part-1-tags" : "listening-part-2-tags";
  const exportPrefix =
    part === 1 ? "PART1_TAG_EXPORT_JSON" : "PART2_TAG_EXPORT_JSON";

  if (part === 1 && (images?.length ?? 0) !== exportEntries.length) {
    throw new Error(
      `Part 1 tagging needs one photograph per question (${exportEntries.length} questions, ${images?.length ?? 0} images).`,
    );
  }

  geminiLog("call_start", {
    moduleId: label,
    model,
    exportJsonChars: exportJson.length,
    questionCount: exportEntries.length,
    inlineImageCount: images?.length ?? 0,
    structuredOutput: true,
  });

  const instructions = await loadAdminInstructionContent(instructionId);
  requireGeminiApiKey();
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const outputText = await runGeminiModelCall(ai, {
    model,
    label,
    textParts: [instructions, `${exportPrefix}:\n${exportJson}`],
    inlineImages: part === 1 ? images : undefined,
    responseSchema: buildResponseSchema(part),
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

  const questions = stampIdsFromExport(
    questionsFromParsed(parsed),
    exportEntries,
  );
  const mapped = mapListeningPart12TagUpdates(
    part,
    { questions },
    allowedIds,
  );
  const updates = assertListeningPart12TagUpdatesComplete(
    part,
    mapped,
    exportEntries.length,
  );
  const rawJson = JSON.stringify({ questions: updates });

  geminiLog("call_success", {
    moduleId: label,
    jsonChars: rawJson.length,
    questionCount: updates.length,
    totalMs: elapsedMs(startedAt),
  });

  return rawJson;
}

export async function extractListeningPart12TagsFromExport(input: {
  part: 1 | 2;
  exportJson: string;
  images?: GeminiInlineImage[];
}): Promise<string> {
  const label = `part${input.part}-tags`;
  requireGeminiApiKey();

  geminiLog("extract_start", {
    moduleId: label,
    exportJsonChars: input.exportJson.length,
    model: GEMINI_MODEL,
    maxRetries: GEMINI_MAX_RETRIES,
  });

  return withGeminiConcurrency(label, () =>
    retryWithBackoff(
      () =>
        callGeminiWithModelFallback(label, (model) =>
          callGeminiForListeningPartTags(
            input.part,
            input.exportJson,
            input.images,
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
