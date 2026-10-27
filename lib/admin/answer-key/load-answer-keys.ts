import type { SupabaseClient } from "@supabase/supabase-js";
import { copy } from "@/lib/copy/vi";
import { adminAnswerKeysPath } from "@/lib/admin/admin-paths";
import {
  toeicPartFromGlobalItemNumber,
  toeicPartGlobalItemRange,
} from "@/lib/content/toeic-global-item-number";

export const ANSWER_KEY_PROMPT_PREFIX =
  "ANSWER_KEY_JSON (authoritative — do not solve from PDF):";

export type AnswerKeyLabel = "A" | "B" | "C" | "D";

export interface AnswerKeyEntry {
  globalItemNumber: number;
  part: number;
  answerLabel: AnswerKeyLabel;
}

export class AnswerKeyCoverageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnswerKeyCoverageError";
  }
}

export class AnswerKeyMismatchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnswerKeyMismatchError";
  }
}

interface AnswerKeyRow {
  global_item_number: number;
  part: string;
  answer_label: string;
}

function parsePartNumber(part: string): number {
  return Number.parseInt(part, 10);
}

function parseAnswerLabel(label: string): AnswerKeyLabel {
  const normalized = label.trim().toUpperCase();
  if (
    normalized !== "A" &&
    normalized !== "B" &&
    normalized !== "C" &&
    normalized !== "D"
  ) {
    throw new Error(`Invalid answer label in database: ${label}`);
  }
  return normalized;
}

export async function loadAnswerKeys(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
): Promise<AnswerKeyEntry[]> {
  const { data, error } = await supabase
    .from("answer_keys")
    .select("global_item_number, part, answer_label")
    .eq("book_id", bookId)
    .eq("test_id", testId)
    .order("global_item_number");

  if (error) throw error;

  return ((data ?? []) as AnswerKeyRow[]).map((row) => ({
    globalItemNumber: row.global_item_number,
    part: parsePartNumber(row.part),
    answerLabel: parseAnswerLabel(row.answer_label),
  }));
}

export function entriesToAnswerMap(
  entries: AnswerKeyEntry[],
): Map<number, AnswerKeyLabel> {
  return new Map(
    entries.map((entry) => [entry.globalItemNumber, entry.answerLabel]),
  );
}

export function assertAnswerKeyCoverage(
  entries: AnswerKeyEntry[],
  options: {
    bookId: string;
    testId: string;
    part?: number;
    requiredGlobalNumbers?: number[];
  },
): void {
  const byGlobal = entriesToAnswerMap(entries);
  const required =
    options.requiredGlobalNumbers ??
    (options.part != null
      ? buildGlobalNumberRange(options.part)
      : []);

  if (required.length === 0) return;

  const missing = required.filter((number) => !byGlobal.has(number));
  if (missing.length === 0) return;

  const partLabel = options.part ?? null;
  throw new AnswerKeyCoverageError(
    copy.admin.answerKey.errors.missingForPart(
      options.bookId,
      options.testId,
      partLabel,
      missing.slice(0, 8),
      missing.length,
      adminAnswerKeysPath(),
    ),
  );
}

function buildGlobalNumberRange(part: number): number[] {
  const { first, last } = toeicPartGlobalItemRange(part);
  return Array.from({ length: last - first + 1 }, (_, index) => first + index);
}

export type ToeicAnswerKeyPart = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export async function loadAnswerKeyForPart(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  part: ToeicAnswerKeyPart,
): Promise<AnswerKeyEntry[]> {
  const { first, last } = toeicPartGlobalItemRange(part);
  const all = await loadAnswerKeys(supabase, bookId, testId);
  const entries = all.filter(
    (entry) =>
      entry.globalItemNumber >= first && entry.globalItemNumber <= last,
  );

  assertAnswerKeyCoverage(entries, { bookId, testId, part });
  return entries;
}

/** @deprecated Prefer {@link loadAnswerKeyForPart}. */
export async function loadReadingAnswerKeyForPart(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  part: 5 | 6 | 7,
): Promise<AnswerKeyEntry[]> {
  return loadAnswerKeyForPart(supabase, bookId, testId, part);
}

export async function loadAnswerKeyForParts(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  parts: ToeicAnswerKeyPart[],
): Promise<AnswerKeyEntry[]> {
  const all = await loadAnswerKeys(supabase, bookId, testId);
  const required = parts.flatMap((part) => buildGlobalNumberRange(part));
  const requiredSet = new Set(required);
  const entries = all.filter((entry) =>
    requiredSet.has(entry.globalItemNumber),
  );

  for (const part of parts) {
    const partEntries = entries.filter((entry) => {
      const { first, last } = toeicPartGlobalItemRange(part);
      return entry.globalItemNumber >= first && entry.globalItemNumber <= last;
    });
    assertAnswerKeyCoverage(partEntries, { bookId, testId, part });
  }

  return entries;
}

