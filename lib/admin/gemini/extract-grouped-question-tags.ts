import { GoogleGenAI } from "@google/genai";
import {
  assertQuestionTagUpdatesComplete,
  mapQuestionTagUpdates,
  type GroupedTagPart,
  type QuestionTagUpdate,
} from "@/lib/admin/content/map-question-tag-updates";
import { withGeminiConcurrency } from "@/lib/admin/gemini/concurrency-limiter";
import { callGeminiWithModelFallback } from "@/lib/admin/gemini/call-gemini-with-model-fallback";
import {
  GEMINI_EXTRACT_CONCURRENCY,
  GEMINI_MAX_RETRIES,
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
import { runWithConcurrency } from "@/lib/admin/gemini/run-with-concurrency";
import type { GroupedTagQuestion, GroupedTagUnit } from "@/lib/admin/export/build-grouped-question-tag-export";
import type { AdminInstructionId } from "@/lib/admin/instructions/catalog";

const EXPORT_PREFIX = "GROUP_TAG_EXPORT_JSON:";

function requireGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  return key;
}

function instructionId(part: GroupedTagPart): AdminInstructionId {
  return part === 6 ? "reading-part-6-tags" : "comprehension-question-tags";
}

function sourcePreamble(part: GroupedTagPart): string {
  switch (part) {
    case 3:
      return "You are tagging TOEIC Listening Part 3. Each unit is one conversation: `transcript` plus its questions.";
    case 4:
      return "You are tagging TOEIC Listening Part 4. Each unit is one talk: `transcript` plus its questions.";
    case 6:
      return "You are tagging TOEIC Reading Part 6. Each unit is one passage set.";
    case 7:
      return "You are tagging TOEIC Reading Part 7. Each unit is one passage set: `passages`, `passageCount`, and its questions. Use skill `compare` when `passageCount` is greater than 1 and the question contrasts those passages.";
  }
}

function parseUnits(exportJson: string): GroupedTagUnit[] {
  const parsed = JSON.parse(exportJson) as unknown;
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Grouped tag export must be a non-empty array.");
  }
  return parsed as GroupedTagUnit[];
}

function questionsOf(unit: GroupedTagUnit): GroupedTagQuestion[] {
  return Array.isArray(unit.questions) ? unit.questions : [];
}

function buildResponseSchema(
  part: GroupedTagPart,
  questionCount: number,
): GeminiJsonSchema {
  return {
    type: "object",
    properties: {
      questions: {
        type: "array",
        minItems: questionCount,
        maxItems: questionCount,
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

function normalizeQuestions(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object") {
    const questions = (parsed as { questions?: unknown }).questions;
    if (Array.isArray(questions)) return questions;
  }
  throw new Error("Grouped tags response must be { questions } or an array.");
}

function stampIds(
  questions: unknown[],
  exportQuestions: GroupedTagQuestion[],
): unknown[] {
  if (questions.length !== exportQuestions.length) return questions;
  return questions.map((question, index) => {
    if (!question || typeof question !== "object") return question;
    return {
      ...(question as Record<string, unknown>),
      id: exportQuestions[index].id,
    };
  });
}

async function callGeminiForUnit(input: {
  part: GroupedTagPart;
  unit: GroupedTagUnit;
  model: string;
  prompt: string;
  ai: GoogleGenAI;
  index: number;
  total: number;
}): Promise<QuestionTagUpdate[]> {
  const exportQuestions = questionsOf(input.unit);
  const allowedIds = new Set(exportQuestions.map((question) => question.id));
  const label = `grouped-tags-part-${input.part}-${input.index + 1}/${input.total}`;
  const unitJson = JSON.stringify(input.unit);
  const startedAt = performance.now();

  geminiLog("call_start", {
    moduleId: label,
    model: input.model,
    part: input.part,
    questionCount: exportQuestions.length,
    structuredOutput: true,
  });

  const outputText = await runGeminiModelCall(input.ai, {
    model: input.model,
    label,
    textParts: [input.prompt, `${EXPORT_PREFIX}\n${unitJson}`],
    responseSchema: buildResponseSchema(input.part, exportQuestions.length),
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

  const questions = stampIds(normalizeQuestions(parsed), exportQuestions);
  const mapped = mapQuestionTagUpdates(
    input.part,
    { questions },
    allowedIds,
  );
  const updates = assertQuestionTagUpdatesComplete(
    input.part,
    mapped,
    exportQuestions.length,
  );

  geminiLog("call_success", {
    moduleId: label,
    questionCount: updates.length,
    totalMs: elapsedMs(startedAt),
  });

  return updates;
}

export async function extractGroupedQuestionTagsFromExport(input: {
  part: GroupedTagPart;
  exportJson: string;
}): Promise<string> {
  const apiKey = requireGeminiApiKey();
  const units = parseUnits(input.exportJson).filter(
    (unit) => questionsOf(unit).length > 0,
  );
  if (units.length === 0) {
    throw new Error(`Part ${input.part} tag export has no questions.`);
  }
  const label = `grouped-tags-part-${input.part}`;
  const startedAt = performance.now();

  geminiLog("extract_start", {
    moduleId: label,
    part: input.part,
    unitCount: units.length,
    maxRetries: GEMINI_MAX_RETRIES,
  });

  const instructions = await loadAdminInstructionContent(instructionId(input.part));
  const prompt = `${sourcePreamble(input.part)}\n\n${instructions}`;
  const ai = new GoogleGenAI({ apiKey });

  const batches = await runWithConcurrency(
    units,
    GEMINI_EXTRACT_CONCURRENCY,
    (unit, index) =>
      withGeminiConcurrency(`${label}-${index + 1}`, () =>
        retryWithBackoff(
          () =>
            callGeminiWithModelFallback(label, (model) =>
              callGeminiForUnit({
                part: input.part,
                unit,
                model,
                prompt,
                ai,
                index,
                total: units.length,
              }),
            ),
          {
            label,
            maxAttempts: GEMINI_MAX_RETRIES,
            baseDelayMs: GEMINI_RETRY_BASE_MS,
            maxDelayMs: GEMINI_RETRY_MAX_MS,
          },
        ),
      ),
  );

  const questions = batches.flat();
  geminiLog("extract_success", {
    moduleId: label,
    questionCount: questions.length,
    totalMs: elapsedMs(startedAt),
  });

  return JSON.stringify({ questions });
}
