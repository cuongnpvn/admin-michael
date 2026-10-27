import { GoogleGenAI } from "@google/genai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { withGeminiConcurrency } from "@/lib/admin/gemini/concurrency-limiter";
import {
  entriesToAnswerMap,
  formatAnswerKeyPromptAttachment,
  globalItemNumbersFromPart7ExportSet,
  loadReadingAnswerKeyForGlobalNumbers,
  type AnswerKeyLabel,
} from "@/lib/admin/answer-key/load-answer-keys";
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
  buildPart7ProcessResponseSchema,
  normalizeReadingPartProcessResponse,
  readingPartProcessResponseSchema,
  slimPart7ExportSetForProcess,
  stampPart7ProcessIdsFromExport,
} from "@/lib/admin/gemini/reading-part-process-response-schemas";
import type { GeminiJsonSchema } from "@/lib/admin/gemini/gemini-response-schema-shared";
import { retryWithBackoff } from "@/lib/admin/gemini/retry-with-backoff";
import { runGeminiModelCall } from "@/lib/admin/gemini/run-gemini-model-call";
import { copy } from "@/lib/copy/vi";
import {
  asProcessSets,
  assertQualifiedReadingPart7Process,
  assessReadingPart7Process,
} from "@/lib/admin/gemini/validate-reading-part-7-process";

const PART7_PROCESS_EXPORT_PREFIX = "EXTRACTED_PART7_EXPORT_JSON:";

