import type { SupabaseClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";
import type { AdminInstructionId } from "@/lib/admin/instructions/catalog";
import {
  assertExtractMatchesAnswerKey,
  entriesToAnswerMap,
  formatAnswerKeyPromptAttachment,
  loadAnswerKeyForPart,
  loadAnswerKeyForParts,
  type AnswerKeyEntry,
  type AnswerKeyLabel,
  type ToeicAnswerKeyPart,
} from "@/lib/admin/answer-key/load-answer-keys";
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
  countQuestionsWithInvalidTags,
  normalizeGeminiExamPartTags,
} from "@/lib/admin/gemini/normalize-gemini-exam-part-tags";
import {
  countListeningPartGroupsAndQuestions,
  LISTENING_PART12_OFFICIAL_SPEC,
  LISTENING_PART_OFFICIAL_SPEC,
  type ListeningPart34,
} from "@/lib/content/listening-part-specs";
import {
  countReadingPassageSetQuestions,
  READING_PART_OFFICIAL_SPEC,
} from "@/lib/content/reading-part-specs";
import {
  readingPart7SegmentById,
  READING_PART7_MULTI_SEGMENT,
  READING_PART7_SINGLE_SEGMENT,
} from "@/lib/content/reading-part-7-segments";
import {
  elapsedMs,
  geminiError,
  geminiLog,
  previewText,
} from "@/lib/admin/gemini/gemini-log";
import { loadAdminInstructionContent } from "@/lib/admin/gemini/load-instruction-content";
import { readingPartGeminiResponseFormat } from "@/lib/admin/gemini/reading-part-response-schemas";
import {
  assessReadingPart5Extract,
  assertQualifiedReadingPart5Extract,
} from "@/lib/admin/gemini/validate-reading-part-5-extract";
import { assertQualifiedReadingPart7ExtractSegment } from "@/lib/admin/gemini/validate-reading-part-7-extract";
import { mergeReadingPart7Extracts } from "@/lib/admin/gemini/merge-reading-part-7-extracts";
import { isEntranceTestBook } from "@/lib/content/catalog-ids";
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

export interface ExtractExamPartContext {
  supabase: SupabaseClient;
  bookId: string;
  testId: string;
}

/** Parts whose extract step attaches DB answer keys and validates labels. */
function answerKeyPartsForExtractModule(
  moduleId: AdminInstructionId,
): ToeicAnswerKeyPart[] | null {
  if (moduleId === "listening-parts-1-2") return [1, 2];
  // Part 3 attaches answer keys at the process step (like Part 7).
  if (moduleId === "listening-part-4") return [4];
  if (moduleId === "reading-part-5") return [5];
  if (moduleId === "reading-part-6") return [6];
  return null;
}

async function buildAnswerKeyAttachment(
  context: ExtractExamPartContext | undefined,
  moduleId: AdminInstructionId,
): Promise<{
  attachment: string | null;
  expectedKeys: Map<number, AnswerKeyLabel>;
  validationPart: ToeicAnswerKeyPart | null;
}> {
  const parts = answerKeyPartsForExtractModule(moduleId);
  if (!parts || !context) {
    return {
      attachment: null,
      expectedKeys: new Map(),
      validationPart: null,
    };
  }

  let entries: AnswerKeyEntry[];
  if (parts.length === 1) {
    entries = await loadAnswerKeyForPart(
      context.supabase,
      context.bookId,
      context.testId,
      parts[0],
    );
  } else {
    entries = await loadAnswerKeyForParts(
      context.supabase,
      context.bookId,
      context.testId,
      parts,
    );
  }

  return {
    attachment: formatAnswerKeyPromptAttachment(
      context.bookId,
      context.testId,
      entries,
    ),
    expectedKeys: entriesToAnswerMap(entries),
    validationPart: parts[0],
  };
}

