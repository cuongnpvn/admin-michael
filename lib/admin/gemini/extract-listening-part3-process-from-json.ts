import { GoogleGenAI } from "@google/genai";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  entriesToAnswerMap,
  formatAnswerKeyPromptAttachment,
  loadAnswerKeyForPart,
  type AnswerKeyLabel,
} from "@/lib/admin/answer-key/load-answer-keys";
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
import {
  buildPart3ProcessResponseSchema,
  normalizeListeningPart3ProcessResponse,
  slimPart3ExportGroupForProcess,
  stampPart3ProcessIdsFromExport,
} from "@/lib/admin/gemini/listening-part-process-response-schemas";
import { retryWithBackoff } from "@/lib/admin/gemini/retry-with-backoff";
import { runGeminiModelCall } from "@/lib/admin/gemini/run-gemini-model-call";
import {
  asProcessGroups,
  assertQualifiedListeningPart3Process,
  assessListeningPart3Process,
} from "@/lib/admin/gemini/validate-listening-part-3-process";
import { copy } from "@/lib/copy/vi";

const PART3_PROCESS_EXPORT_PREFIX = "EXTRACTED_PART3_EXPORT_JSON:";

export interface ListeningPart3ProcessExtractContext {
  supabase: SupabaseClient;
  bookId: string;
  testId: string;
}

function requireGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  return key;
}

export function parseListeningPart3ProcessExportGroups(
  exportJson: string,
): unknown[] {
  const parsed = JSON.parse(exportJson) as unknown;
  if (Array.isArray(parsed)) {
    if (parsed.length === 0) {
      throw new Error("Export JSON has no listening groups.");
    }
    return parsed;
  }
  if (parsed && typeof parsed === "object") {
    return [parsed];
  }
  throw new Error("Export JSON must be an array or object.");
}

export function buildPart3ProcessExportInput(exportGroup: unknown): string {
  const slim = slimPart3ExportGroupForProcess(exportGroup);
  return `${PART3_PROCESS_EXPORT_PREFIX}\n${JSON.stringify([slim])}`;
}

function questionCountFromExportGroup(exportGroup: unknown): number {
  if (!exportGroup || typeof exportGroup !== "object") {
    throw new Error("Export group must be an object.");
  }
  const questions = (exportGroup as { questions?: unknown }).questions;
  const questionCount = Array.isArray(questions) ? questions.length : 0;
  if (questionCount < 1) {
    throw new Error("Export group must include questions.");
  }
  return questionCount;
}

function globalItemNumbersFromExportGroup(exportGroup: unknown): number[] {
  if (!exportGroup || typeof exportGroup !== "object") return [];
  const questions = (exportGroup as { questions?: unknown }).questions;
  if (!Array.isArray(questions)) return [];

  const numbers: number[] = [];
  for (const question of questions) {
    if (!question || typeof question !== "object") continue;
    const globalItemNumber = (question as { globalItemNumber?: unknown })
      .globalItemNumber;
    if (typeof globalItemNumber === "number") {
      numbers.push(globalItemNumber);
    }
  }
  return numbers;
}

