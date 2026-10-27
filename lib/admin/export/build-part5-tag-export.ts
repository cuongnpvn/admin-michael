import type { SupabaseClient } from "@supabase/supabase-js";

export interface Part5TagExportOption {
  label: string;
  text: string;
}

export interface Part5TagExportEntry {
  id: string;
  globalItemNumber: number;
  prompt: string;
  options: Part5TagExportOption[];
}

type AnswerOptionRow = {
  label: string | null;
  text: string | null;
  sort_order: number | null;
};

function sortOptions(options: AnswerOptionRow[]): Part5TagExportOption[] {
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

export async function buildPart5TagExport(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
): Promise<Part5TagExportEntry[]> {
  const { data, error } = await supabase
    .from("questions")
    .select(
      `
      id,
      global_item_number,
      prompt,
      answer_options!answer_options_question_id_fkey (
        label,
        text,
        sort_order
      )
    `,
    )
    .eq("book_id", bookId)
    .eq("test_id", testId)
    .eq("part", "5")
    .order("global_item_number", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const optionRows = Array.isArray(row.answer_options)
      ? (row.answer_options as AnswerOptionRow[])
      : [];
    return {
      id: row.id,
      globalItemNumber: row.global_item_number,
      prompt: row.prompt ?? "",
      options: sortOptions(optionRows),
    };
  });
}