export interface PassageTranslationExtractContext {
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

/** Parse export JSON into one object per passage set. */
export function parsePassageTranslationExportSets(exportJson: string): unknown[] {
  const parsed = JSON.parse(exportJson) as unknown;
  if (Array.isArray(parsed)) {
    if (parsed.length === 0) {
      throw new Error("Export JSON has no passage sets.");
    }
    return parsed;
  }
  if (parsed && typeof parsed === "object") {
    return [parsed];
  }
  throw new Error("Export JSON must be an array or object.");
}

/** Label extracted object data for the Part 7 process call (text-only, no PDF). */
export function buildPart7ProcessExportInput(exportSet: unknown): string {
  const slim = slimPart7ExportSetForProcess(exportSet);
  return `${PART7_PROCESS_EXPORT_PREFIX}\n${JSON.stringify([slim])}`;
}

function part7CountsFromExportSet(exportSet: unknown): {
  passageCount: number;
  questionCount: number;
} {
  if (!exportSet || typeof exportSet !== "object") {
    throw new Error("Export set must be an object.");
  }
  const record = exportSet as { passages?: unknown; questions?: unknown };
  const passageCount = Array.isArray(record.passages) ? record.passages.length : 0;
  const questionCount = Array.isArray(record.questions)
    ? record.questions.length
    : 0;
  if (passageCount < 1 || questionCount < 1) {
    throw new Error("Export set must include passages and questions.");
  }
  return { passageCount, questionCount };
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
    return normalizeReadingPartProcessResponse(parsed);
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

function assertPart7ProcessQualifiedForExport(
  processSets: unknown[],
  exportJson: string,
  label: string,
  expectedKeys?: Map<number, AnswerKeyLabel>,
  exportSetForStamp?: unknown,
): void {
  const issues = assessReadingPart7Process(
    processSets,
    exportJson,
    expectedKeys,
    exportSetForStamp,
  );
  if (issues.length === 0) return;

  const foundSetIds = (asProcessSets(processSets) ?? [])
    .map((set) =>
      typeof set.questionId === "string" ? set.questionId.trim() : "",
    )
    .filter(Boolean);

  geminiError("reading_part7_process_not_qualified", {
    moduleId: label,
    issueCount: issues.length,
    issuePreview: issues.slice(0, 8).map((issue) => issue.message),
    processSetCount: processSets.length,
    foundSetIds: foundSetIds.slice(0, 40),
  });
  assertQualifiedReadingPart7Process(
    processSets,
    exportJson,
    expectedKeys,
    exportSetForStamp,
  );
}

async function callGeminiForPassageTranslationSet(
  processInputText: string,
  exportJsonForQa: string,
  part: 6 | 7,
  model: string,
  label: string,
  responseSchema: GeminiJsonSchema,
  exportSetForStamp?: unknown,
  context?: PassageTranslationExtractContext,
  expectedKeys?: Map<number, AnswerKeyLabel>,
): Promise<unknown[]> {
  const startedAt = performance.now();

  geminiLog("call_start", {
    moduleId: label,
    model,
    exportJsonChars: exportJsonForQa.length,
    structuredOutput: true,
    schemaBytes: JSON.stringify(responseSchema).length,
  });

  const instructionId =
    part === 6 ? "reading-part-6-translation" : "reading-part-7-process";

  const instructions = await loadAdminInstructionContent(instructionId);
  geminiLog("instructions_loaded", {
    moduleId: label,
    instructionChars: instructions.length,
  });

  requireGeminiApiKey();
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const textParts = [instructions, processInputText];
  if (part === 7 && context && exportSetForStamp != null) {
    const globalNumbers =
      globalItemNumbersFromPart7ExportSet(exportSetForStamp);
    const entries = await loadReadingAnswerKeyForGlobalNumbers(
      context.supabase,
      context.bookId,
      context.testId,
      globalNumbers,
      7,
    );
    textParts.push(
      formatAnswerKeyPromptAttachment(
        context.bookId,
        context.testId,
        entries,
      ),
    );
  }

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

  let processSets = parseStructuredProcessOutput(outputText, label);

  if (part === 7) {
    if (exportSetForStamp == null) {
      throw new Error("Part 7 process requires an export set for ID stamping.");
    }
    processSets = stampPart7ProcessIdsFromExport(processSets, exportSetForStamp);
    assertPart7ProcessQualifiedForExport(
      processSets,
      exportJsonForQa,
      label,
      expectedKeys,
      exportSetForStamp,
    );
  }

  geminiLog("call_success", {
    moduleId: label,
    jsonChars: JSON.stringify(processSets).length,
    setCount: processSets.length,
    ...(part === 7 ? { readingPart7ProcessQualified: true } : {}),
    totalMs: elapsedMs(startedAt),
  });

  return processSets;
}

async function callGeminiForPart7ProcessBatched(
  exportJson: string,
  model: string,
  context?: PassageTranslationExtractContext,
): Promise<string> {
  const exportSets = parsePassageTranslationExportSets(exportJson);
  const mergedSets: unknown[] = [];

  for (let index = 0; index < exportSets.length; index += 1) {
    const exportSet = exportSets[index];
    const setExportJson = JSON.stringify([exportSet]);
    const processInput = buildPart7ProcessExportInput(exportSet);
    const { passageCount, questionCount } = part7CountsFromExportSet(exportSet);
    const responseSchema = buildPart7ProcessResponseSchema(
      passageCount,
      questionCount,
    );
    const label = `reading-part-7-process-${index + 1}/${exportSets.length}`;

    let expectedKeys: Map<number, AnswerKeyLabel> | undefined;
    if (context) {
      const globalNumbers = globalItemNumbersFromPart7ExportSet(exportSet);
      const entries = await loadReadingAnswerKeyForGlobalNumbers(
        context.supabase,
        context.bookId,
        context.testId,
        globalNumbers,
        7,
      );
      expectedKeys = entriesToAnswerMap(entries);
    }

    const setResult = await callGeminiForPassageTranslationSet(
      processInput,
      setExportJson,
      7,
      model,
      label,
      responseSchema,
      exportSet,
      context,
      expectedKeys,
    );
    mergedSets.push(...setResult);
  }

  assertPart7ProcessQualifiedForExport(
    mergedSets,
    exportJson,
    "reading-part-7-process",
  );

  return JSON.stringify(mergedSets);
}

async function callGeminiForPassageTranslation(
  exportJson: string,
  part: 6 | 7,
  model: string,
  context?: PassageTranslationExtractContext,
): Promise<string> {
  if (part === 7) {
    return callGeminiForPart7ProcessBatched(exportJson, model, context);
  }

  const processSets = await callGeminiForPassageTranslationSet(
    exportJson,
    exportJson,
    part,
    model,
    `reading-passage-translation-p${part}`,
    readingPartProcessResponseSchema(6),
  );

  return JSON.stringify(processSets);
}

export async function extractPassageTranslationsFromExportJson(
  exportJson: string,
  part: 6 | 7,
  context?: PassageTranslationExtractContext,
): Promise<string> {
  requireGeminiApiKey();

  if (part === 7 && !context) {
    throw new Error(copy.admin.exams.create.readingAnswerKeyBookTestRequired);
  }

  geminiLog("extract_start", {
    moduleId: `reading-passage-translation-p${part}`,
    exportJsonChars: exportJson.length,
    model: GEMINI_MODEL,
    maxRetries: GEMINI_MAX_RETRIES,
    ...(part === 7 ? { part7ProcessMode: "per_set_structured_output" } : {}),
    ...(context ? { bookId: context.bookId, testId: context.testId } : {}),
  });

  return withGeminiConcurrency(`reading-passage-translation-p${part}`, () =>
    retryWithBackoff(
      () =>
        callGeminiWithModelFallback(
          `reading-passage-translation-p${part}`,
          (model) =>
            callGeminiForPassageTranslation(exportJson, part, model, context),
        ),
      {
        label: `reading-passage-translation-p${part}`,
        maxAttempts: GEMINI_MAX_RETRIES,
        baseDelayMs: GEMINI_RETRY_BASE_MS,
        maxDelayMs: GEMINI_RETRY_MAX_MS,
      },
    ),
  );
}
