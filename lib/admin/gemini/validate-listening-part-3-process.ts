import { extractJsonFromGeminiOutput } from "@/lib/admin/gemini/extract-json-from-output";
import { normalizeListeningPart3ProcessResponse } from "@/lib/admin/gemini/listening-part-process-response-schemas";
import type { AnswerKeyLabel } from "@/lib/admin/answer-key/load-answer-keys";
import { copy } from "@/lib/copy/vi";

const EXPLANATION_ANSWER_RE =
  /Đáp án\s+(?:đúng|phù hợp nhất)\s+là\s*(?:\*\*)?([A-D])(?:\*\*)?/i;

export type ListeningPart3ProcessQualificationCode =
  | "invalid_json"
  | "missing_group"
  | "missing_topic"
  | "missing_question"
  | "missing_answer"
  | "invalid_answer"
  | "answer_key_mismatch"
  | "missing_explanation"
  | "explanation_answer_mismatch"
  | "missing_hint"
  | "hint_reveals_answer"
  | "missing_skills_or_focus";

export interface ListeningPart3ProcessValidationIssue {
  code: ListeningPart3ProcessQualificationCode;
  questionId?: string;
  message: string;
}

interface ExportOption {
  label: string;
  text: string;
}

interface ExportQuestion {
  questionId: string;
  globalItemNumber?: number;
  options: ExportOption[];
}

interface ExportGroup {
  questionId: string;
  questions: ExportQuestion[];
}

interface ProcessQuestion {
  questionId?: unknown;
  correctOptionLabel?: unknown;
  hint?: unknown;
  explanation?: unknown;
  skills?: unknown;
  focus?: unknown;
}

interface ProcessGroup {
  questionId?: unknown;
  topic?: unknown;
  questions?: unknown;
}

function parseJson(value: unknown): unknown {
  if (typeof value === "string") {
    return extractJsonFromGeminiOutput(value);
  }
  return value;
}

function asExportGroups(parsed: unknown): ExportGroup[] | null {
  const entries = Array.isArray(parsed) ? parsed : [parsed];
  const groups: ExportGroup[] = [];

  for (const entry of entries) {
    if (!entry || typeof entry !== "object") return null;
    const record = entry as Record<string, unknown>;
    if (typeof record.questionId !== "string" || !record.questionId.trim()) {
      return null;
    }

    const questions = Array.isArray(record.questions) ? record.questions : [];
    const exportQuestions: ExportQuestion[] = [];
    for (const question of questions) {
      if (!question || typeof question !== "object") return null;
      const q = question as {
        questionId?: unknown;
        globalItemNumber?: unknown;
        options?: unknown;
      };
      if (typeof q.questionId !== "string" || !q.questionId.trim()) return null;

      const options = Array.isArray(q.options) ? q.options : [];
      const exportOptions: ExportOption[] = [];
      for (const option of options) {
        if (!option || typeof option !== "object") return null;
        const label = (option as { label?: unknown }).label;
        const text = (option as { text?: unknown }).text;
        if (typeof label !== "string" || typeof text !== "string") return null;
        exportOptions.push({ label: label.trim().toUpperCase(), text });
      }

      exportQuestions.push({
        questionId: q.questionId.trim(),
        globalItemNumber:
          typeof q.globalItemNumber === "number"
            ? q.globalItemNumber
            : undefined,
        options: exportOptions,
      });
    }

    groups.push({
      questionId: record.questionId.trim(),
      questions: exportQuestions,
    });
  }

  return groups;
}

export function asProcessGroups(parsed: unknown): ProcessGroup[] | null {
  try {
    const groups = normalizeListeningPart3ProcessResponse(parsed);
    if (
      groups.length === 0 ||
      !groups.every((entry) => entry && typeof entry === "object")
    ) {
      return null;
    }
    return groups as ProcessGroup[];
  } catch {
    return null;
  }
}

function explanationAnswerLabel(explanation: unknown): string | null {
  if (!explanation || typeof explanation !== "object") return null;
  const reasoning = (explanation as { reasoning?: unknown }).reasoning;
  if (typeof reasoning !== "string") return null;
  const match = reasoning.match(EXPLANATION_ANSWER_RE);
  return match?.[1]?.toUpperCase() ?? null;
}

