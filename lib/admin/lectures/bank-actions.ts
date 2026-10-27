"use server";

import {
  AdminAccessError,
  requireAdminSession,
} from "@/lib/admin/auth/require-admin";
import { isExamBook } from "@/lib/content/catalog-ids";
import { fetchQuestionExplanationsByIds } from "@/lib/content/question-explanations-db";
import { explanationFromUnknown, lectureBankSlug } from "@/lib/lectures/exercise";
import type { QuestionExplanation } from "@/lib/content/question-explanation";
import type { LectureOptionLabel } from "@/lib/lectures/types";
import { copy } from "@/lib/copy/vi";

export type LectureBankBook = { id: string; name: string };
export type LectureBankTest = { id: string; label: string };
export type LectureBankCatalog = {
  books: LectureBankBook[];
  testsByBookId: Record<string, LectureBankTest[]>;
};

export type LectureBankQuestion = {
  id: string;
  part: string;
  globalItemNumber: number;
  stem: string;
};

export type Part5QuestionCopy = {
  bankQuestionId: string;
  stem: string;
  options: { label: LectureOptionLabel; text: string }[];
  correctLabel: LectureOptionLabel;
  explanation: QuestionExplanation;
  part?: "1" | "5";
  bankBookId?: string;
  bankTestId?: string;
  bankItemNumber?: number;
};

export type LectureBankResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const PARTS = ["1", "2", "3", "4", "5", "6", "7"] as const;

function accessError(code: string): string {
  if (code === "not_signed_in") return copy.admin.lectures.errors.notSignedIn;
  if (code === "not_admin") return copy.admin.lectures.errors.notAdmin;
  return copy.admin.lectures.errors.generic;
}

export async function loadLectureBankCatalog(): Promise<
  LectureBankResult<LectureBankCatalog>
> {
  try {
    const { supabase } = await requireAdminSession();
    const [{ data: books, error: booksError }, { data: tests, error: testsError }] =
      await Promise.all([
        supabase.from("books").select("id, name, sort_order").order("sort_order"),
        supabase.from("tests").select("id, book_id, label, sort_order").order("sort_order"),
      ]);
    if (booksError) return { ok: false, error: booksError.message };
    if (testsError) return { ok: false, error: testsError.message };

    const testsByBookId: LectureBankCatalog["testsByBookId"] = {};
    for (const test of tests ?? []) {
      const bookId = test.book_id as string;
      if (!isExamBook(bookId)) continue;
      const list = testsByBookId[bookId] ?? [];
      list.push({ id: test.id as string, label: test.label as string });
      testsByBookId[bookId] = list;
    }

    return {
      ok: true,
      data: {
        books: (books ?? [])
          .filter(
            (book) =>
              isExamBook(book.id as string) &&
              (testsByBookId[book.id as string]?.length ?? 0) > 0,
          )
          .map((book) => ({ id: book.id as string, name: book.name as string })),
        testsByBookId,
      },
    };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }
    return { ok: false, error: copy.admin.lectures.errors.generic };
  }
}

export async function listLectureBankQuestions(
  testId: string,
  part: string,
  bookId: string,
): Promise<LectureBankResult<LectureBankQuestion[]>> {
  if (!PARTS.includes(part as (typeof PARTS)[number]) || !bookId) {
    return { ok: false, error: copy.admin.lectures.errors.generic };
  }
  try {
    const { supabase } = await requireAdminSession();
    const { data, error } = await supabase
      .from("questions")
      .select("id, part, global_item_number, prompt")
      .eq("book_id", bookId)
      .eq("test_id", testId)
      .eq("part", part)
      .order("global_item_number", { ascending: true });
    if (error) return { ok: false, error: error.message };

    return {
      ok: true,
      data: (data ?? []).map((row) => ({
        id: row.id as string,
        part: String(row.part),
        globalItemNumber: row.global_item_number as number,
        stem: String(row.prompt ?? "").replace(/\s+/g, " ").trim(),
      })),
    };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { ok: false, error: accessError(error.message) };
    }
    return { ok: false, error: copy.admin.lectures.errors.generic };
  }
}

const OPTION_LABELS = new Set<LectureOptionLabel>(["A", "B", "C", "D"]);

