import type { SupabaseClient } from "@supabase/supabase-js";

export interface ListeningTagExportStatement {
  label: string;
  text: string;
}

export interface ListeningPart1TagExportEntry {
  id: string;
  globalItemNumber: number;
  statements: ListeningTagExportStatement[];
}

export interface ListeningPart2TagExportEntry {
  id: string;
  globalItemNumber: number;
  transcript: string;
}

type AnswerOptionRow = {
  label: string | null;
  text: string | null;
  sort_order: number | null;
};

type QuestionExportRow = {
  id: string;
  global_item_number: number;
  answer_options: AnswerOptionRow[] | null;
};

function sortStatements(options: AnswerOptionRow[]): ListeningTagExportStatement[] {
  return [...options]
    .sort((left, right) => {
      const order = (left.sort_order ?? 0) - (right.sort_order ?? 0);
      if (order !== 0) return order;
      return (left.label ?? "").localeCompare(right.label ?? "");
    })
    .map((option) => ({
      label: (option.label ?? "").trim(),
      text: (option.text ?? "").trim(),
    }))
    .filter((option) => option.label && option.text);
}

async function loadPartQuestions(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
  part: 1 | 2,
): Promise<QuestionExportRow[]> {
  const { data, error } = await supabase
    .from("questions")
    .select(
      `
      id,
      global_item_number,
      answer_options!answer_options_question_id_fkey (
        label,
        text,
        sort_order
      )
    `,
    )
    .eq("book_id", bookId)
    .eq("test_id", testId)
    .eq("part", String(part))
    .order("global_item_number", { ascending: true });

  if (error) throw error;
  return (data ?? []) as QuestionExportRow[];
}

export async function buildListeningPart1TagExport(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
): Promise<ListeningPart1TagExportEntry[]> {
  const rows = await loadPartQuestions(supabase, bookId, testId, 1);
  if (rows.length === 0) {
    throw new Error("This test has no Part 1 questions to tag.");
  }

  return rows.map((row) => {
    const statements = sortStatements(row.answer_options ?? []);
    if (statements.length === 0) {
      throw new Error(
        `Part 1 item ${row.global_item_number} has no spoken statements.`,
      );
    }
    return {
      id: row.id,
      globalItemNumber: row.global_item_number,
      statements,
    };
  });
}

export async function buildListeningPart2TagExport(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
): Promise<ListeningPart2TagExportEntry[]> {
  const rows = await loadPartQuestions(supabase, bookId, testId, 2);
  if (rows.length === 0) {
    throw new Error("This test has no Part 2 questions to tag.");
  }

  const ids = rows.map((row) => row.id);
  const { data, error } = await supabase
    .from("listening_part2_items")
    .select("question_id, transcript")
    .in("question_id", ids);

  if (error) throw error;

  const transcriptByQuestion = new Map<string, string>();
  for (const item of (data ?? []) as Array<{
    question_id: string;
    transcript: string | null;
  }>) {
    const transcript = (item.transcript ?? "").trim();
    if (transcript) transcriptByQuestion.set(item.question_id, transcript);
  }

  return rows.map((row) => {
    const transcript = transcriptByQuestion.get(row.id);
    if (!transcript) {
      throw new Error(
        `Part 2 item ${row.global_item_number} has no transcript.`,
      );
    }
    return {
      id: row.id,
      globalItemNumber: row.global_item_number,
      transcript,
    };
  });
}
