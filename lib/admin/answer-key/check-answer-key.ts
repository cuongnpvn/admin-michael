import type { SupabaseClient } from "@supabase/supabase-js";
import {
  loadAnswerKeys,
  type AnswerKeyLabel,
} from "@/lib/admin/answer-key/load-answer-keys";

export interface AnswerKeyMismatch {
  globalItemNumber: number;
  part: number;
  questionLabel: AnswerKeyLabel | null;
  answerKeyLabel: AnswerKeyLabel;
}

export interface CheckAnswerKeySummary {
  questionCount: number;
  answerKeyCount: number;
  matched: number;
  mismatched: number;
  questionUnset: number;
  missingAnswerKey: number;
  missingQuestion: number;
}

export interface CheckAnswerKeyResult {
  bookId: string;
  testId: string;
  hasAnswerKeys: boolean;
  summary: CheckAnswerKeySummary;
  mismatches: AnswerKeyMismatch[];
}

interface QuestionRow {
  id: string;
  global_item_number: number;
  part: string;
  correct_option_id: string | null;
}

interface OptionRow {
  id: string;
  question_id: string;
  label: string;
}

function parsePartNumber(part: string): number {
  return Number.parseInt(part, 10);
}

function asAnswerLabel(label: string | null | undefined): AnswerKeyLabel | null {
  if (!label) return null;
  const normalized = label.trim().toUpperCase();
  if (
    normalized !== "A" &&
    normalized !== "B" &&
    normalized !== "C" &&
    normalized !== "D"
  ) {
    return null;
  }
  return normalized;
}

export async function checkAnswerKeyConsistency(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
): Promise<CheckAnswerKeyResult> {
  const answerKeys = await loadAnswerKeys(supabase, bookId, testId);
  const answerKeyByGlobal = new Map(
    answerKeys.map((entry) => [entry.globalItemNumber, entry]),
  );

  const { data: questionRows, error: questionError } = await supabase
    .from("questions")
    .select("id, global_item_number, part, correct_option_id")
    .eq("book_id", bookId)
    .eq("test_id", testId)
    .order("global_item_number");

  if (questionError) throw questionError;

  const questions = (questionRows ?? []) as QuestionRow[];
  const questionByGlobal = new Map(
    questions.map((row) => [row.global_item_number, row]),
  );

  const questionIds = questions.map((row) => row.id);
  const optionLabelById = new Map<string, string>();

  if (questionIds.length > 0) {
    const { data: optionRows, error: optionError } = await supabase
      .from("answer_options")
      .select("id, question_id, label")
      .in("question_id", questionIds);

    if (optionError) throw optionError;

    for (const option of (optionRows ?? []) as OptionRow[]) {
      optionLabelById.set(option.id, option.label);
    }
  }

  let matched = 0;
  let mismatched = 0;
  let questionUnset = 0;
  let missingAnswerKey = 0;
  let missingQuestion = 0;
  const mismatches: AnswerKeyMismatch[] = [];

  for (const question of questions) {
    const key = answerKeyByGlobal.get(question.global_item_number);
    if (!key) {
      missingAnswerKey += 1;
      continue;
    }

    if (!question.correct_option_id) {
      questionUnset += 1;
      continue;
    }

    const questionLabel = asAnswerLabel(
      optionLabelById.get(question.correct_option_id),
    );

    if (questionLabel == null) {
      questionUnset += 1;
      continue;
    }

    if (questionLabel === key.answerLabel) {
      matched += 1;
      continue;
    }

    mismatched += 1;
    mismatches.push({
      globalItemNumber: question.global_item_number,
      part: parsePartNumber(question.part),
      questionLabel,
      answerKeyLabel: key.answerLabel,
    });
  }

  for (const entry of answerKeys) {
    if (!questionByGlobal.has(entry.globalItemNumber)) {
      missingQuestion += 1;
    }
  }

  mismatches.sort((a, b) => a.globalItemNumber - b.globalItemNumber);

  return {
    bookId,
    testId,
    hasAnswerKeys: answerKeys.length > 0,
    summary: {
      questionCount: questions.length,
      answerKeyCount: answerKeys.length,
      matched,
      mismatched,
      questionUnset,
      missingAnswerKey,
      missingQuestion,
    },
    mismatches,
  };
}
