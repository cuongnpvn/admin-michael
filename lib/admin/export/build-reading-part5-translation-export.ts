import type { SupabaseClient } from "@supabase/supabase-js";
import { loadAdminPartEditor } from "@/lib/admin/content/load-part-editor";
import type { ReadingPart5TranslationExportEntry } from "@/lib/content/reading-part5-translation-export-schema";
import { fillPart5PromptWithBoldAnswer } from "@/lib/reading/part5-fill-prompt";

function exportTextsForPart5(
  prompt: string,
  options: Array<{ id: string; text: string }>,
  correctOptionId: string | null,
): Array<{ english: string }> | null {
  const sortedOptions = [...options];
  if (sortedOptions.length !== 4 || !correctOptionId) {
    return null;
  }

  const optionTexts = sortedOptions.map((option) => option.text.trim());
  if (optionTexts.some((text) => text.length === 0)) {
    return null;
  }

  const filledPrompt = fillPart5PromptWithBoldAnswer(
    prompt.trim(),
    sortedOptions,
    correctOptionId,
  ).trim();
  if (!filledPrompt) {
    return null;
  }

  return [
    { english: filledPrompt },
    ...optionTexts.map((english) => ({ english })),
  ];
}

export async function buildReadingPart5TranslationExport(
  supabase: SupabaseClient,
  bookId: string,
  testId: string,
): Promise<ReadingPart5TranslationExportEntry[]> {
  const editorData = await loadAdminPartEditor(supabase, bookId, testId, 5);
  if (!editorData) {
    return [];
  }

  const entries: ReadingPart5TranslationExportEntry[] = [];

  for (const question of editorData.questions) {
    const sortedOptions = [...question.options].sort(
      (left, right) => left.sortOrder - right.sortOrder,
    );
    const texts = exportTextsForPart5(
      question.prompt,
      sortedOptions.map((option) => ({ id: option.id, text: option.text })),
      question.correctOptionId,
    );
    if (!texts) {
      continue;
    }

    entries.push({
      questionId: question.slug,
      texts,
    });
  }

  return entries.sort((left, right) =>
    left.questionId.localeCompare(right.questionId),
  );
}