async function callGeminiForPdf(
  moduleId: AdminInstructionId,
  pdfBytes: Buffer,
  model: string,
  context?: ExtractExamPartContext,
): Promise<string> {
  const label = moduleId;
  const startedAt = performance.now();
  const pdfSizeKb = Math.round(pdfBytes.length / 1024);

  geminiLog("call_start", {
    moduleId,
    model,
    pdfSizeKb,
  });

  const instructions = await loadAdminInstructionContent(moduleId);
  geminiLog("instructions_loaded", {
    moduleId,
    instructionChars: instructions.length,
  });

  const {
    attachment: answerKeyAttachment,
    expectedKeys,
    validationPart,
  } = await buildAnswerKeyAttachment(context, moduleId);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const documentInput = await createGeminiDocumentInput(
    ai,
    pdfBytes,
    label,
    "application/pdf",
  );
  const responseFormat = readingPartGeminiResponseFormat(moduleId);

  const textParts = answerKeyAttachment
    ? [instructions, answerKeyAttachment]
    : [instructions];

  const outputText = await runGeminiModelCall(ai, {
    model,
    label: moduleId,
    textParts,
    documentInput,
    responseSchema: responseFormat?.schema,
  });

  geminiLog("output_received", {
    moduleId,
    outputChars: outputText.length,
    outputPreview: previewText(outputText),
  });

  let parsed: unknown;
  try {
    parsed = extractJsonFromGeminiOutput(outputText);
    parsed = normalizeGeminiExamPartTags(parsed);
  } catch (error) {
    geminiError(
      "json_parse_failed",
      {
        moduleId,
        outputChars: outputText.length,
        outputPreview: previewText(outputText, 500),
      },
      error,
    );
    throw error;
  }

  const skipOfficialQuestionNumberQa = context
    ? isEntranceTestBook(context.bookId)
    : false;

  if (moduleId === "reading-part-5") {
    assertQualifiedReadingPart5Extract(parsed, expectedKeys, {
      skipOfficialQuestionCount: skipOfficialQuestionNumberQa,
    });
  }

  if (validationPart != null && expectedKeys.size > 0) {
    assertExtractMatchesAnswerKey(parsed, expectedKeys, validationPart);
  }

  const part7SegmentSpec = readingPart7SegmentById(moduleId);
  if (part7SegmentSpec) {
    assertQualifiedReadingPart7ExtractSegment(parsed, part7SegmentSpec, {
      skipOfficialQuestionNumberQa,
    });
  }

  const rawJson = JSON.stringify(parsed);
  const invalidTagQuestions = countQuestionsWithInvalidTags(parsed);
  const listeningCounts = listeningPartCountsFromExtract(moduleId, parsed);
  const readingCounts = readingPartCountsFromExtract(moduleId, parsed);
  const part5Issues =
    moduleId === "reading-part-5" ? assessReadingPart5Extract(parsed) : null;
  geminiLog("call_success", {
    moduleId,
    jsonChars: rawJson.length,
    invalidTagQuestions,
    ...listeningCounts,
    ...readingCounts,
    ...(part5Issues
      ? {
          readingPart5Qualified: part5Issues.length === 0,
          readingPart5IssueCount: part5Issues.length,
        }
      : {}),
    ...(part7SegmentSpec ? { readingPart7ExtractQualified: true } : {}),
    totalMs: elapsedMs(startedAt),
  });

  return rawJson;
}

function listeningPartCountsFromExtract(
  moduleId: AdminInstructionId,
  parsed: unknown,
): Record<string, number | boolean | undefined> {
  if (moduleId === "listening-parts-1-2") {
    const parts = Array.isArray(parsed)
      ? parsed
      : parsed &&
          typeof parsed === "object" &&
          Array.isArray((parsed as { parts?: unknown }).parts)
        ? (parsed as { parts: unknown[] }).parts
        : null;

    if (!parts || parts.length === 0) return {};

    let p1Items = 0;
    let p2Items = 0;
    for (const entry of parts) {
      if (!entry || typeof entry !== "object") continue;
      const record = entry as { part?: unknown; items?: unknown[] };
      if (record.part === 1 && Array.isArray(record.items)) {
        p1Items = record.items.length;
      }
      if (record.part === 2 && Array.isArray(record.items)) {
        p2Items = record.items.length;
      }
    }

    const spec1 = LISTENING_PART12_OFFICIAL_SPEC[1];
    const spec2 = LISTENING_PART12_OFFICIAL_SPEC[2];
    return {
      listeningPart1Items: p1Items,
      listeningPart2Items: p2Items,
      listeningPart1Complete: p1Items === spec1.items,
      listeningPart2Complete: p2Items === spec2.items,
      listeningExpectedPart1Items: spec1.items,
      listeningExpectedPart2Items: spec2.items,
    };
  }

  if (!parsed || typeof parsed !== "object") return {};

  const record = parsed as Record<string, unknown>;

  const part: ListeningPart34 | null =
    moduleId === "listening-part-3" ? 3 : moduleId === "listening-part-4" ? 4 : null;
  if (!part) return {};

  const groups = record.groups;
  if (!Array.isArray(groups)) return {};

  const spec = LISTENING_PART_OFFICIAL_SPEC[part];
  const { groups: groupCount, questions: questionCount } =
    countListeningPartGroupsAndQuestions({
      part,
      groups: groups as { questions: unknown[] }[],
    });

  return {
    listeningGroups: groupCount,
    listeningQuestions: questionCount,
    listeningComplete:
      groupCount === spec.groups && questionCount === spec.questions,
    listeningExpectedGroups: spec.groups,
    listeningExpectedQuestions: spec.questions,
  };
}