export async function loadReadingAnswerKeyForGlobalNumbers(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  globalNumbers: number[],
  part: 7,
): Promise<AnswerKeyEntry[]> {
  const uniqueNumbers = [...new Set(globalNumbers)].sort((a, b) => a - b);
  const all = await loadAnswerKeys(supabase, bookId, testId);
  const entries = all.filter((entry) =>
    uniqueNumbers.includes(entry.globalItemNumber),
  );

  assertAnswerKeyCoverage(entries, {
    bookId,
    testId,
    part,
    requiredGlobalNumbers: uniqueNumbers,
  });

  return entries;
}

export function formatAnswerKeyPromptAttachment(
  bookId: string,
  testId: string,
  entries: AnswerKeyEntry[],
): string {
  const answers = Object.fromEntries(
    entries
      .slice()
      .sort((left, right) => left.globalItemNumber - right.globalItemNumber)
      .map((entry) => [String(entry.globalItemNumber), entry.answerLabel]),
  );

  return `${ANSWER_KEY_PROMPT_PREFIX}\n${JSON.stringify({
    bookId,
    testId,
    answers,
  })}`;
}

export function globalItemNumbersFromPart7ExportSet(exportSet: unknown): number[] {
  if (!exportSet || typeof exportSet !== "object") return [];

  const questions = (exportSet as { questions?: unknown }).questions;
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

function pushLabeledQuestion(
  question: unknown,
  into: Array<{ globalItemNumber: number; correctOptionLabel: string }>,
): void {
  if (!question || typeof question !== "object") return;
  const record = question as {
    globalItemNumber?: unknown;
    correctOptionLabel?: unknown;
  };
  if (typeof record.globalItemNumber !== "number") return;
  into.push({
    globalItemNumber: record.globalItemNumber,
    correctOptionLabel:
      typeof record.correctOptionLabel === "string"
        ? record.correctOptionLabel.trim().toUpperCase()
        : "",
  });
}

/** Collect labeled questions from reading/listening Gemini extract shapes. */
export function collectExtractAnswerLabels(
  parsed: unknown,
): Array<{ globalItemNumber: number; correctOptionLabel: string }> {
  const labels: Array<{
    globalItemNumber: number;
    correctOptionLabel: string;
  }> = [];

  if (Array.isArray(parsed)) {
    for (const partObj of parsed) {
      if (!partObj || typeof partObj !== "object") continue;
      const items = (partObj as { items?: unknown }).items;
      if (!Array.isArray(items)) continue;
      for (const item of items) {
        if (!item || typeof item !== "object") continue;
        pushLabeledQuestion((item as { question?: unknown }).question, labels);
      }
    }
    return labels;
  }

  if (!parsed || typeof parsed !== "object") return labels;
  const record = parsed as Record<string, unknown>;

  if (Array.isArray(record.questions)) {
    for (const question of record.questions) {
      pushLabeledQuestion(question, labels);
    }
  }

  if (Array.isArray(record.passageSets)) {
    for (const set of record.passageSets) {
      if (!set || typeof set !== "object") continue;
      const setQuestions = (set as { questions?: unknown }).questions;
      if (!Array.isArray(setQuestions)) continue;
      for (const question of setQuestions) {
        pushLabeledQuestion(question, labels);
      }
    }
  }

  if (Array.isArray(record.groups)) {
    for (const group of record.groups) {
      if (!group || typeof group !== "object") continue;
      const groupQuestions = (group as { questions?: unknown }).questions;
      if (!Array.isArray(groupQuestions)) continue;
      for (const question of groupQuestions) {
        pushLabeledQuestion(question, labels);
      }
    }
  }

  return labels;
}

export function assertExtractMatchesAnswerKey(
  parsed: unknown,
  expectedKeys: Map<number, AnswerKeyLabel>,
  part: ToeicAnswerKeyPart,
): void {
  if (expectedKeys.size === 0) return;

  const mismatches: string[] = [];
  for (const question of collectExtractAnswerLabels(parsed)) {
    const expected = expectedKeys.get(question.globalItemNumber);
    if (!expected) continue;
    if (question.correctOptionLabel !== expected) {
      mismatches.push(
        `${question.globalItemNumber}: expected ${expected}, got ${question.correctOptionLabel || "?"}`,
      );
    }
  }

  if (mismatches.length === 0) return;

  const firstMismatchNumber = Number.parseInt(
    mismatches[0]?.split(":")[0] ?? "",
    10,
  );
  const partForMessage =
    Number.isFinite(firstMismatchNumber) && firstMismatchNumber > 0
      ? (toeicPartFromGlobalItemNumber(firstMismatchNumber)
          .part as ToeicAnswerKeyPart)
      : part;

  throw new AnswerKeyMismatchError(
    copy.admin.answerKey.errors.mismatchAgainstKey(
      partForMessage,
      mismatches.slice(0, 5),
      mismatches.length,
    ),
  );
}
