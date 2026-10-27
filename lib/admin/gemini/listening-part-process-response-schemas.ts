/**
 * Gemini structured-output schemas for Listening Part 3 process.
 *
 * Root is `{ groups: [...] }`. Callers unwrap to a plain array before import.
 * questionId is stamped from the export in code.
 */

import {
  GEMINI_EXPLANATION_SCHEMA,
  GEMINI_OPTION_LABEL,
  GEMINI_VOCABULARY_SCHEMA,
  type GeminiJsonSchema,
} from "@/lib/admin/gemini/gemini-response-schema-shared";
import { geminiQuestionTagProperties } from "@/lib/admin/gemini/gemini-question-tags-schema";

function part3ProcessQuestionSchema(): GeminiJsonSchema {
  return {
    type: "object",
    description: "Solved answer + study enrichment for one Part 3 question.",
    properties: {
      correctOptionLabel: GEMINI_OPTION_LABEL,
      hint: {
        type: "string",
        description:
          "Vietnamese hint — spoiler-free (must not reveal the answer letter).",
      },
      explanation: GEMINI_EXPLANATION_SCHEMA,
      ...geminiQuestionTagProperties(3),
    },
    required: [
      "correctOptionLabel",
      "hint",
      "explanation",
      "skills",
      "focus",
    ],
  };
}

function part3ProcessGroupSchema(questionCount?: number): GeminiJsonSchema {
  const questions: GeminiJsonSchema = {
    type: "array",
    minItems: questionCount ?? 1,
    items: part3ProcessQuestionSchema(),
  };
  if (questionCount != null) {
    questions.maxItems = questionCount;
  }

  return {
    type: "object",
    properties: {
      topic: {
        type: "string",
        description:
          "Short English conversation title (2–6 words), e.g. 'Office supplies order'.",
      },
      vocabulary: GEMINI_VOCABULARY_SCHEMA,
      questions,
    },
    required: ["topic", "vocabulary", "questions"],
  };
}

/** Per-group schema with exact question count from the export. */
export function buildPart3ProcessResponseSchema(
  questionCount: number,
): GeminiJsonSchema {
  return {
    type: "object",
    description:
      "Listening Part 3 process response for one export conversation group.",
    properties: {
      groups: {
        type: "array",
        minItems: 1,
        maxItems: 1,
        items: part3ProcessGroupSchema(questionCount),
      },
    },
    required: ["groups"],
  };
}

/**
 * Unwrap structured `{ groups: [...] }` (or legacy bare array / single object)
 * into the plain array import expects.
 */
export function normalizeListeningPart3ProcessResponse(
  parsed: unknown,
): unknown[] {
  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (parsed && typeof parsed === "object") {
    const record = parsed as Record<string, unknown>;
    if (Array.isArray(record.groups)) {
      return record.groups;
    }
    if (
      typeof record.questionId === "string" ||
      typeof record.topic === "string" ||
      Array.isArray(record.questions)
    ) {
      return [parsed];
    }
  }

  throw new Error("Gemini process response was not a groups array or object.");
}

interface ExportQuestion {
  questionId?: unknown;
  globalItemNumber?: unknown;
  prompt?: unknown;
  options?: unknown;
}

interface ExportGroup {
  questionId?: unknown;
  transcript?: unknown;
  questions?: unknown;
}

/** Slim export for the Gemini prompt — content only (no join-key IDs). */
export function slimPart3ExportGroupForProcess(exportGroup: unknown): unknown {
  if (!exportGroup || typeof exportGroup !== "object") {
    throw new Error("Export group must be an object.");
  }
  const group = exportGroup as ExportGroup;
  const questions = Array.isArray(group.questions) ? group.questions : [];

  return {
    transcript: typeof group.transcript === "string" ? group.transcript : "",
    questions: questions.map((question) => {
      const q = question as ExportQuestion;
      return {
        globalItemNumber: q.globalItemNumber,
        prompt: typeof q.prompt === "string" ? q.prompt : "",
        options: Array.isArray(q.options) ? q.options : [],
      };
    }),
  };
}

/**
 * Stamp questionId from the export onto Gemini process output by array index.
 */
export function stampPart3ProcessIdsFromExport(
  processGroups: unknown[],
  exportGroup: unknown,
): unknown[] {
  if (!exportGroup || typeof exportGroup !== "object") {
    throw new Error("Export group must be an object for ID stamping.");
  }
  const exportRecord = exportGroup as ExportGroup;
  const exportQuestions = Array.isArray(exportRecord.questions)
    ? (exportRecord.questions as ExportQuestion[])
    : [];
  const setQuestionId =
    typeof exportRecord.questionId === "string"
      ? exportRecord.questionId.trim()
      : "";

  if (!setQuestionId) {
    throw new Error("Export group is missing questionId.");
  }

  if (processGroups.length === 0) {
    throw new Error("Process response has no groups to stamp.");
  }

  return processGroups.map((processGroup) => {
    if (!processGroup || typeof processGroup !== "object") {
      throw new Error("Process group must be an object.");
    }
    const group = processGroup as Record<string, unknown>;
    const processQuestions = Array.isArray(group.questions)
      ? group.questions
      : [];

    if (processQuestions.length !== exportQuestions.length) {
      throw new Error(
        `Process question count ${processQuestions.length} != export ${exportQuestions.length}.`,
      );
    }

    return {
      ...group,
      questionId: setQuestionId,
      questions: processQuestions.map((question, index) => {
        const questionId = exportQuestions[index]?.questionId;
        if (typeof questionId !== "string" || !questionId.trim()) {
          throw new Error(`Export question ${index} is missing questionId.`);
        }
        return {
          ...(question && typeof question === "object" ? question : {}),
          questionId: questionId.trim(),
        };
      }),
    };
  });
}