async function findBankQuestionId(
  bookId: string,
  testId: string,
  part: "1" | "5",
  globalItemNumber: number,
): Promise<LectureBankResult<string>> {
  const { supabase } = await requireAdminSession();
  const { data, error } = await supabase
    .from("questions")
    .select("id")
    .eq("book_id", bookId)
    .eq("test_id", testId)
    .eq("part", part)
    .eq("global_item_number", globalItemNumber)
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data?.id) {
    return { ok: false, error: copy.admin.lectures.errors.questionNotFound };
  }
  return { ok: true, data: String(data.id) };
}

async function copyBankMcq(
  questionId: string,
  part: "1" | "5",
): Promise<LectureBankResult<Part5QuestionCopy>> {
  const { supabase } = await requireAdminSession();
  const [{ data, error }, { data: optionData, error: optionError }] =
    await Promise.all([
      supabase
        .from("questions")
        .select("id, part, prompt, correct_option_id")
        .eq("id", questionId)
        .maybeSingle(),
      supabase
        .from("answer_options")
        .select("id, label, text, sort_order")
        .eq("question_id", questionId)
        .order("sort_order", { ascending: true }),
    ]);
  if (error) return { ok: false, error: error.message };
  if (optionError) return { ok: false, error: optionError.message };
  if (!data || String(data.part) !== part) {
    return { ok: false, error: copy.admin.lectures.errors.generic };
  }

  const optionRows = (optionData ?? []).map((option) => ({
    id: String(option.id),
    label: String(option.label),
    text: String(option.text ?? ""),
  }));
  const options = optionRows.flatMap((option) => {
    const label = option.label as LectureOptionLabel;
    if (!OPTION_LABELS.has(label)) return [];
    return [{ label, text: option.text }];
  });
  if (options.length === 0) {
    return { ok: false, error: copy.admin.lectures.errors.generic };
  }
  const correctId = data.correct_option_id == null ? null : String(data.correct_option_id);
  const correctRow = optionRows.find((option) => option.id === correctId);
  const correctLabel = (correctRow?.label ?? options[0]?.label) as LectureOptionLabel;
  const explanations = await fetchQuestionExplanationsByIds(supabase, [questionId]);

  return {
    ok: true,
    data: {
      bankQuestionId: data.id as string,
      stem: String(data.prompt ?? "").replace(/\s+/g, " ").trim(),
      options,
      correctLabel: OPTION_LABELS.has(correctLabel)
        ? correctLabel
        : options[0]!.label,
      explanation: explanationFromUnknown(explanations.get(questionId)),
      part,
    },
  };
}

function bankCopyError(error: unknown): LectureBankResult<Part5QuestionCopy> {
  if (error instanceof AdminAccessError) {
    return { ok: false, error: accessError(error.message) };
  }
  return { ok: false, error: copy.admin.lectures.errors.generic };
}

export async function copyPart5QuestionByNumber(
  bookId: string,
  testId: string,
  globalItemNumber: number,
): Promise<LectureBankResult<Part5QuestionCopy>> {
  if (!Number.isInteger(globalItemNumber) || globalItemNumber < 101 || globalItemNumber > 130) {
    return { ok: false, error: copy.admin.lectures.errors.questionNotFound };
  }
  try {
    const found = await findBankQuestionId(bookId, testId, "5", globalItemNumber);
    if (!found.ok) return found;
    return copyBankMcq(found.data, "5");
  } catch (error) {
    return bankCopyError(error);
  }
}

export async function copyPart1QuestionByNumber(
  bookId: string,
  testId: string,
  globalItemNumber: number,
): Promise<LectureBankResult<Part5QuestionCopy>> {
  const bankBookId = lectureBankSlug(bookId);
  const bankTestId = lectureBankSlug(testId);
  if (
    !bankBookId ||
    !bankTestId ||
    !Number.isInteger(globalItemNumber) ||
    globalItemNumber < 1 ||
    globalItemNumber > 6
  ) {
    return { ok: false, error: copy.admin.lectures.errors.questionNotFound };
  }
  try {
    const found = await findBankQuestionId(bankBookId, bankTestId, "1", globalItemNumber);
    if (!found.ok) return found;
    const copied = await copyBankMcq(found.data, "1");
    if (!copied.ok) return copied;
    return {
      ok: true,
      data: {
        ...copied.data,
        bankBookId,
        bankTestId,
        bankItemNumber: globalItemNumber,
      },
    };
  } catch (error) {
    return bankCopyError(error);
  }
}

export async function copyPart5Question(
  questionId: string,
): Promise<LectureBankResult<Part5QuestionCopy>> {
  try {
    return await copyBankMcq(questionId, "5");
  } catch (error) {
    return bankCopyError(error);
  }
}