function parseStructuredProcessOutput(
  outputText: string,
  label: string,
): unknown[] {
  let parsed: unknown;
  try {
    try {
      parsed = JSON.parse(outputText);
    } catch {
      parsed = extractJsonFromGeminiOutput(outputText);
    }
    return normalizeListeningPart3ProcessResponse(parsed);
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
}

function assertPart3ProcessQualifiedForExport(
  processGroups: unknown[],
  exportJson: string,
  label: string,
  expectedKeys?: Map<number, AnswerKeyLabel>,
  exportGroupForStamp?: unknown,
): void {
  const issues = assessListeningPart3Process(
    processGroups,
    exportJson,
    expectedKeys,
    exportGroupForStamp,
  );
  if (issues.length === 0) return;

  const foundGroupIds = (asProcessGroups(processGroups) ?? [])
    .map((group) =>
      typeof group.questionId === "string" ? group.questionId.trim() : "",
    )
    .filter(Boolean);

  geminiError("listening_part3_process_not_qualified", {
    moduleId: label,
    issueCount: issues.length,
    issuePreview: issues.slice(0, 8).map((issue) => issue.message),
    processGroupCount: processGroups.length,
    foundGroupIds: foundGroupIds.slice(0, 40),
  });
  assertQualifiedListeningPart3Process(
    processGroups,
    exportJson,
    expectedKeys,
    exportGroupForStamp,
  );
}

async function callGeminiForPart3ProcessGroup(
  processInputText: string,
  exportJsonForQa: string,
  model: string,
  label: string,
  questionCount: number,
  exportGroupForStamp: unknown,
  context: ListeningPart3ProcessExtractContext,
  expectedKeys: Map<number, AnswerKeyLabel>,
  answerKeyEntries: Awaited<ReturnType<typeof loadAnswerKeyForPart>>,
): Promise<unknown[]> {
  const startedAt = performance.now();
  const responseSchema = buildPart3ProcessResponseSchema(questionCount);

  geminiLog("call_start", {
    moduleId: label,
    model,
    exportJsonChars: exportJsonForQa.length,
    structuredOutput: true,
    schemaBytes: JSON.stringify(responseSchema).length,
  });

  const instructions = await loadAdminInstructionContent(
    "listening-part-3-process",
  );
  geminiLog("instructions_loaded", {
    moduleId: label,
    instructionChars: instructions.length,
  });

  requireGeminiApiKey();
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const textParts = [
    instructions,
    processInputText,
    formatAnswerKeyPromptAttachment(
      context.bookId,
      context.testId,
      answerKeyEntries,
    ),
  ];

  const outputText = await runGeminiModelCall(ai, {
    model,
    label,
    textParts,
    responseSchema,
  });

  geminiLog("output_received", {
    moduleId: label,
    outputChars: outputText.length,
    outputPreview: previewText(outputText),
  });

  let processGroups = parseStructuredProcessOutput(outputText, label);
  processGroups = stampPart3ProcessIdsFromExport(
    processGroups,
    exportGroupForStamp,
  );
  assertPart3ProcessQualifiedForExport(
    processGroups,
    exportJsonForQa,
    label,
    expectedKeys,
    exportGroupForStamp,
  );

  geminiLog("call_success", {
    moduleId: label,
    jsonChars: JSON.stringify(processGroups).length,
    groupCount: processGroups.length,
    listeningPart3ProcessQualified: true,
    totalMs: elapsedMs(startedAt),
  });

  return processGroups;
}

async function callGeminiForPart3ProcessBatched(
  exportJson: string,
  model: string,
  context: ListeningPart3ProcessExtractContext,
): Promise<string> {
  const exportGroups = parseListeningPart3ProcessExportGroups(exportJson);
  const partEntries = await loadAnswerKeyForPart(
    context.supabase,
    context.bookId,
    context.testId,
    3,
  );
  const mergedGroups: unknown[] = [];

  for (let index = 0; index < exportGroups.length; index += 1) {
    const exportGroup = exportGroups[index];
    const setExportJson = JSON.stringify([exportGroup]);
    const processInput = buildPart3ProcessExportInput(exportGroup);
    const questionCount = questionCountFromExportGroup(exportGroup);
    const label = `listening-part-3-process-${index + 1}/${exportGroups.length}`;

    const globalNumbers = new Set(globalItemNumbersFromExportGroup(exportGroup));
    const groupEntries = partEntries.filter((entry) =>
      globalNumbers.has(entry.globalItemNumber),
    );
    const expectedKeys = entriesToAnswerMap(groupEntries);

    const groupResult = await callGeminiForPart3ProcessGroup(
      processInput,
      setExportJson,
      model,
      label,
      questionCount,
      exportGroup,
      context,
      expectedKeys,
      groupEntries,
    );
    mergedGroups.push(...groupResult);
  }

  assertPart3ProcessQualifiedForExport(
    mergedGroups,
    exportJson,
    "listening-part-3-process",
  );

  return JSON.stringify(mergedGroups);
}

export async function extractListeningPart3ProcessFromExportJson(
  exportJson: string,
  context: ListeningPart3ProcessExtractContext,
): Promise<string> {
  requireGeminiApiKey();

  if (!context) {
    throw new Error(copy.admin.exams.create.readingAnswerKeyBookTestRequired);
  }

  geminiLog("extract_start", {
    moduleId: "listening-part-3-process",
    exportJsonChars: exportJson.length,
    model: GEMINI_MODEL,
    maxRetries: GEMINI_MAX_RETRIES,
    part3ProcessMode: "per_group_structured_output",
    bookId: context.bookId,
    testId: context.testId,
  });

  return withGeminiConcurrency("listening-part-3-process", () =>
    retryWithBackoff(
      () =>
        callGeminiWithModelFallback("listening-part-3-process", (model) =>
          callGeminiForPart3ProcessBatched(exportJson, model, context),
        ),
      {
        label: "listening-part-3-process",
        maxAttempts: GEMINI_MAX_RETRIES,
        baseDelayMs: GEMINI_RETRY_BASE_MS,
        maxDelayMs: GEMINI_RETRY_MAX_MS,
      },
    ),
  );
}
