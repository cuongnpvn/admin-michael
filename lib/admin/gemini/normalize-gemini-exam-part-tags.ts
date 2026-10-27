import { validateQuestionTagsComplete } from "@/lib/content/toeic-tags";
import {
  isListeningPart12TagValue,
  isListeningPart12TopicValue,
  validateListeningPart12QuestionTags,
} from "@/lib/content/listening-part-12-tags";
import {
  normalizeListeningPart1QuestionTags,
  normalizeListeningPart2QuestionTags,
} from "@/lib/content/normalize-listening-part12-tags";
import { resolveImportCorrectOptionLabel } from "@/lib/content/resolve-correct-option-label";

type QuestionRecord = Record<string, unknown> & {
  options: unknown[];
};

function isQuestionLike(value: unknown): value is QuestionRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Array.isArray((value as QuestionRecord).options);
}

function flattenGeminiQuestionTags(question: QuestionRecord): string[] {
  const tags: string[] = [];

  const existing = question.tags;
  if (Array.isArray(existing)) {
    for (const entry of existing) {
      if (typeof entry === "string" && entry.trim()) tags.push(entry.trim());
    }
    if (tags.length >= 1 && tags.every(isListeningPart12TagValue)) {
      const topic =
        typeof question.topic === "string" ? question.topic.trim() : "";
      if (topic && isListeningPart12TopicValue(topic) && !tags.includes(topic)) {
        tags.unshift(topic);
      }
      return tags;
    }
    if (tags.length >= 2) return tags;
  }

  const topic = question.topic;
  if (typeof topic === "string" && topic.trim()) {
    tags.push(topic.trim());
  }

  const skills = question.skills;
  if (Array.isArray(skills)) {
    for (const entry of skills) {
      if (typeof entry === "string" && entry.trim()) tags.push(entry.trim());
    }
  } else if (typeof question.skill === "string" && question.skill.trim()) {
    tags.push(question.skill.trim());
  }

  const focus = question.focus;
  if (typeof focus === "string" && focus.trim()) {
    tags.push(focus.trim());
  }

  return tags;
}

function normalizeQuestionTags(question: QuestionRecord): void {
  const tags = flattenGeminiQuestionTags(question);
  if (tags.length > 0) {
    question.tags = tags;
  }

  delete question.skills;
  delete question.skill;
  delete question.focus;
  delete question.topic;
}

function normalizeQuestionCorrectOptionLabel(question: QuestionRecord): void {
  const resolved = resolveImportCorrectOptionLabel({
    correctOptionLabel: question.correctOptionLabel,
    correctAnswer: question.correctAnswer,
    answer: question.answer,
    explanation: question.explanation,
    options: Array.isArray(question.options)
      ? (question.options as Array<{ label?: unknown }>)
      : [],
  });

  if (resolved) {
    question.correctOptionLabel = resolved;
  }

  delete question.correctAnswer;
  delete question.answer;
}

function normalizeListeningPart12ItemTags(item: QuestionRecord): void {
  const question = item.question;
  if (!isQuestionLike(question)) return;

  const partNumber = typeof item.part === "number" ? item.part : undefined;
  const transcript =
    typeof item.questionTranscript === "string"
      ? item.questionTranscript
      : typeof question.prompt === "string"
        ? question.prompt
        : "";
  const visualCaption =
    typeof item.visualCaption === "string" ? item.visualCaption : undefined;

  if (partNumber === 2 || transcript) {
    question.tags = normalizeListeningPart2QuestionTags(question.tags, transcript);
    return;
  }

  if (partNumber === 1 || visualCaption !== undefined) {
    question.tags = normalizeListeningPart1QuestionTags(question.tags, visualCaption);
  }
}

function walkQuestions(node: unknown, visit: (question: QuestionRecord) => void): void {
  if (!node || typeof node !== "object") return;

  if (Array.isArray(node)) {
    for (const entry of node) walkQuestions(entry, visit);
    return;
  }

  const record = node as Record<string, unknown>;

  if (isQuestionLike(record)) {
    visit(record);
    return;
  }

  if (
    record.question &&
    typeof record.question === "object" &&
    !Array.isArray(record.question)
  ) {
    normalizeListeningPart12ItemTags(record as QuestionRecord);
    visit(record.question as QuestionRecord);
    return;
  }

  const nestKeys = ["groups", "questions", "passageSets", "parts", "items"];
  for (const key of nestKeys) {
    const child = record[key];
    if (!Array.isArray(child)) continue;
    for (const entry of child as unknown[]) walkQuestions(entry, visit);
  }
}

/** Convert Gemini `skills` / `focus` / `topic` fields into import `tags[]`. */
export function normalizeGeminiExamPartTags(json: unknown): unknown {
  walkQuestions(json, (question) => {
    normalizeQuestionTags(question);
    normalizeQuestionCorrectOptionLabel(question);
  });
  return json;
}

export function countQuestionsWithInvalidTags(json: unknown): number {
  let invalid = 0;
  walkQuestions(json, (question) => {
    const tags = Array.isArray(question.tags)
      ? question.tags.filter((entry): entry is string => typeof entry === "string")
      : [];
    if (!questionTagsAreValid(tags)) invalid += 1;
  });
  return invalid;
}

function questionTagsAreValid(tags: string[]): boolean {
  if (
    validateListeningPart12QuestionTags(1, tags).ok ||
    validateListeningPart12QuestionTags(2, tags).ok
  ) {
    return true;
  }
  return validateQuestionTagsComplete(tags).ok;
}