function readingPartCountsFromExtract(
  moduleId: AdminInstructionId,
  parsed: unknown,
): Record<string, number | boolean | undefined> {
  const segmentSpec = readingPart7SegmentById(moduleId);
  if (segmentSpec) {
    if (!parsed || typeof parsed !== "object") return {};

    const record = parsed as Record<string, unknown>;
    const passageSets = record.passageSets;
    if (!Array.isArray(passageSets)) return {};

    const { passageSets: setCount, questions: questionCount } =
      countReadingPassageSetQuestions({
        passageSets: passageSets as { questions: unknown[] }[],
      });

    return {
      readingPassageSets: setCount,
      readingQuestions: questionCount,
      readingComplete: questionCount === segmentSpec.questions,
      readingExpectedQuestions: segmentSpec.questions,
    };
  }

  const part =
    moduleId === "reading-part-5"
      ? 5
      : moduleId === "reading-part-6"
        ? 6
        : null;
  if (!part || !parsed || typeof parsed !== "object") return {};

  const record = parsed as Record<string, unknown>;
  const spec = READING_PART_OFFICIAL_SPEC[part];

  if (spec.shape === "questions") {
    const questions = record.questions;
    const questionCount = Array.isArray(questions) ? questions.length : 0;
    return {
      readingQuestions: questionCount,
      readingComplete: questionCount === spec.questions,
      readingExpectedQuestions: spec.questions,
    };
  }

  const passageSets = record.passageSets;
  if (!Array.isArray(passageSets)) return {};

  const { passageSets: setCount, questions: questionCount } =
    countReadingPassageSetQuestions({
      passageSets: passageSets as { questions: unknown[] }[],
    });

  return {
    readingPassageSets: setCount,
    readingQuestions: questionCount,
    readingComplete: questionCount === spec.questions,
    readingExpectedQuestions: spec.questions,
  };
}

export async function extractExamPartFromPdfBuffer(
  moduleId: AdminInstructionId,
  pdfBytes: Buffer,
  context?: ExtractExamPartContext,
): Promise<string> {
  requireGeminiApiKey();

  geminiLog("extract_start", {
    moduleId,
    pdfSizeKb: Math.round(pdfBytes.length / 1024),
    model: GEMINI_MODEL,
    maxRetries: GEMINI_MAX_RETRIES,
    ...(context
      ? { bookId: context.bookId, testId: context.testId, hasAnswerKeyContext: true }
      : {}),
  });

  return withGeminiConcurrency(moduleId, () =>
    retryWithBackoff(
      () =>
        callGeminiWithModelFallback(moduleId, (model) =>
          callGeminiForPdf(moduleId, pdfBytes, model, context),
        ),
      {
        label: moduleId,
        maxAttempts: GEMINI_MAX_RETRIES,
        baseDelayMs: GEMINI_RETRY_BASE_MS,
        maxDelayMs: GEMINI_RETRY_MAX_MS,
      },
    ),
  );
}

export async function extractReadingPart7FromPdfBuffers(
  singlePdfBytes: Buffer,
  multiPdfBytes: Buffer,
  context?: ExtractExamPartContext,
): Promise<string> {
  requireGeminiApiKey();

  geminiLog("extract_start", {
    moduleId: "reading-part-7",
    segment: "both",
    singlePdfSizeKb: Math.round(singlePdfBytes.length / 1024),
    multiPdfSizeKb: Math.round(multiPdfBytes.length / 1024),
    model: GEMINI_MODEL,
    maxRetries: GEMINI_MAX_RETRIES,
    ...(context
      ? { bookId: context.bookId, testId: context.testId }
      : {}),
  });

  const [singleRawJson, multiRawJson] = await Promise.all([
    extractExamPartFromPdfBuffer(
      READING_PART7_SINGLE_SEGMENT.id,
      singlePdfBytes,
      context,
    ),
    extractExamPartFromPdfBuffer(
      READING_PART7_MULTI_SEGMENT.id,
      multiPdfBytes,
      context,
    ),
  ]);

  const mergedRawJson = mergeReadingPart7Extracts(singleRawJson, multiRawJson, {
    skipOfficialQuestionNumberQa: context
      ? isEntranceTestBook(context.bookId)
      : false,
  });

  geminiLog("reading_part7_merge_success", {
    moduleId: "reading-part-7",
    singleJsonChars: singleRawJson.length,
    multiJsonChars: multiRawJson.length,
    mergedJsonChars: mergedRawJson.length,
  });

  return mergedRawJson;
}