function hintRevealsAnswer(hint: string, answerLabel: string): boolean {
  const escaped = answerLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`đáp án\\s*(là\\s*)?${escaped}\\b`, "i"),
    new RegExp(`chọn\\s*\\*{0,2}${escaped}\\*{0,2}`, "i"),
    new RegExp(`→\\s*\\*{0,2}${escaped}\\*{0,2}`, "i"),
    new RegExp(`nhãn\\s*${escaped}\\b`, "i"),
  ];
  return patterns.some((pattern) => pattern.test(hint));
}

export function assessListeningPart3Process(
  processParsed: unknown,
  exportSource: unknown,
  expectedKeys?: Map<number, AnswerKeyLabel>,
  exportGroupForStamp?: unknown,
): ListeningPart3ProcessValidationIssue[] {
  const issues: ListeningPart3ProcessValidationIssue[] = [];

  let exportGroups: ExportGroup[] | null = null;
  try {
    const parsed =
      exportGroupForStamp != null
        ? [exportGroupForStamp]
        : parseJson(exportSource);
    exportGroups = asExportGroups(parsed);
  } catch {
    exportGroups = null;
  }

  if (!exportGroups) {
    return [
      {
        code: "invalid_json",
        message: copy.admin.exams.create.listeningPart3ProcessInvalidJson,
      },
    ];
  }

  const processGroups = asProcessGroups(processParsed);
  if (!processGroups) {
    return [
      {
        code: "invalid_json",
        message: copy.admin.exams.create.listeningPart3ProcessInvalidJson,
      },
    ];
  }

  if (processGroups.length !== exportGroups.length) {
    issues.push({
      code: "missing_group",
      message: copy.admin.exams.create.listeningPart3ProcessNotQualified(
        1,
        `group count ${processGroups.length} != export ${exportGroups.length}`,
      ),
    });
  }

  const count = Math.min(processGroups.length, exportGroups.length);
  for (let index = 0; index < count; index += 1) {
    const processGroup = processGroups[index];
    const exportGroup = exportGroups[index];
    const groupQuestionId =
      typeof processGroup.questionId === "string" &&
      processGroup.questionId.trim()
        ? processGroup.questionId.trim()
        : exportGroup.questionId;

    const topic =
      typeof processGroup.topic === "string" ? processGroup.topic.trim() : "";
    if (!topic) {
      issues.push({
        code: "missing_topic",
        questionId: groupQuestionId,
        message:
          copy.admin.exams.create.listeningPart3ProcessMissingTopic(
            groupQuestionId,
          ),
      });
    }

    const processQuestions = Array.isArray(processGroup.questions)
      ? (processGroup.questions as ProcessQuestion[])
      : [];

    if (processQuestions.length !== exportGroup.questions.length) {
      issues.push({
        code: "missing_question",
        questionId: groupQuestionId,
        message: copy.admin.exams.create.listeningPart3ProcessNotQualified(
          1,
          `questions ${processQuestions.length} != export ${exportGroup.questions.length} for ${groupQuestionId}`,
        ),
      });
    }

    const questionCount = Math.min(
      processQuestions.length,
      exportGroup.questions.length,
    );

    for (let qIndex = 0; qIndex < questionCount; qIndex += 1) {
      const processQuestion = processQuestions[qIndex];
      const exportQuestion = exportGroup.questions[qIndex];
      const questionId =
        typeof processQuestion.questionId === "string" &&
        processQuestion.questionId.trim()
          ? processQuestion.questionId.trim()
          : exportQuestion.questionId;

      const answerLabel =
        typeof processQuestion.correctOptionLabel === "string"
          ? processQuestion.correctOptionLabel
          : "";
      if (!answerLabel.trim()) {
        issues.push({
          code: "missing_answer",
          questionId,
          message:
            copy.admin.exams.create.listeningPart3ProcessMissingAnswer(
              questionId,
            ),
        });
        continue;
      }

      const normalizedAnswer = answerLabel.trim().toUpperCase();
      const optionLabels = new Set(
        exportQuestion.options.map((option) => option.label),
      );
      if (optionLabels.size > 0 && !optionLabels.has(normalizedAnswer)) {
        issues.push({
          code: "invalid_answer",
          questionId,
          message: copy.admin.exams.create.listeningPart3ProcessInvalidAnswer(
            questionId,
            answerLabel,
          ),
        });
        continue;
      }

      if (
        expectedKeys &&
        exportQuestion.globalItemNumber != null &&
        expectedKeys.has(exportQuestion.globalItemNumber)
      ) {
        const expected = expectedKeys.get(exportQuestion.globalItemNumber);
        if (expected && expected !== normalizedAnswer) {
          issues.push({
            code: "answer_key_mismatch",
            questionId,
            message: copy.admin.answerKey.errors.processMismatchAgainstKey(
              exportQuestion.globalItemNumber,
              expected,
              normalizedAnswer,
            ),
          });
        }
      }

      const skills = Array.isArray(processQuestion.skills)
        ? processQuestion.skills.filter(
            (entry): entry is string =>
              typeof entry === "string" && entry.trim().length > 0,
          )
        : [];
      const focus =
        typeof processQuestion.focus === "string"
          ? processQuestion.focus.trim()
          : "";
      if (skills.length < 1 || !focus) {
        issues.push({
          code: "missing_skills_or_focus",
          questionId,
          message:
            copy.admin.exams.create.listeningPart3ProcessMissingSkillsOrFocus(
              questionId,
            ),
        });
      }

      const explanation = processQuestion.explanation;
      const reasoning =
        explanation &&
        typeof explanation === "object" &&
        typeof (explanation as { reasoning?: unknown }).reasoning === "string"
          ? (explanation as { reasoning: string }).reasoning.trim()
          : "";
      const references =
        explanation &&
        typeof explanation === "object" &&
        Array.isArray((explanation as { reference?: unknown }).reference)
          ? (explanation as { reference: unknown[] }).reference.filter(
              (entry) => typeof entry === "string" && entry.trim().length > 0,
            )
          : [];

      if (!reasoning || references.length === 0) {
        issues.push({
          code: "missing_explanation",
          questionId,
          message:
            copy.admin.exams.create.listeningPart3ProcessMissingExplanation(
              questionId,
            ),
        });
      } else {
        const explanationLabel = explanationAnswerLabel(explanation);
        if (!explanationLabel) {
          issues.push({
            code: "explanation_answer_mismatch",
            questionId,
            message:
              copy.admin.exams.create.listeningPart3ProcessMissingExplanationAnswer(
                questionId,
              ),
          });
        } else if (explanationLabel !== normalizedAnswer) {
          issues.push({
            code: "explanation_answer_mismatch",
            questionId,
            message:
              copy.admin.exams.create.listeningPart3ProcessExplanationMismatch(
                questionId,
                normalizedAnswer,
                explanationLabel,
              ),
          });
        }
      }

      const hint =
        typeof processQuestion.hint === "string"
          ? processQuestion.hint.trim()
          : "";
      if (!hint) {
        issues.push({
          code: "missing_hint",
          questionId,
          message:
            copy.admin.exams.create.listeningPart3ProcessMissingHint(questionId),
        });
      } else if (hintRevealsAnswer(hint, normalizedAnswer)) {
        issues.push({
          code: "hint_reveals_answer",
          questionId,
          message:
            copy.admin.exams.create.listeningPart3ProcessHintRevealsAnswer(
              questionId,
              normalizedAnswer,
            ),
        });
      }
    }
  }

  return issues;
}

export function assertQualifiedListeningPart3Process(
  processParsed: unknown,
  exportSource: unknown,
  expectedKeys?: Map<number, AnswerKeyLabel>,
  exportGroupForStamp?: unknown,
): void {
  const issues = assessListeningPart3Process(
    processParsed,
    exportSource,
    expectedKeys,
    exportGroupForStamp,
  );
  if (issues.length === 0) return;

  const preview = issues
    .slice(0, 5)
    .map((issue) => issue.message)
    .join(" | ");
  throw new Error(
    copy.admin.exams.create.listeningPart3ProcessNotQualified(
      issues.length,
      preview,
    ),
  );
}
